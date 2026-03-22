import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCartStore } from '@/stores/cartStore';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ScrollReveal } from '@/components/ScrollReveal';
import {
  Loader2, ShoppingBag, Banknote, Truck, ShieldCheck,
  RotateCcw, Phone, ChevronLeft, Package,
} from 'lucide-react';
import { z } from 'zod';

const orderSchema = z.object({
  customerName: z.string().trim().min(2, 'Nombre demasiado corto').max(100),
  customerPhone: z.string().trim().min(9, 'Teléfono no válido').max(20),
  customerEmail: z.string().trim().email('Email no válido').max(255).optional().or(z.literal('')),
  address: z.string().trim().min(5, 'Dirección demasiado corta').max(200),
  city: z.string().trim().min(2, 'Ciudad requerida').max(100),
  postalCode: z.string().trim().min(4, 'Código postal no válido').max(10),
  province: z.string().trim().min(2, 'Provincia requerida').max(100),
  notes: z.string().max(500).optional(),
});

type OrderForm = z.infer<typeof orderSchema>;

const SHIPPING_COST = 4.99;

const provinces = [
  'Álava', 'Albacete', 'Alicante', 'Almería', 'Asturias', 'Ávila',
  'Badajoz', 'Barcelona', 'Burgos', 'Cáceres', 'Cádiz', 'Cantabria',
  'Castellón', 'Ciudad Real', 'Córdoba', 'A Coruña', 'Cuenca',
  'Girona', 'Granada', 'Guadalajara', 'Guipúzcoa', 'Huelva', 'Huesca',
  'Jaén', 'León', 'Lérida', 'Lugo', 'Madrid', 'Málaga', 'Murcia',
  'Navarra', 'Ourense', 'Palencia', 'Las Palmas', 'Pontevedra',
  'La Rioja', 'Salamanca', 'Santa Cruz de Tenerife', 'Segovia',
  'Sevilla', 'Soria', 'Tarragona', 'Teruel', 'Toledo', 'Valencia',
  'Valladolid', 'Vizcaya', 'Zamora', 'Zaragoza',
];

export default function CheckoutPage() {
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
    notes: '',
  });

  const subtotal = items.reduce((sum, item) => sum + parseFloat(item.price.amount) * item.quantity, 0);
  const total = subtotal + SHIPPING_COST;

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

    if (items.length === 0) {
      toast.error('Tu carrito está vacío');
      return;
    }

    setIsSubmitting(true);
    try {
      const orderItems = items.map((item) => ({
        title: item.product.node.title,
        variant: item.selectedOptions.map((o) => o.value).join(' / '),
        quantity: item.quantity,
        price: parseFloat(item.price.amount),
      }));

      const { data, error } = await supabase.functions.invoke('send-order-telegram', {
        body: {
          customerName: result.data.customerName,
          customerPhone: result.data.customerPhone,
          customerEmail: result.data.customerEmail || undefined,
          address: result.data.address,
          city: result.data.city,
          postalCode: result.data.postalCode,
          province: result.data.province,
          notes: result.data.notes || undefined,
          items: orderItems,
          subtotal,
          shippingCost: SHIPPING_COST,
          total,
        },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Error al procesar el pedido');

      clearCart();
      navigate('/pedido-confirmado');
    } catch (err) {
      console.error('Order submission error:', err);
      toast.error('Error al enviar el pedido', {
        description: 'Inténtalo de nuevo o contáctanos por teléfono.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-24 text-center px-4">
          <ShoppingBag className="h-16 w-16 text-muted-foreground/40" />
          <h1 className="mt-4 text-xl font-bold">Tu carrito está vacío</h1>
          <p className="mt-2 text-sm text-muted-foreground">Añade productos antes de realizar un pedido.</p>
          <Button asChild className="mt-6" variant="outline">
            <Link to="/colecciones">Ver productos</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mx-auto max-w-5xl px-3 py-4 sm:px-4 sm:py-8">
        {/* Back link */}
        <Link to="/colecciones" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-4 sm:text-sm sm:mb-6">
          <ChevronLeft className="h-3.5 w-3.5" /> Seguir comprando
        </Link>

        <div className="grid gap-6 lg:grid-cols-5 lg:gap-10">
          {/* Form */}
          <div className="lg:col-span-3">
            <ScrollReveal>
              <h1 className="text-xl font-bold tracking-tight sm:text-2xl" style={{ lineHeight: '1.15' }}>
                Finalizar pedido
              </h1>
              <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                💶 Paga al recibir en tu domicilio. Sin tarjeta ni pago anticipado.
              </p>
            </ScrollReveal>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4 sm:space-y-5">
              {/* Personal data */}
              <fieldset className="space-y-3 rounded-xl border bg-card p-4 sm:p-5">
                <legend className="text-sm font-bold px-1 sm:text-base">Datos personales</legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  <FormField label="Nombre completo *" error={errors.customerName}>
                    <Input
                      value={form.customerName}
                      onChange={(e) => updateField('customerName', e.target.value)}
                      placeholder="Juan García López"
                      className={errors.customerName ? 'border-destructive' : ''}
                    />
                  </FormField>
                  <FormField label="Teléfono *" error={errors.customerPhone}>
                    <Input
                      type="tel"
                      value={form.customerPhone}
                      onChange={(e) => updateField('customerPhone', e.target.value)}
                      placeholder="612 345 678"
                      className={errors.customerPhone ? 'border-destructive' : ''}
                    />
                  </FormField>
                </div>
                <FormField label="Email (opcional)" error={errors.customerEmail}>
                  <Input
                    type="email"
                    value={form.customerEmail}
                    onChange={(e) => updateField('customerEmail', e.target.value)}
                    placeholder="tu@email.com"
                    className={errors.customerEmail ? 'border-destructive' : ''}
                  />
                </FormField>
              </fieldset>

              {/* Shipping address */}
              <fieldset className="space-y-3 rounded-xl border bg-card p-4 sm:p-5">
                <legend className="text-sm font-bold px-1 sm:text-base">Dirección de envío</legend>
                <FormField label="Dirección *" error={errors.address}>
                  <Input
                    value={form.address}
                    onChange={(e) => updateField('address', e.target.value)}
                    placeholder="Calle Mayor 1, 2ºA"
                    className={errors.address ? 'border-destructive' : ''}
                  />
                </FormField>
                <div className="grid gap-3 sm:grid-cols-3">
                  <FormField label="Código postal *" error={errors.postalCode}>
                    <Input
                      value={form.postalCode}
                      onChange={(e) => updateField('postalCode', e.target.value)}
                      placeholder="28001"
                      className={errors.postalCode ? 'border-destructive' : ''}
                    />
                  </FormField>
                  <FormField label="Ciudad *" error={errors.city}>
                    <Input
                      value={form.city}
                      onChange={(e) => updateField('city', e.target.value)}
                      placeholder="Madrid"
                      className={errors.city ? 'border-destructive' : ''}
                    />
                  </FormField>
                  <FormField label="Provincia *" error={errors.province}>
                    <select
                      value={form.province}
                      onChange={(e) => updateField('province', e.target.value)}
                      className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${errors.province ? 'border-destructive' : 'border-input'}`}
                    >
                      <option value="">Seleccionar...</option>
                      {provinces.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </FormField>
                </div>
              </fieldset>

              {/* Notes */}
              <fieldset className="space-y-3 rounded-xl border bg-card p-4 sm:p-5">
                <legend className="text-sm font-bold px-1 sm:text-base">Notas (opcional)</legend>
                <Textarea
                  value={form.notes}
                  onChange={(e) => updateField('notes', e.target.value)}
                  placeholder="Instrucciones para la entrega, horario preferido, etc."
                  rows={3}
                />
              </fieldset>

              {/* Submit - mobile */}
              <div className="lg:hidden">
                <OrderSummaryCard items={items} subtotal={subtotal} shippingCost={SHIPPING_COST} total={total} />
                <Button
                  type="submit"
                  size="lg"
                  className="w-full min-h-[52px] text-sm font-semibold gap-2 bg-accent text-accent-foreground hover:bg-accent/90 active:scale-[0.97] mt-4 sm:text-base"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Banknote className="h-4 w-4" />
                      Confirmar pedido — €{total.toFixed(2)}
                    </>
                  )}
                </Button>
                <TrustRow />
              </div>
            </form>
          </div>

          {/* Sidebar - desktop */}
          <div className="hidden lg:block lg:col-span-2">
            <div className="sticky top-24 space-y-4">
              <ScrollReveal direction="right">
                <OrderSummaryCard items={items} subtotal={subtotal} shippingCost={SHIPPING_COST} total={total} />
                <Button
                  type="submit"
                  size="lg"
                  className="w-full min-h-[52px] text-sm font-semibold gap-2 bg-accent text-accent-foreground hover:bg-accent/90 active:scale-[0.97] mt-4 sm:text-base"
                  disabled={isSubmitting}
                  onClick={handleSubmit}
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Banknote className="h-4 w-4" />
                      Confirmar pedido — €{total.toFixed(2)}
                    </>
                  )}
                </Button>
                <TrustRow />
              </ScrollReveal>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function FormField({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs font-medium sm:text-sm">{label}</Label>
      {children}
      {error && <p className="text-[11px] text-destructive font-medium">{error}</p>}
    </div>
  );
}

function OrderSummaryCard({ items, subtotal, shippingCost, total }: {
  items: any[];
  subtotal: number;
  shippingCost: number;
  total: number;
}) {
  return (
    <div className="rounded-xl border bg-card p-4 sm:p-5">
      <h2 className="text-sm font-bold flex items-center gap-1.5 sm:text-base">
        <Package className="h-4 w-4 text-accent" /> Resumen del pedido
      </h2>
      <div className="mt-3 space-y-2.5">
        {items.map((item: any) => (
          <div key={item.variantId} className="flex gap-3">
            <div className="w-12 h-12 bg-muted rounded-md overflow-hidden flex-shrink-0">
              {item.product.node.images?.edges?.[0]?.node && (
                <img src={item.product.node.images.edges[0].node.url} alt="" className="w-full h-full object-cover" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{item.product.node.title}</p>
              <p className="text-[11px] text-muted-foreground">{item.selectedOptions.map((o: any) => o.value).join(' · ')} × {item.quantity}</p>
            </div>
            <p className="text-xs font-semibold tabular-nums shrink-0">€{(parseFloat(item.price.amount) * item.quantity).toFixed(2)}</p>
          </div>
        ))}
      </div>
      <div className="mt-3 pt-3 border-t space-y-1.5">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Subtotal</span>
          <span className="tabular-nums">€{subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Truck className="h-3 w-3" /> Envío</span>
          <span className="tabular-nums">€{shippingCost.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm font-bold pt-1.5 border-t">
          <span>Total a pagar al recibir</span>
          <span className="tabular-nums text-accent">€{total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}

function TrustRow() {
  return (
    <div className="mt-3 grid grid-cols-2 gap-1.5">
      {[
        { icon: Banknote, text: 'Pagas al recibir' },
        { icon: ShieldCheck, text: 'Sin pago anticipado' },
        { icon: RotateCcw, text: '30 días devolución' },
        { icon: Phone, text: 'Soporte en español' },
      ].map(({ icon: Icon, text }) => (
        <div key={text} className="flex items-center gap-1.5 rounded-md border p-2">
          <Icon className="h-3 w-3 shrink-0 text-accent" />
          <span className="text-[10px] font-medium leading-tight">{text}</span>
        </div>
      ))}
    </div>
  );
}
