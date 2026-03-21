import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { ScrollReveal } from '@/components/ScrollReveal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCartStore } from '@/stores/cartStore';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, CheckCircle, Package, Truck, User, ArrowLeft, Banknote, ShieldCheck, Phone, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { z } from 'zod';

const spainPhoneRegex = /^(\+34)?\s?[6-9]\d{8}$/;

const orderSchema = z.object({
  customer_name: z.string().trim().min(2, 'Nombre obligatorio').max(100),
  customer_phone: z.string().trim().regex(spainPhoneRegex, 'Introduce un teléfono español válido (ej: 612345678)'),
  customer_email: z.string().trim().email('Email inválido').max(255).or(z.literal('')),
  address: z.string().trim().min(3, 'Dirección obligatoria').max(300),
  city: z.string().trim().min(2, 'Ciudad obligatoria').max(100),
  postal_code: z.string().trim().min(4, 'Código postal obligatorio').max(15),
  province: z.string().trim().min(2, 'Provincia obligatoria').max(100),
  country: z.string().trim().min(2).max(60),
  notes: z.string().max(500).optional(),
});

type FormData = z.infer<typeof orderSchema>;

const STEPS = [
  { id: 'customer', label: 'Tus datos', icon: User },
  { id: 'shipping', label: 'Dirección', icon: Truck },
  { id: 'confirm', label: 'Confirmar', icon: Package },
] as const;

export default function CheckoutCODPage() {
  const navigate = useNavigate();
  const { items, clearCart } = useCartStore();
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [codConfirmed, setCodConfirmed] = useState(false);
  const [availableConfirmed, setAvailableConfirmed] = useState(false);
  const [preferredTime, setPreferredTime] = useState('');
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

  const update = (field: keyof FormData, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const validateStep = () => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (step === 0) {
      if (!form.customer_name.trim() || form.customer_name.trim().length < 2) newErrors.customer_name = 'Nombre obligatorio';
      if (!spainPhoneRegex.test(form.customer_phone.trim().replace(/\s/g, ''))) newErrors.customer_phone = 'Introduce un teléfono español válido (ej: 612345678)';
      if (form.customer_email && !z.string().email().safeParse(form.customer_email).success) newErrors.customer_email = 'Email inválido';
    }

    if (step === 1) {
      if (!form.address.trim() || form.address.trim().length < 3) newErrors.address = 'Dirección obligatoria';
      if (!form.city.trim() || form.city.trim().length < 2) newErrors.city = 'Ciudad obligatoria';
      if (!form.postal_code.trim() || form.postal_code.trim().length < 4) newErrors.postal_code = 'Código postal obligatorio';
      if (!form.province.trim() || form.province.trim().length < 2) newErrors.province = 'Provincia obligatoria';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep()) setStep(s => Math.min(s + 1, 2));
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;
    if (!codConfirmed) {
      toast.error('Confirma que entiendes el pago contra reembolso');
      return;
    }
    if (!availableConfirmed) {
      toast.error('Confirma que estarás disponible para recibir el pedido');
      return;
    }
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

      const notesWithTime = [
        form.notes?.trim(),
        preferredTime ? `Horario preferido de contacto: ${preferredTime}` : null,
      ].filter(Boolean).join(' | ');

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
        notes: notesWithTime || null,
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
          <p className="text-muted-foreground mb-4">
            Hemos recibido tu pedido correctamente.
          </p>
          <div className="rounded-xl border bg-accent/5 p-5 text-left space-y-3 mb-6">
            <div className="flex items-start gap-3">
              <Phone className="h-5 w-5 shrink-0 text-accent mt-0.5" />
              <div>
                <p className="text-sm font-semibold">Te contactaremos para confirmar</p>
                <p className="text-sm text-muted-foreground">
                  Nuestro equipo te llamará o escribirá por WhatsApp para confirmar el pedido antes del envío.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Banknote className="h-5 w-5 shrink-0 text-accent mt-0.5" />
              <div>
                <p className="text-sm font-semibold">No se ha realizado ningún cobro</p>
                <p className="text-sm text-muted-foreground">
                  Pagarás al recibir el producto en tu domicilio. Sin cobro online.
                </p>
              </div>
            </div>
          </div>
          <Button onClick={() => navigate('/')} className="bg-accent text-accent-foreground hover:bg-accent/90">
            Volver a la tienda
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Mobile sticky total bar */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-card border-t p-3 flex items-center justify-between lg:hidden" style={{ maxWidth: '100vw' }}>
        <div className="min-w-0">
          <p className="text-[10px] text-muted-foreground leading-tight">Total</p>
          <p className="text-base font-bold tabular-nums">€{totalPrice.toFixed(2)}</p>
        </div>
        {step < 2 ? (
          <Button onClick={nextStep} className="bg-accent text-accent-foreground hover:bg-accent/90 min-h-[42px] px-5 text-sm shrink-0">
            Continuar
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !codConfirmed || !availableConfirmed}
            className="gap-1.5 bg-accent text-accent-foreground hover:bg-accent/90 min-h-[42px] px-4 text-sm shrink-0"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
            Confirmar pedido
          </Button>
        )}
      </div>

      <div className="mx-auto max-w-4xl px-3 sm:px-4 py-3 sm:py-8 pb-24 lg:pb-8 overflow-x-hidden">
        <Button variant="ghost" size="sm" className="mb-2 gap-1 -ml-1" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" /> Volver
        </Button>

        {/* Anti-fraud notice */}
        <div className="mb-3 sm:mb-6 rounded-lg border border-accent/20 bg-accent/5 p-2 sm:p-3 flex items-start gap-2">
          <ShieldCheck className="h-4 w-4 shrink-0 text-accent mt-0.5" />
          <p className="text-[11px] sm:text-sm text-muted-foreground leading-snug">
            <span className="font-semibold text-foreground">Solo pedidos reales.</span>{' '}
            Confirmamos por WhatsApp antes del envío.
          </p>
        </div>

        <ScrollReveal>
          <div className="flex items-center gap-2 mb-0.5">
            <Banknote className="h-5 w-5 text-accent shrink-0" />
            <h1 className="text-lg sm:text-2xl font-bold tracking-tight" style={{ fontFamily: 'Space Grotesk' }}>
              Pago Contra Reembolso
            </h1>
          </div>
          <p className="text-[11px] sm:text-sm text-muted-foreground mb-4 sm:mb-8">
            Completa tus datos. Pagarás cuando recibas el pedido.
          </p>
        </ScrollReveal>

        {/* Step indicator */}
        <div className="mb-4 sm:mb-8 grid grid-cols-3 gap-1.5 sm:gap-2">
          {STEPS.map((s, i) => (
            <button
              key={s.id}
              onClick={() => i < step && setStep(i)}
              className={cn(
                'flex items-center justify-center gap-1 rounded-lg py-2 text-[11px] sm:text-sm font-medium transition-colors',
                i === step
                  ? 'bg-accent text-accent-foreground'
                  : i < step
                    ? 'bg-accent/20 text-accent cursor-pointer'
                    : 'bg-muted text-muted-foreground'
              )}
            >
              <s.icon className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{s.label}</span>
            </button>
          ))}
        </div>

        <div className="grid gap-5 sm:gap-8 lg:grid-cols-[1fr_340px]">
          {/* Form area */}
          <div className="rounded-xl border bg-card p-3 sm:p-6 overflow-hidden">
            {step === 0 && (
              <div className="space-y-3">
                <h2 className="font-semibold text-sm sm:text-lg mb-2 sm:mb-4">Datos del cliente</h2>
                <FieldGroup label="Nombre completo *" error={errors.customer_name}>
                  <Input value={form.customer_name} onChange={e => update('customer_name', e.target.value)} placeholder="Tu nombre completo" className="h-10 sm:h-11 text-sm" />
                </FieldGroup>
                <FieldGroup label="Teléfono (España) *" error={errors.customer_phone}>
                  <Input type="tel" value={form.customer_phone} onChange={e => update('customer_phone', e.target.value)} placeholder="612 345 678" className="h-10 sm:h-11 text-sm" />
                  <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-0.5">
                    Te contactaremos por WhatsApp para confirmar.
                  </p>
                </FieldGroup>
                <FieldGroup label="Email (opcional)" error={errors.customer_email}>
                  <Input type="email" value={form.customer_email} onChange={e => update('customer_email', e.target.value)} placeholder="tu@email.com" className="h-10 sm:h-11 text-sm" />
                </FieldGroup>

                {/* Preferred contact time */}
                <div className="space-y-1">
                  <Label className="text-xs sm:text-sm flex items-center gap-1.5">
                    <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    Horario de contacto
                  </Label>
                  <Select value={preferredTime} onValueChange={setPreferredTime}>
                    <SelectTrigger className="h-10 sm:h-11 text-sm">
                      <SelectValue placeholder="Selecciona horario" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mañana (9:00–13:00)">Mañana (9:00–13:00)</SelectItem>
                      <SelectItem value="tarde (13:00–18:00)">Tarde (13:00–18:00)</SelectItem>
                      <SelectItem value="noche (18:00–21:00)">Noche (18:00–21:00)</SelectItem>
                      <SelectItem value="cualquier hora">Cualquier hora</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-3">
                <h2 className="font-semibold text-sm sm:text-lg mb-2 sm:mb-4">Dirección de envío</h2>
                <FieldGroup label="Dirección *" error={errors.address}>
                  <Input value={form.address} onChange={e => update('address', e.target.value)} placeholder="Calle, número, piso…" className="h-10 sm:h-11 text-sm" />
                </FieldGroup>
                <div className="grid grid-cols-2 gap-2 sm:gap-4">
                  <FieldGroup label="Ciudad *" error={errors.city}>
                    <Input value={form.city} onChange={e => update('city', e.target.value)} placeholder="Madrid" className="h-10 sm:h-11 text-sm" />
                  </FieldGroup>
                  <FieldGroup label="C. Postal *" error={errors.postal_code}>
                    <Input value={form.postal_code} onChange={e => update('postal_code', e.target.value)} placeholder="28001" className="h-10 sm:h-11 text-sm" />
                  </FieldGroup>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:gap-4">
                  <FieldGroup label="Provincia *" error={errors.province}>
                    <Input value={form.province} onChange={e => update('province', e.target.value)} placeholder="Madrid" className="h-10 sm:h-11 text-sm" />
                  </FieldGroup>
                  <FieldGroup label="País *" error={errors.country}>
                    <Input value={form.country} onChange={e => update('country', e.target.value)} placeholder="España" className="h-10 sm:h-11 text-sm" />
                  </FieldGroup>
                </div>
                <FieldGroup label="Notas (opcional)">
                  <Textarea value={form.notes} onChange={e => update('notes', e.target.value)} placeholder="Instrucciones de entrega…" rows={2} className="text-sm" />
                </FieldGroup>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-3 sm:space-y-5">
                <h2 className="font-semibold text-sm sm:text-lg">Confirmar pedido</h2>
                <div className="rounded-lg bg-muted/50 p-2.5 sm:p-4 text-xs sm:text-sm space-y-0.5 overflow-hidden break-words">
                  <p><span className="font-medium">Nombre:</span> {form.customer_name}</p>
                  <p><span className="font-medium">Teléfono:</span> {form.customer_phone}</p>
                  {form.customer_email && <p className="truncate"><span className="font-medium">Email:</span> {form.customer_email}</p>}
                  {preferredTime && <p><span className="font-medium">Contacto:</span> {preferredTime}</p>}
                  <p className="break-words"><span className="font-medium">Dirección:</span> {form.address}, {form.city} {form.postal_code}</p>
                  <p><span className="font-medium">Provincia:</span> {form.province}, {form.country}</p>
                  {form.notes && <p className="break-words"><span className="font-medium">Notas:</span> {form.notes}</p>}
                </div>

                <div className="space-y-2">
                  {items.map(item => (
                    <div key={item.variantId} className="flex gap-2 sm:gap-3 items-center">
                      <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-md bg-muted overflow-hidden shrink-0">
                        {item.product.node.images?.edges?.[0]?.node && (
                          <img src={item.product.node.images.edges[0].node.url} alt="" className="h-full w-full object-cover" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-xs sm:text-sm truncate">{item.product.node.title}</p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">{item.selectedOptions.map(o => o.value).join(' · ')} × {item.quantity}</p>
                      </div>
                      <p className="font-semibold text-xs sm:text-sm tabular-nums shrink-0">€{(parseFloat(item.price.amount) * item.quantity).toFixed(2)}</p>
                    </div>
                  ))}
                </div>

                <div className="rounded-lg border bg-accent/5 p-2.5 sm:p-4 space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <Banknote className="h-4 w-4 text-accent shrink-0" />
                    <p className="font-semibold text-xs sm:text-sm">Pago Contra Reembolso (COD)</p>
                  </div>
                  <p className="text-[11px] sm:text-sm text-muted-foreground leading-snug">
                    No se realizará ningún cobro online. Pagas cuando recibes el producto en tu domicilio.
                  </p>
                </div>

                {/* COD confirmation checkbox */}
                <div className="flex items-start gap-2.5 rounded-lg border p-2.5 sm:p-4">
                  <Checkbox
                    id="cod-confirm"
                    checked={codConfirmed}
                    onCheckedChange={(checked) => setCodConfirmed(checked === true)}
                    className="mt-0.5 shrink-0"
                  />
                  <label htmlFor="cod-confirm" className="text-xs sm:text-sm cursor-pointer min-w-0">
                    <span className="font-medium leading-snug">Entiendo que este pedido se paga al recibir.</span>
                    <span className="text-muted-foreground block mt-0.5 text-[11px] sm:text-sm leading-snug">
                      No se realizará ningún cobro hasta que el repartidor me entregue el paquete.
                    </span>
                  </label>
                </div>

                {/* Availability confirmation */}
                <div className="flex items-start gap-2.5 rounded-lg border p-2.5 sm:p-4">
                  <Checkbox
                    id="available-confirm"
                    checked={availableConfirmed}
                    onCheckedChange={(checked) => setAvailableConfirmed(checked === true)}
                    className="mt-0.5 shrink-0"
                  />
                  <label htmlFor="available-confirm" className="text-xs sm:text-sm cursor-pointer min-w-0">
                    <span className="font-medium leading-snug">Confirmo que estaré disponible para recibir el pedido.</span>
                    <span className="text-muted-foreground block mt-0.5 text-[11px] sm:text-sm leading-snug">
                      Me comprometo a estar disponible en la dirección indicada durante el horario de reparto.
                    </span>
                  </label>
                </div>
              </div>
            )}

            {/* Navigation buttons - hidden on mobile (sticky bar handles it) */}
            <div className="mt-6 hidden lg:flex gap-3">
              {step > 0 && (
                <Button variant="outline" onClick={() => setStep(s => s - 1)}>Atrás</Button>
              )}
              {step < 2 ? (
                <Button onClick={nextStep} className="ml-auto bg-accent text-accent-foreground hover:bg-accent/90">Continuar</Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !codConfirmed || !availableConfirmed}
                  className="ml-auto gap-2 bg-accent text-accent-foreground hover:bg-accent/90 min-h-[48px]"
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                  Confirmar pedido
                </Button>
              )}
            </div>

            {/* Mobile back button */}
            {step > 0 && (
              <div className="mt-3 lg:hidden">
                <Button variant="outline" size="sm" onClick={() => setStep(s => s - 1)}>Atrás</Button>
              </div>
            )}
          </div>

          {/* Order summary sidebar - hidden on mobile (sticky bar shows total) */}
          <div className="hidden lg:block rounded-xl border bg-card p-5 h-fit lg:sticky lg:top-24 space-y-4">
            <h3 className="font-semibold">Resumen del pedido</h3>
            <div className="space-y-3">
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
            <div className="border-t pt-3 flex justify-between font-bold">
              <span>Total</span>
              <span className="tabular-nums text-lg">€{totalPrice.toFixed(2)}</span>
            </div>

            {/* Trust block in sidebar */}
            <div className="border-t pt-4 space-y-2">
              {[
                { icon: ShieldCheck, text: 'No se realizará ningún cobro online' },
                { icon: Phone, text: 'Confirmación por WhatsApp' },
                { icon: Banknote, text: 'Pagas al recibir en tu domicilio' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Icon className="h-4 w-4 shrink-0 text-accent" />
                  <span>{text}</span>
                </div>
              ))}
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
