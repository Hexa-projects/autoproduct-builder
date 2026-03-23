import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCartStore } from '@/stores/cartStore';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Loader2, MapPin, Phone, User, Mail, AlertTriangle, Building,
} from 'lucide-react';
import { z } from 'zod';

// ── Blocked‑region postal prefixes ──
const BLOCKED_POSTAL_PREFIXES = ['35', '38', '07', '51', '52'];
const BLOCKED_KEYWORDS = [
  'canarias', 'canaria', 'tenerife', 'gran canaria', 'lanzarote',
  'fuerteventura', 'la palma', 'la gomera', 'el hierro',
  'baleares', 'balear', 'mallorca', 'menorca', 'ibiza', 'formentera',
  'ceuta', 'melilla',
];

function isBlockedRegion(postalCode: string, city: string, province: string): boolean {
  const zip = postalCode.trim();
  if (BLOCKED_POSTAL_PREFIXES.some((p) => zip.startsWith(p))) return true;
  const lower = `${city} ${province}`.toLowerCase();
  return BLOCKED_KEYWORDS.some((kw) => lower.includes(kw));
}

// Spanish phone: +34 or 0034 prefix optional, then 6/7/8/9 + 8 digits
const SPAIN_PHONE_RE = /^(?:\+34|0034)?[6789]\d{8}$/;
// Spanish postal code: 5 digits, 01000–52999
const SPAIN_POSTAL_RE = /^(?:0[1-9]|[1-4]\d|5[0-2])\d{3}$/;
// Address must contain at least a number (street number)
const ADDRESS_NUMBER_RE = /\d+/;
// Name must contain at least two words (first + last)
const TWO_WORDS_RE = /^\S+\s+\S+/;
// Letters only (including Spanish chars)
const LETTERS_ONLY_RE = /^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑàèìòùÀÈÌÒÙ\s\-'.]+$/;

const orderSchema = z.object({
  customerName: z
    .string()
    .trim()
    .min(2, 'Nombre demasiado corto')
    .max(100)
    .refine((v) => TWO_WORDS_RE.test(v), 'Introduce nombre y apellido.'),
  customerPhone: z
    .string()
    .trim()
    .transform((v) => v.replace(/[\s\-().]/g, ''))
    .refine((v) => SPAIN_PHONE_RE.test(v), 'Introduce un teléfono español válido (9 dígitos, ej: 612345678).'),
  customerEmail: z
    .string()
    .trim()
    .email('Email no válido.')
    .max(255)
    .optional()
    .or(z.literal('')),
  address: z
    .string()
    .trim()
    .min(5, 'Dirección demasiado corta')
    .max(200)
    .refine((v) => ADDRESS_NUMBER_RE.test(v), 'La dirección debe incluir número de calle/portal.'),
  city: z
    .string()
    .trim()
    .min(2, 'Ciudad requerida')
    .max(100)
    .refine((v) => LETTERS_ONLY_RE.test(v), 'Ciudad no válida. Solo letras.'),
  postalCode: z
    .string()
    .trim()
    .refine((v) => SPAIN_POSTAL_RE.test(v), 'Código postal español no válido (5 dígitos, ej: 28001).')
    .refine(
      (v) => !BLOCKED_POSTAL_PREFIXES.some((p) => v.startsWith(p)),
      'No realizamos envíos a esta zona (Canarias, Baleares, Ceuta o Melilla).',
    ),
  province: z
    .string()
    .trim()
    .min(2, 'Provincia requerida')
    .max(100)
    .refine((v) => LETTERS_ONLY_RE.test(v), 'Provincia no válida. Solo letras.'),
});

type OrderForm = z.infer<typeof orderSchema>;

interface CODCheckoutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function generateExternalOrderId(): string {
  return `lov_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function CODCheckoutModal({ open, onOpenChange }: CODCheckoutModalProps) {
  const navigate = useNavigate();
  const { items, clearCart } = useCartStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof OrderForm, string>>>({});
  const [form, setForm] = useState<OrderForm>({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    address: '',
    city: '',
    postalCode: '',
    province: '',
  });

  const externalIdRef = useRef<string>(generateExternalOrderId());

  const subtotal = items.reduce((sum, item) => sum + parseFloat(item.price.amount) * item.quantity, 0);
  const shippingCost = 0;
  const total = subtotal + shippingCost;

  const updateField = (field: keyof OrderForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = orderSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof OrderForm, string>> = {};
      result.error.issues.forEach((issue) => {
        const key = issue.path[0] as keyof OrderForm;
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    if (isBlockedRegion(result.data.postalCode, result.data.city, result.data.province)) {
      toast.error('Zona no disponible', {
        description: 'Actualmente no realizamos envíos a Canarias, Baleares, Ceuta ni Melilla.',
      });
      return;
    }

    if (items.length === 0) {
      toast.error('Tu carrito está vacío');
      return;
    }

    setIsSubmitting(true);
    try {
      const orderItems = items.map((item) => ({
        title: item.product.node.title,
        variantId: item.variantId,
        variant: item.selectedOptions.map((o) => o.value).join(' / '),
        quantity: item.quantity,
        price: item.price.amount,
      }));

      const { data, error } = await supabase.functions.invoke('create-shopify-order', {
        body: {
          customerName: result.data.customerName,
          customerPhone: result.data.customerPhone,
          customerEmail: result.data.customerEmail || undefined,
          address: result.data.address,
          city: result.data.city,
          postalCode: result.data.postalCode,
          province: result.data.province,
          items: orderItems,
          subtotal,
          shippingCost,
          total,
          externalOrderId: externalIdRef.current,
        },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Error al procesar el pedido');

      if (data.duplicate) {
        toast.info('Este pedido ya fue registrado anteriormente.');
      }

      clearCart();
      onOpenChange(false);
      externalIdRef.current = generateExternalOrderId();
      navigate('/pedido-confirmado');
    } catch (err: any) {
      console.error('Order submission error:', err);
      const message = err?.message || '';
      toast.error('Error al enviar el pedido', {
        description: message.includes('zona') || message.includes('envíos')
          ? message
          : 'Inténtalo de nuevo o contáctanos por teléfono.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] p-0 gap-0 overflow-hidden max-h-[90vh] overflow-y-auto rounded-xl">
        <DialogTitle className="sr-only">Formulario de pedido contra reembolso</DialogTitle>

        {/* Shipping badge */}
        <div className="flex items-center justify-between border-b px-5 pr-12 py-3 bg-muted/30">
          <div className="flex items-center gap-2">
            <div className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-accent">
              <div className="h-2.5 w-2.5 rounded-full bg-accent" />
            </div>
            <span className="text-sm font-medium">Envío Gratis 24-48 Horas</span>
          </div>
          <span className="text-sm font-bold text-accent">Gratis</span>
        </div>

        {/* Header */}
        <div className="px-5 pt-4 pb-3 text-center">
          <h2 className="text-base font-bold leading-tight sm:text-lg" style={{ fontFamily: 'Space Grotesk' }}>
            🚚 FORMULARIO PARA PAGO CONTRAREEMBOLSO CON ENVÍO GRATUITO EN 24-48 HORAS 🚚
          </h2>
        </div>

        {/* Product summary */}
        <div className="mx-5 mb-3 space-y-2">
          {items.map((item) => {
            const img = item.product.node.images?.edges?.[0]?.node;
            return (
              <div key={item.variantId} className="flex items-center gap-3 rounded-lg border bg-muted/30 p-2.5">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md bg-muted border">
                  {img && <img src={img.url} alt="" className="h-full w-full object-cover" />}
                  <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground shadow-sm">
                    {item.quantity}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold leading-tight line-clamp-2">{item.product.node.title}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {item.selectedOptions.map((o) => o.value).join(' · ')}
                  </p>
                </div>
                <p className="text-sm font-bold tabular-nums shrink-0">€{(parseFloat(item.price.amount) * item.quantity).toFixed(2)}</p>
              </div>
            );
          })}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-5 pb-5 space-y-3">
          <FormRow icon={<User className="h-4 w-4 text-muted-foreground" />} label="Nombre Completo" required>
            <Input
              value={form.customerName}
              onChange={(e) => updateField('customerName', e.target.value)}
              placeholder="Nombre y Apellido"
              className={`border-0 bg-transparent shadow-none focus-visible:ring-0 h-9 text-sm ${errors.customerName ? 'placeholder:text-destructive' : ''}`}
            />
            {errors.customerName && <p className="text-[10px] text-destructive px-1">{errors.customerName}</p>}
          </FormRow>

          <FormRow icon={<Phone className="h-4 w-4 text-muted-foreground" />} label="Teléfono" required>
            <Input
              type="tel"
              value={form.customerPhone}
              onChange={(e) => updateField('customerPhone', e.target.value)}
              placeholder="612 345 678"
              className={`border-0 bg-transparent shadow-none focus-visible:ring-0 h-9 text-sm ${errors.customerPhone ? 'placeholder:text-destructive' : ''}`}
            />
            {errors.customerPhone && <p className="text-[10px] text-destructive px-1">{errors.customerPhone}</p>}
          </FormRow>

          <FormRow icon={<Mail className="h-4 w-4 text-muted-foreground" />} label="Email">
            <Input
              type="email"
              value={form.customerEmail}
              onChange={(e) => updateField('customerEmail', e.target.value)}
              placeholder="email@ejemplo.com (opcional)"
              className={`border-0 bg-transparent shadow-none focus-visible:ring-0 h-9 text-sm ${errors.customerEmail ? 'placeholder:text-destructive' : ''}`}
            />
            {errors.customerEmail && <p className="text-[10px] text-destructive px-1">{errors.customerEmail}</p>}
          </FormRow>

          <FormRow icon={<MapPin className="h-4 w-4 text-muted-foreground" />} label="Dirección" required>
            <Input
              value={form.address}
              onChange={(e) => updateField('address', e.target.value)}
              placeholder="Calle, Número, Piso y Puerta"
              className={`border-0 bg-transparent shadow-none focus-visible:ring-0 h-9 text-sm ${errors.address ? 'placeholder:text-destructive' : ''}`}
            />
            {errors.address && <p className="text-[10px] text-destructive px-1">{errors.address}</p>}
          </FormRow>

          <div className="grid grid-cols-2 gap-3">
            <FormRow icon={<Building className="h-4 w-4 text-muted-foreground" />} label="Ciudad" required>
              <Input
                value={form.city}
                onChange={(e) => updateField('city', e.target.value)}
                placeholder="Ciudad"
                className={`border-0 bg-transparent shadow-none focus-visible:ring-0 h-9 text-sm ${errors.city ? 'placeholder:text-destructive' : ''}`}
              />
              {errors.city && <p className="text-[10px] text-destructive px-1">{errors.city}</p>}
            </FormRow>

            <FormRow icon={<MapPin className="h-4 w-4 text-muted-foreground" />} label="C. Postal" required>
              <Input
                value={form.postalCode}
                onChange={(e) => updateField('postalCode', e.target.value)}
                placeholder="28001"
                className={`border-0 bg-transparent shadow-none focus-visible:ring-0 h-9 text-sm ${errors.postalCode ? 'placeholder:text-destructive' : ''}`}
              />
              {errors.postalCode && <p className="text-[10px] text-destructive px-1">{errors.postalCode}</p>}
            </FormRow>
          </div>

          <FormRow icon={<MapPin className="h-4 w-4 text-muted-foreground" />} label="Provincia" required>
            <Input
              value={form.province}
              onChange={(e) => updateField('province', e.target.value)}
              placeholder="Provincia"
              className={`border-0 bg-transparent shadow-none focus-visible:ring-0 h-9 text-sm ${errors.province ? 'placeholder:text-destructive' : ''}`}
            />
            {errors.province && <p className="text-[10px] text-destructive px-1">{errors.province}</p>}
          </FormRow>

          {/* Warning */}
          <div className="flex items-start gap-2 rounded-lg bg-warning/10 p-3">
            <AlertTriangle className="h-4 w-4 shrink-0 text-warning mt-0.5" />
            <p className="text-xs text-foreground leading-relaxed">
              <strong>Por favor, asegúrese de que su dirección está completa</strong> antes de finalizar su pedido: Calle, número y puerta
            </p>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            size="lg"
            className="w-full min-h-[52px] text-sm font-bold uppercase tracking-wide gap-2 bg-accent text-accent-foreground hover:bg-accent/90 active:scale-[0.97] sm:text-base"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              `COMPLETAR MI PEDIDO €${total.toFixed(2)}`
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function FormRow({ icon, label, required, children }: {
  icon: React.ReactNode;
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-3">
        <div className="w-24 shrink-0">
          <span className="text-xs font-bold leading-tight">
            {label}
            {required && <span className="text-destructive ml-0.5">*</span>}
          </span>
        </div>
        <div className="flex flex-1 items-center gap-2 rounded-lg border bg-background px-3">
          {icon}
          <div className="flex-1">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
