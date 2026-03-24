import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCartStore } from '@/stores/cartStore';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Loader2, MapPin, Phone, User, Mail, AlertTriangle, Building, CheckSquare,
  ShieldCheck, Truck, Banknote, RotateCcw, Lock,
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { z } from 'zod';
import {
  trackCODFormStart, trackCODFormSubmit, trackCODFormError, trackCODFormAbandon, trackInitiateCheckout,
} from '@/lib/tracking';

// ── Draft persistence ──
const DRAFT_KEY = 'rf_cod_draft';

function saveDraft(form: OrderForm) {
  try { sessionStorage.setItem(DRAFT_KEY, JSON.stringify(form)); } catch {}
}

function loadDraft(): OrderForm | null {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function clearDraft() {
  try { sessionStorage.removeItem(DRAFT_KEY); } catch {}
}

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

const PROVINCES = [
  'Álava', 'Albacete', 'Alicante', 'Almería', 'Asturias', 'Ávila', 'Badajoz', 'Barcelona',
  'Burgos', 'Cáceres', 'Cádiz', 'Cantabria', 'Castellón', 'Ciudad Real', 'Córdoba', 'Cuenca',
  'Gerona', 'Granada', 'Guadalajara', 'Guipúzcoa', 'Huelva', 'Huesca', 'Jaén', 'La Coruña',
  'La Rioja', 'León', 'Lérida', 'Lugo', 'Madrid', 'Málaga', 'Murcia', 'Navarra', 'Orense',
  'Palencia', 'Pontevedra', 'Salamanca', 'Segovia', 'Sevilla', 'Soria', 'Tarragona', 'Teruel',
  'Toledo', 'Valencia', 'Valladolid', 'Vizcaya', 'Zamora', 'Zaragoza',
];

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
    .refine((v) => SPAIN_PHONE_RE.test(v), 'Teléfono español válido (ej: 612345678).'),
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
    .refine((v) => ADDRESS_NUMBER_RE.test(v), 'Incluye número de calle/portal.'),
  city: z
    .string()
    .trim()
    .min(2, 'Ciudad requerida')
    .max(100)
    .refine((v) => LETTERS_ONLY_RE.test(v), 'Ciudad no válida.'),
  postalCode: z
    .string()
    .trim()
    .refine((v) => SPAIN_POSTAL_RE.test(v), 'Código postal no válido (5 dígitos).')
    .refine(
      (v) => !BLOCKED_POSTAL_PREFIXES.some((p) => v.startsWith(p)),
      'No enviamos a esta zona (Canarias, Baleares, Ceuta o Melilla).',
    ),
  province: z
    .string()
    .trim()
    .min(2, 'Provincia requerida')
    .max(100),
});

type OrderForm = z.infer<typeof orderSchema>;

interface CODCheckoutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function generateExternalOrderId(): string {
  return `lov_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

// Progress steps
const STEPS = ['Datos personales', 'Dirección de envío', 'Confirmación'];

export function CODCheckoutModal({ open, onOpenChange }: CODCheckoutModalProps) {
  const navigate = useNavigate();
  const { items, clearCart } = useCartStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof OrderForm, string>>>({});
  const [step, setStep] = useState(0); // 0: personal, 1: address, 2: confirm
  const [formStartTracked, setFormStartTracked] = useState(false);
  const formOpenedAt = useRef<number>(Date.now());

  const defaultForm: OrderForm = {
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    address: '',
    city: '',
    postalCode: '',
    province: '',
  };

  const [form, setForm] = useState<OrderForm>(() => loadDraft() || defaultForm);
  const externalIdRef = useRef<string>(generateExternalOrderId());

  // Track form start
  useEffect(() => {
    if (open && !formStartTracked) {
      trackCODFormStart();
      trackInitiateCheckout({
        value: items.reduce((s, i) => s + parseFloat(i.price.amount) * i.quantity, 0),
        currency: 'EUR',
        numItems: items.reduce((s, i) => s + i.quantity, 0),
      });
      setFormStartTracked(true);
      formOpenedAt.current = Date.now();
    }
    if (!open) {
      setFormStartTracked(false);
      setStep(0);
    }
  }, [open]);

  // Track abandon on close
  const handleClose = useCallback((newOpen: boolean) => {
    if (!newOpen && formStartTracked) {
      const filled = Object.entries(form).filter(([, v]) => v.trim().length > 0).map(([k]) => k);
      if (filled.length > 0) {
        trackCODFormAbandon(filled);
      }
    }
    onOpenChange(newOpen);
  }, [form, formStartTracked, onOpenChange]);

  // Save draft on form change
  useEffect(() => {
    if (open) saveDraft(form);
  }, [form, open]);

  const subtotal = items.reduce((sum, item) => sum + parseFloat(item.price.amount) * item.quantity, 0);
  const shippingCost = 0;
  const total = subtotal + shippingCost;

  const updateField = (field: keyof OrderForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validateStep = (stepIdx: number): boolean => {
    const result = orderSchema.safeParse(form);
    if (result.success) return true;

    const fieldErrors: Partial<Record<keyof OrderForm, string>> = {};
    result.error.issues.forEach((issue) => {
      const key = issue.path[0] as keyof OrderForm;
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    });

    // Only check fields for current step
    const stepFields: (keyof OrderForm)[][] = [
      ['customerName', 'customerPhone', 'customerEmail'],
      ['address', 'city', 'postalCode', 'province'],
      [],
    ];

    const relevantErrors: Partial<Record<keyof OrderForm, string>> = {};
    let hasError = false;
    stepFields[stepIdx].forEach((f) => {
      if (fieldErrors[f]) { relevantErrors[f] = fieldErrors[f]; hasError = true; }
    });

    if (hasError) {
      setErrors(relevantErrors);
      trackCODFormError(Object.keys(relevantErrors));
      return false;
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setErrors({});
      setStep((s) => Math.min(s + 1, 2));
    }
  };

  const prevStep = () => setStep((s) => Math.max(s - 1, 0));

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
      trackCODFormError(Object.keys(fieldErrors));
      return;
    }

    if (isBlockedRegion(result.data.postalCode, result.data.city, result.data.province)) {
      toast.error('Zona no disponible', {
        description: 'No realizamos envíos a Canarias, Baleares, Ceuta ni Melilla.',
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

      const numItems = items.reduce((s, i) => s + i.quantity, 0);

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
          _hp: '', // honeypot - must be empty
          _ts: formOpenedAt.current, // timestamp for bot detection
        },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Error al procesar el pedido');

      if (data.duplicate) {
        toast.info('Este pedido ya fue registrado anteriormente.');
      }

      trackCODFormSubmit({ value: total, currency: 'EUR', numItems });

      // Store order data for Purchase pixel event
      sessionStorage.setItem('rf_last_order', JSON.stringify({
        total,
        currency: 'EUR',
        orderId: externalIdRef.current,
        numItems,
      }));

      clearDraft();
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
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="sm:max-w-[500px] p-0 gap-0 overflow-hidden max-h-[90vh] overflow-y-auto rounded-xl"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogTitle className="sr-only">Formulario de pedido contra reembolso</DialogTitle>

        {/* Progress bar */}
        <div className="px-5 pt-4 pb-2">
          <div className="flex items-center gap-1">
            {STEPS.map((label, i) => (
              <div key={label} className="flex-1 flex flex-col items-center gap-1">
                <div className="flex items-center w-full">
                  <div className={`h-1.5 w-full rounded-full transition-colors ${i <= step ? 'bg-accent' : 'bg-muted'}`} />
                </div>
                <span className={`text-[9px] font-medium transition-colors ${i <= step ? 'text-accent' : 'text-muted-foreground'}`}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Shipping badge */}
        <div className="flex items-center justify-between border-b px-5 pr-12 py-2.5 bg-accent/5">
          <div className="flex items-center gap-2">
            <Truck className="h-4 w-4 text-accent" />
            <span className="text-xs font-medium">Envío Gratis · 24-48h</span>
          </div>
          <span className="text-xs font-bold text-accent">€0,00</span>
        </div>

        {/* Product summary (always visible, compact) */}
        <div className="mx-5 my-3 space-y-1.5">
          {items.map((item) => {
            const img = item.product.node.images?.edges?.[0]?.node;
            return (
              <div key={item.variantId} className="flex items-center gap-2.5 rounded-lg border bg-muted/20 p-2">
                <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-md bg-muted border">
                  {img && <img src={img.url} alt="" className="h-full w-full object-cover" />}
                  <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[9px] font-bold text-accent-foreground shadow-sm">
                    {item.quantity}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold leading-tight line-clamp-1">{item.product.node.title}</p>
                  <p className="text-[9px] text-muted-foreground">{item.selectedOptions.map((o) => o.value).join(' · ')}</p>
                </div>
                <p className="text-xs font-bold tabular-nums shrink-0">€{(parseFloat(item.price.amount) * item.quantity).toFixed(2)}</p>
              </div>
            );
          })}
          {/* Total row */}
          <div className="flex items-center justify-between pt-1 border-t">
            <span className="text-xs font-semibold">Total a pagar al recibir:</span>
            <span className="text-base font-bold text-accent tabular-nums">€{total.toFixed(2)}</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-5 pb-5">
          {/* Honeypot - invisible to real users, bots will fill it */}
          <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', top: '-9999px', opacity: 0, height: 0, overflow: 'hidden' }}>
            <input
              type="text"
              name="website_url"
              tabIndex={-1}
              autoComplete="off"
              onChange={() => {}}
            />
          </div>

          {/* Step 0: Personal data */}
          {step === 0 && (
            <div className="space-y-3 animate-in fade-in slide-in-from-right-2 duration-200">
              <FormRow icon={<User className="h-4 w-4 text-muted-foreground" />} label="Nombre completo" required>
                <Input
                  value={form.customerName}
                  onChange={(e) => updateField('customerName', e.target.value)}
                  placeholder="Nombre y Apellido"
                  autoComplete="name"
                  className={`border-0 bg-transparent shadow-none focus-visible:ring-0 h-10 text-sm ${errors.customerName ? 'placeholder:text-destructive' : ''}`}
                />
                {errors.customerName && <p className="text-[10px] text-destructive px-1">{errors.customerName}</p>}
              </FormRow>

              <FormRow icon={<Phone className="h-4 w-4 text-muted-foreground" />} label="Teléfono" required>
                <Input
                  type="tel"
                  value={form.customerPhone}
                  onChange={(e) => updateField('customerPhone', e.target.value)}
                  placeholder="612 345 678"
                  autoComplete="tel"
                  className={`border-0 bg-transparent shadow-none focus-visible:ring-0 h-10 text-sm ${errors.customerPhone ? 'placeholder:text-destructive' : ''}`}
                />
                {errors.customerPhone && <p className="text-[10px] text-destructive px-1">{errors.customerPhone}</p>}
              </FormRow>

              <FormRow icon={<Mail className="h-4 w-4 text-muted-foreground" />} label="Email">
                <Input
                  type="email"
                  value={form.customerEmail}
                  onChange={(e) => updateField('customerEmail', e.target.value)}
                  placeholder="email@ejemplo.com (opcional)"
                  autoComplete="email"
                  className={`border-0 bg-transparent shadow-none focus-visible:ring-0 h-10 text-sm ${errors.customerEmail ? 'placeholder:text-destructive' : ''}`}
                />
                {errors.customerEmail && <p className="text-[10px] text-destructive px-1">{errors.customerEmail}</p>}
              </FormRow>

              <Button
                type="button"
                size="lg"
                onClick={nextStep}
                className="w-full min-h-[48px] text-sm font-semibold gap-2 bg-accent text-accent-foreground hover:bg-accent/90 active:scale-[0.97]"
              >
                Continuar →
              </Button>
            </div>
          )}

          {/* Step 1: Address */}
          {step === 1 && (
            <div className="space-y-3 animate-in fade-in slide-in-from-right-2 duration-200">
              <FormRow icon={<MapPin className="h-4 w-4 text-muted-foreground" />} label="Dirección" required>
                <Input
                  value={form.address}
                  onChange={(e) => updateField('address', e.target.value)}
                  placeholder="Calle, Nº, Piso y Puerta"
                  autoComplete="street-address"
                  className={`border-0 bg-transparent shadow-none focus-visible:ring-0 h-10 text-sm ${errors.address ? 'placeholder:text-destructive' : ''}`}
                />
                {errors.address && <p className="text-[10px] text-destructive px-1">{errors.address}</p>}
              </FormRow>

              <div className="grid grid-cols-2 gap-3">
                <FormRow icon={<Building className="h-4 w-4 text-muted-foreground" />} label="Ciudad" required>
                  <Input
                    value={form.city}
                    onChange={(e) => updateField('city', e.target.value)}
                    placeholder="Madrid"
                    autoComplete="address-level2"
                    className={`border-0 bg-transparent shadow-none focus-visible:ring-0 h-10 text-sm ${errors.city ? 'placeholder:text-destructive' : ''}`}
                  />
                  {errors.city && <p className="text-[10px] text-destructive px-1">{errors.city}</p>}
                </FormRow>

                <FormRow icon={<MapPin className="h-4 w-4 text-muted-foreground" />} label="C. Postal" required>
                  <Input
                    value={form.postalCode}
                    onChange={(e) => updateField('postalCode', e.target.value.replace(/\D/g, '').slice(0, 5))}
                    placeholder="28001"
                    inputMode="numeric"
                    maxLength={5}
                    autoComplete="postal-code"
                    className={`border-0 bg-transparent shadow-none focus-visible:ring-0 h-10 text-sm ${errors.postalCode ? 'placeholder:text-destructive' : ''}`}
                  />
                  {errors.postalCode && <p className="text-[10px] text-destructive px-1">{errors.postalCode}</p>}
                </FormRow>
              </div>

              <div>
                <label className="text-xs font-bold">
                  Provincia <span className="text-destructive">*</span>
                </label>
                <select
                  value={form.province}
                  onChange={(e) => updateField('province', e.target.value)}
                  className="mt-1 w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="">Selecciona provincia</option>
                  {PROVINCES.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
                {errors.province && <p className="text-[10px] text-destructive mt-1">{errors.province}</p>}
              </div>

              <div className="flex gap-2">
                <Button type="button" variant="outline" size="lg" onClick={prevStep} className="min-h-[48px] text-sm">
                  ← Atrás
                </Button>
                <Button
                  type="button"
                  size="lg"
                  onClick={nextStep}
                  className="flex-1 min-h-[48px] text-sm font-semibold gap-2 bg-accent text-accent-foreground hover:bg-accent/90 active:scale-[0.97]"
                >
                  Revisar pedido →
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Confirmation */}
          {step === 2 && (
            <div className="space-y-3 animate-in fade-in slide-in-from-right-2 duration-200">
              {/* Summary */}
              <div className="rounded-lg border bg-muted/20 p-3 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Nombre:</span>
                  <span className="font-medium">{form.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Teléfono:</span>
                  <span className="font-medium">{form.customerPhone}</span>
                </div>
                {form.customerEmail && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email:</span>
                    <span className="font-medium">{form.customerEmail}</span>
                  </div>
                )}
                <div className="border-t pt-1.5 mt-1.5" />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Dirección:</span>
                  <span className="font-medium text-right max-w-[60%]">{form.address}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ciudad:</span>
                  <span className="font-medium">{form.city}, {form.postalCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Provincia:</span>
                  <span className="font-medium">{form.province}</span>
                </div>
              </div>

              {/* Terms checkbox */}
              <label className="flex items-start gap-2.5 cursor-pointer select-none rounded-lg border p-3 transition-colors hover:bg-muted/40">
                <Checkbox
                  checked={acceptedTerms}
                  onCheckedChange={(v) => setAcceptedTerms(v === true)}
                  className="mt-0.5 shrink-0"
                />
                <span className="text-[11px] leading-relaxed text-foreground">
                  Confirmo que estaré disponible para recibir y pagar el pedido al repartidor. El envío será devuelto si no puedo atender la entrega.
                </span>
              </label>

              {/* Trust signals */}
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { icon: Lock, text: 'Datos seguros' },
                  { icon: Banknote, text: 'Sin pago ahora' },
                  { icon: Truck, text: 'Envío gratis' },
                  { icon: RotateCcw, text: '30 días devolución' },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <Icon className="h-3 w-3 text-accent" />
                    <span>{text}</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Button type="button" variant="outline" size="lg" onClick={prevStep} className="min-h-[48px] text-sm">
                  ← Atrás
                </Button>
                <Button
                  type="submit"
                  size="lg"
                  className="flex-1 min-h-[52px] text-sm font-bold uppercase tracking-wide gap-2 bg-accent text-accent-foreground hover:bg-accent/90 active:scale-[0.97]"
                  disabled={isSubmitting || !acceptedTerms}
                >
                  {isSubmitting ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4" />
                      CONFIRMAR PEDIDO €{total.toFixed(2)}
                    </>
                  )}
                </Button>
              </div>

              <p className="text-[10px] text-center text-muted-foreground">
                Pagarás €{total.toFixed(2)} al repartidor cuando recibas tu pedido
              </p>
            </div>
          )}
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
