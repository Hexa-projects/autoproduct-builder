import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { CheckCircle, ShoppingBag, Phone, Truck } from 'lucide-react';
import { ScrollReveal } from '@/components/ScrollReveal';
import { trackPurchase } from '@/lib/tracking';

export default function OrderConfirmationPage() {
  useEffect(() => {
    // Fire test Purchase event for Meta Pixel conversion
    const stored = sessionStorage.getItem('rf_last_order');
    if (stored) {
      try {
        const order = JSON.parse(stored);
        trackPurchase({
          value: order.total ?? 0,
          currency: order.currency ?? 'EUR',
          orderId: order.orderId,
          numItems: order.numItems ?? 1,
        });
        sessionStorage.removeItem('rf_last_order');
      } catch { /* ignore */ }
    } else {
      // Fallback: fire a test event
      trackPurchase({ value: 0, currency: 'EUR', numItems: 0 });
    }
  }, []);
  return (
    <Layout>
      <div className="mx-auto max-w-lg px-4 py-16 text-center sm:py-24">
        <ScrollReveal>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent/10 sm:h-20 sm:w-20">
            <CheckCircle className="h-8 w-8 text-accent sm:h-10 sm:w-10" />
          </div>
          <h1 className="mt-5 text-2xl font-bold tracking-tight sm:text-3xl" style={{ lineHeight: '1.15' }}>
            ¡Pedido recibido!
          </h1>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed sm:text-base">
            Tu pedido ha sido registrado correctamente. Te contactaremos por teléfono o WhatsApp para confirmar los detalles del envío.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {[
              { icon: Phone, title: 'Confirmación', desc: 'Te contactamos en menos de 24h' },
              { icon: Truck, title: 'Envío rápido', desc: 'Entrega en 2–5 días laborables' },
              { icon: ShoppingBag, title: 'Pago al recibir', desc: 'Pagas al repartidor en casa' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-lg border bg-card p-4">
                <Icon className="mx-auto h-5 w-5 text-accent" />
                <h3 className="mt-2 text-xs font-semibold sm:text-sm">{title}</h3>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>

          <Button asChild size="lg" className="mt-8 gap-2 bg-accent text-accent-foreground hover:bg-accent/90">
            <Link to="/colecciones">
              <ShoppingBag className="h-4 w-4" />
              Seguir comprando
            </Link>
          </Button>
        </ScrollReveal>
      </div>
    </Layout>
  );
}
