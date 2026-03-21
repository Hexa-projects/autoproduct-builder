import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { ScrollReveal } from '@/components/ScrollReveal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCartStore } from '@/stores/cartStore';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, CheckCircle, Package, Truck, User, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { z } from 'zod';

const orderSchema = z.object({
  customer_name: z.string().trim().min(2, 'Nombre obligatorio').max(100),
  customer_phone: z.string().trim().min(6, 'Teléfono obligatorio').max(20),
  customer_email: z.string().trim().email('Email inválido').max(255).or(z.literal('')),
  address: z.string().trim().min(3, 'Dirección obligatoria').max(300),
  city: z.string().trim().min(2, 'Ciudad obligatoria').max(100),
  postal_code: z.string().trim().min(3, 'Código postal obligatorio').max(15),
  province: z.string().trim().min(2, 'Provincia obligatoria').max(100),
  country: z.string().trim().min(2).max(60),
  notes: z.string().max(500).optional(),
});

type FormData = z.infer<typeof orderSchema>;

const STEPS = [
  { id: 'customer', label: 'Datos del cliente', icon: User },
  { id: 'shipping', label: 'Envío', icon: Truck },
  { id: 'confirm', label: 'Confirmar pedido', icon: Package },
] as const;

export default function CheckoutCODPage() {
  const navigate = useNavigate();
  const { items, clearCart } = useCartStore();
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const [form, setForm] = useState<FormData>({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    address: '',
    city: '',
    postal_code: '',
    province: '',
    country: 'España',
    notes: '',
  });

  const totalPrice = items.reduce((s, i) => s + parseFloat(i.price.amount) * i.quantity, 0);
  const currency = items[0]?.price.currencyCode || 'EUR';

  const update = (field: keyof FormData, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const validateStep = () => {
    const fieldsPerStep: (keyof FormData)[][] = [
      ['customer_name', 'customer_phone'],
      ['address', 'city', 'postal_code', 'province', 'country'],
      [],
    ];
    const partial: Partial<FormData> = {};
    fieldsPerStep[step].forEach(k => { (partial as any)[k] = form[k]; });
    const result = orderSchema.partial().safeParse(partial);
    // Manually validate required fields
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    fieldsPerStep[step].forEach(k => {
      const val = form[k]?.trim();
      if (!val || val.length < 2) {
        newErrors[k] = 'Este campo es obligatorio';
      }
    });
    if (form.customer_email && step === 0) {
      const emailResult = z.string().email().safeParse(form.customer_email);
      if (!emailResult.success) newErrors.customer_email = 'Email inválido';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep()) setStep(s => Math.min(s + 1, 2));
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;
    setIsSubmitting(true);
    try {
      const orderItems = items.map(i => ({
        title: i.product.node.title,
        variantTitle: i.variantTitle,
        variantId: i.variantId,
        quantity: i.quantity,
        price: i.price.amount,
        currency: i.price.currencyCode,
        options: i.selectedOptions,
        image: i.product.node.images?.edges?.[0]?.node?.url || null,
      }));

      const { error } = await supabase.from('cod_orders').insert({
        customer_name: form.customer_name.trim(),
        customer_phone: form.customer_phone.trim(),
        customer_email: form.customer_email?.trim() || null,
        address: form.address.trim(),
        city: form.city.trim(),
        postal_code: form.postal_code.trim(),
        province: form.province.trim(),
        country: form.country.trim(),
        items: orderItems as any,
        subtotal: totalPrice,
        shipping_cost: 0,
        total: totalPrice,
        shipping_method: 'COD',
        notes: form.notes?.trim() || null,
      });

      if (error) throw error;

      setOrderPlaced(true);
      clearCart();
      toast.success('¡Pedido realizado con éxito!');
    } catch (err) {
      console.error('Order submission failed:', err);
      toast.error('Error al procesar el pedido. Inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0 && !orderPlaced) {
    return (
      <Layout>
        <div className="mx-auto max-w-lg px-4 py-20 text-center">
          <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h1 className="text-xl font-bold mb-2">Tu carrito está vacío</h1>
          <p className="text-muted-foreground mb-6">Añade productos antes de hacer el checkout.</p>
          <Button onClick={() => navigate('/')}>Ir a la tienda</Button>
        </div>
      </Layout>
    );
  }

  if (orderPlaced) {
    return (
      <Layout>
        <div className="mx-auto max-w-lg px-4 py-20 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
            <CheckCircle className="h-8 w-8 text-accent" />
          </div>
          <h1 className="text-2xl font-bold mb-2">¡Pedido confirmado!</h1>
          <p className="text-muted-foreground mb-6">
            Hemos recibido tu pedido. Te contactaremos pronto para confirmar el envío.
            El pago se realizará en el momento de la entrega.
          </p>
          <Button onClick={() => navigate('/')}>Volver a la tienda</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mx-auto max-w-4xl px-4 py-8">
        <Button variant="ghost" size="sm" className="mb-4 gap-1" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" /> Volver
        </Button>

        <ScrollReveal>
          <h1 className="text-2xl font-bold tracking-tight mb-1" style={{ fontFamily: 'Space Grotesk' }}>
            Checkout — Pago contra entrega
          </h1>
          <p className="text-sm text-muted-foreground mb-8">
            Completa tus datos. Pagarás cuando recibas el pedido.
          </p>
        </ScrollReveal>

        {/* Step indicator */}
        <div className="mb-8 flex gap-2">
          {STEPS.map((s, i) => (
            <button
              key={s.id}
              onClick={() => i < step && setStep(i)}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-colors',
                i === step
                  ? 'bg-accent text-accent-foreground'
                  : i < step
                    ? 'bg-accent/20 text-accent cursor-pointer'
                    : 'bg-muted text-muted-foreground'
              )}
            >
              <s.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{s.label}</span>
            </button>
          ))}
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
          {/* Form area */}
          <div className="rounded-xl border bg-card p-6">
            {step === 0 && (
              <div className="space-y-4">
                <h2 className="font-semibold text-lg mb-4">Datos del cliente</h2>
                <FieldGroup label="Nombre completo *" error={errors.customer_name}>
                  <Input value={form.customer_name} onChange={e => update('customer_name', e.target.value)} placeholder="Tu nombre completo" />
                </FieldGroup>
                <FieldGroup label="Teléfono *" error={errors.customer_phone}>
                  <Input type="tel" value={form.customer_phone} onChange={e => update('customer_phone', e.target.value)} placeholder="+34 600 000 000" />
                </FieldGroup>
                <FieldGroup label="Correo electrónico" error={errors.customer_email}>
                  <Input type="email" value={form.customer_email} onChange={e => update('customer_email', e.target.value)} placeholder="tu@email.com (opcional)" />
                </FieldGroup>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <h2 className="font-semibold text-lg mb-4">Dirección de envío</h2>
                <FieldGroup label="Dirección *" error={errors.address}>
                  <Input value={form.address} onChange={e => update('address', e.target.value)} placeholder="Calle, número, piso…" />
                </FieldGroup>
                <div className="grid grid-cols-2 gap-4">
                  <FieldGroup label="Ciudad *" error={errors.city}>
                    <Input value={form.city} onChange={e => update('city', e.target.value)} placeholder="Madrid" />
                  </FieldGroup>
                  <FieldGroup label="Código postal *" error={errors.postal_code}>
                    <Input value={form.postal_code} onChange={e => update('postal_code', e.target.value)} placeholder="28001" />
                  </FieldGroup>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FieldGroup label="Provincia *" error={errors.province}>
                    <Input value={form.province} onChange={e => update('province', e.target.value)} placeholder="Madrid" />
                  </FieldGroup>
                  <FieldGroup label="País *" error={errors.country}>
                    <Input value={form.country} onChange={e => update('country', e.target.value)} placeholder="España" />
                  </FieldGroup>
                </div>
                <FieldGroup label="Notas (opcional)">
                  <Textarea value={form.notes} onChange={e => update('notes', e.target.value)} placeholder="Instrucciones de entrega…" rows={3} />
                </FieldGroup>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <h2 className="font-semibold text-lg">Confirmar pedido</h2>
                {/* Summary of customer info */}
                <div className="rounded-lg bg-muted/50 p-4 text-sm space-y-1">
                  <p><span className="font-medium">Nombre:</span> {form.customer_name}</p>
                  <p><span className="font-medium">Teléfono:</span> {form.customer_phone}</p>
                  {form.customer_email && <p><span className="font-medium">Email:</span> {form.customer_email}</p>}
                  <p><span className="font-medium">Dirección:</span> {form.address}, {form.city} {form.postal_code}</p>
                  <p><span className="font-medium">Provincia:</span> {form.province}, {form.country}</p>
                  {form.notes && <p><span className="font-medium">Notas:</span> {form.notes}</p>}
                </div>

                {/* Items */}
                <div className="space-y-3">
                  {items.map(item => (
                    <div key={item.variantId} className="flex gap-3 items-center">
                      <div className="h-12 w-12 rounded-md bg-muted overflow-hidden flex-shrink-0">
                        {item.product.node.images?.edges?.[0]?.node && (
                          <img src={item.product.node.images.edges[0].node.url} alt="" className="h-full w-full object-cover" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{item.product.node.title}</p>
                        <p className="text-xs text-muted-foreground">{item.selectedOptions.map(o => o.value).join(' · ')} × {item.quantity}</p>
                      </div>
                      <p className="font-semibold text-sm tabular-nums">€{(parseFloat(item.price.amount) * item.quantity).toFixed(2)}</p>
                    </div>
                  ))}
                </div>

                <div className="rounded-lg border bg-accent/5 p-4">
                  <p className="text-sm text-muted-foreground mb-1">Método de pago</p>
                  <p className="font-semibold">💰 Pago contra entrega (COD)</p>
                  <p className="text-xs text-muted-foreground mt-1">Pagas cuando recibes el producto en tu domicilio.</p>
                </div>
              </div>
            )}

            {/* Navigation buttons */}
            <div className="mt-6 flex gap-3">
              {step > 0 && (
                <Button variant="outline" onClick={() => setStep(s => s - 1)}>Atrás</Button>
              )}
              {step < 2 ? (
                <Button onClick={nextStep} className="ml-auto">Continuar</Button>
              ) : (
                <Button onClick={handleSubmit} disabled={isSubmitting} className="ml-auto gap-2">
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                  Confirmar pedido
                </Button>
              )}
            </div>
          </div>

          {/* Order summary sidebar */}
          <div className="rounded-xl border bg-card p-5 h-fit lg:sticky lg:top-24">
            <h3 className="font-semibold mb-4">Resumen del pedido</h3>
            <div className="space-y-3 mb-4">
              {items.map(item => (
                <div key={item.variantId} className="flex justify-between text-sm">
                  <span className="truncate max-w-[180px]">{item.product.node.title} ×{item.quantity}</span>
                  <span className="tabular-nums font-medium">€{(parseFloat(item.price.amount) * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="border-t pt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="tabular-nums">€{totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Envío</span>
                <span className="text-xs text-accent font-medium">Se confirmará</span>
              </div>
            </div>
            <div className="border-t mt-3 pt-3 flex justify-between font-bold">
              <span>Total</span>
              <span className="tabular-nums text-lg">€{totalPrice.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function FieldGroup({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
