import { Link } from 'react-router-dom';
import { useShopifyProducts, useShopifyCollections } from '@/hooks/useShopify';
import { Layout } from '@/components/layout/Layout';
import { ProductCard } from '@/components/ProductCard';
import { ScrollReveal } from '@/components/ScrollReveal';
import { CODFaq } from '@/components/CODFaq';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  ArrowRight, ShoppingBag, Dumbbell, Heart, Sparkles,
  Shield, Star, Truck, RotateCcw, ShieldCheck, Zap,
  Banknote, Phone, Package, CheckCircle, MessageCircle,
} from 'lucide-react';
import bannerDesktop from '@/assets/banner-desktop.png';
import bannerMobile from '@/assets/banner-mobile.png';

const categoryBlocks = [
  {
    title: 'Soporte y Postura',
    desc: 'Fajas, muñequeras y soportes para entrenar con confianza.',
    icon: Shield,
    handle: 'soporte-postura',
  },
  {
    title: 'Recuperación',
    desc: 'Rodillos, bandas y accesorios para tu post-entreno.',
    icon: Heart,
    handle: 'recuperacion',
  },
  {
    title: 'Accesorios Gym',
    desc: 'Guantes, correas y todo lo que necesitas en el gimnasio.',
    icon: Dumbbell,
    handle: 'accesorios',
  },
];

const codSteps = [
  {
    icon: ShoppingBag,
    step: '1',
    title: 'Haces tu pedido online',
    desc: 'Elige tu producto, indica tu dirección y confirma. Sin tarjeta, sin pago anticipado.',
  },
  {
    icon: MessageCircle,
    step: '2',
    title: 'Te confirmamos por WhatsApp',
    desc: 'Nuestro equipo te contacta para verificar el pedido y resolver cualquier duda.',
  },
  {
    icon: Banknote,
    step: '3',
    title: 'Recibes y pagas en tu domicilio',
    desc: 'El repartidor te entrega el paquete y pagas en ese momento. Así de fácil.',
  },
];

const guarantees = [
  { icon: Banknote, text: 'Sin pago por adelantado' },
  { icon: Phone, text: 'Atención al cliente en español' },
  { icon: RotateCcw, text: 'Devolución en 30 días' },
  { icon: Package, text: 'Seguimiento del pedido' },
];

const whyBuyReasons = [
  {
    icon: ShieldCheck,
    title: 'Sin riesgo para ti',
    desc: 'No arriesgas tu dinero pagando por adelantado. Pagas solo cuando tienes el producto en tus manos.',
  },
  {
    icon: RotateCcw,
    title: 'Devolución sin excusas',
    desc: '30 días para devolver gratis, sin preguntas ni complicaciones.',
  },
  {
    icon: Truck,
    title: 'Envío rápido a toda España',
    desc: 'Península e islas. Recíbelo en 2–5 días laborables.',
  },
];

// Handles for the "Más vendidos COD" section
const topCODHandles = [
  'rodillera-estabilizadora-de-rotula-1',
  'masajeador-de-rodilla-con-calefactor',
];

export default function Index() {
  const { data: products, isLoading } = useShopifyProducts();
  const { data: collections } = useShopifyCollections();

  const featuredProducts = products?.slice(0, 8) || [];

  // Top COD products
  const topCODProducts = products?.filter((p) =>
    topCODHandles.includes(p.node.handle)
  ) || [];

  return (
    <Layout>
      {/* Hero — COD First */}
      <section className="relative overflow-hidden bg-foreground">
        <div className="hidden md:block">
          <img
            src={bannerDesktop}
            alt="Revolución Fit — Compra y paga al recibir"
            className="w-full object-cover"
            style={{ maxHeight: '520px' }}
          />
        </div>
        <div className="md:hidden">
          <img src={bannerMobile} alt="Revolución Fit — Pago contra reembolso" className="w-full object-cover aspect-[3/4]" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="absolute inset-0 flex flex-col items-center justify-end gap-3 pb-8 sm:pb-12 px-4 text-center">
          <h1 className="text-white text-xl sm:text-3xl font-bold tracking-tight drop-shadow-lg max-w-2xl" style={{ fontFamily: 'Space Grotesk', lineHeight: '1.15' }}>
            Compra hoy y paga al recibir
          </h1>
          <p className="text-white/80 text-xs sm:text-sm max-w-md drop-shadow-sm">
            Sin tarjeta, sin pago anticipado. Confirmamos tu pedido y pagas en casa.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-3 mt-1">
            <Button
              size="lg"
              asChild
              className="shadow-lg text-base font-semibold active:scale-[0.97] bg-accent text-accent-foreground hover:bg-accent/90 min-h-[48px] gap-2"
            >
              <Link to="/colecciones">
                <Banknote className="h-4 w-4" />
                Pedir ahora con Contra Reembolso
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="shadow-lg text-base font-semibold active:scale-[0.97] border-white/50 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 hover:text-white"
            >
              <Link to="/colecciones">
                Ver productos más vendidos <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── Cómo funciona el Pago Contra Reembolso ── */}
      <section className="border-b bg-card">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:py-14">
          <ScrollReveal>
            <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl" style={{ lineHeight: '1.1' }}>
              Cómo funciona el Pago Contra Reembolso
            </h2>
            <p className="mx-auto mt-2 max-w-lg text-center text-sm text-muted-foreground">
              Compra sin riesgo en 3 sencillos pasos
            </p>
          </ScrollReveal>

          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {codSteps.map((s, i) => (
              <ScrollReveal key={s.step} delay={i * 0.1}>
                <div className="flex flex-col items-center text-center rounded-xl border bg-background p-6 shadow-sm">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/10 mb-4">
                    <s.icon className="h-7 w-7 text-accent" />
                  </div>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-accent-foreground text-sm font-bold mb-3">
                    {s.step}
                  </div>
                  <h3 className="font-semibold text-lg">{s.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground max-w-[260px]">{s.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>

          {/* Guarantees strip */}
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {guarantees.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2 rounded-lg border bg-background p-3">
                <Icon className="h-5 w-5 shrink-0 text-accent" />
                <span className="text-xs font-medium sm:text-sm">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Más vendidos COD ── */}
      {topCODProducts.length > 0 && (
        <section className="border-b bg-accent/5">
          <div className="mx-auto max-w-7xl px-4 py-10 sm:py-14">
            <ScrollReveal>
              <div className="text-center">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent mb-3">
                  <Star className="h-3.5 w-3.5" />
                  Los favoritos
                </div>
                <h2 className="text-2xl font-bold tracking-tight sm:text-3xl" style={{ lineHeight: '1.1' }}>
                  Más vendidos con Pago al Recibir
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Los productos más pedidos por nuestros clientes con pago al recibir.
                </p>
              </div>
            </ScrollReveal>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 max-w-2xl mx-auto">
              {topCODProducts.map((product, i) => (
                <ScrollReveal key={product.node.id} delay={i * 0.08}>
                  <ProductCard product={product} />
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* All products */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:py-14">
        <ScrollReveal>
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl" style={{ lineHeight: '1.1' }}>
                Todos los productos
              </h2>
              <p className="mt-1 text-muted-foreground text-sm sm:text-base">
                Equipamiento seleccionado con pago contra reembolso disponible.
              </p>
            </div>
            <Button variant="outline" asChild className="hidden sm:flex gap-1 text-accent border-accent/30 hover:bg-accent/10 hover:text-accent">
              <Link to="/colecciones">
                Ver todo <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </ScrollReveal>

        {isLoading ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-square w-full rounded-xl" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : featuredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <ShoppingBag className="h-12 w-12 text-muted-foreground/40" />
            <h3 className="mt-4 text-lg font-semibold">No hay productos todavía</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Los productos aparecerán aquí cuando se añadan a la tienda.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {featuredProducts.map((product, i) => (
              <ScrollReveal key={product.node.id} delay={i * 0.05}>
                <ProductCard product={product} />
              </ScrollReveal>
            ))}
          </div>
        )}

        <div className="mt-8 text-center sm:hidden">
          <Button variant="outline" asChild className="text-accent border-accent/30 hover:bg-accent/10 hover:text-accent">
            <Link to="/colecciones" className="gap-1">
              Ver todo el catálogo <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Popular categories */}
      <section className="border-y bg-card">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:py-14">
          <ScrollReveal>
            <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl" style={{ lineHeight: '1.1' }}>
              Categorías más populares
            </h2>
          </ScrollReveal>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {categoryBlocks.map((cat, i) => (
              <ScrollReveal key={cat.handle} delay={i * 0.08}>
                <Link
                  to={`/colecciones/${cat.handle}`}
                  className="group relative flex flex-col items-center overflow-hidden rounded-xl border bg-background p-8 text-center shadow-sm transition-all duration-300 hover:shadow-md hover:border-accent/30 active:scale-[0.98]"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/10">
                    <cat.icon className="h-7 w-7 text-accent" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">{cat.title}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground max-w-[220px]">{cat.desc}</p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-accent group-hover:underline">
                    Ver productos <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Por qué comprar con Contra Reembolso ── */}
      <section className="bg-foreground text-background">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:py-20">
          <ScrollReveal>
            <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl" style={{ lineHeight: '1.1' }}>
              Por qué comprar con Pago Contra Reembolso
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-center text-background/70 text-sm sm:text-base">
              Sin riesgo, sin pago anticipado. Recibes primero, pagas después.
            </p>
          </ScrollReveal>

          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {whyBuyReasons.map((r, i) => (
              <ScrollReveal key={r.title} delay={i * 0.08}>
                <div className="flex flex-col items-center text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-background/10">
                    <r.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-3 font-semibold">{r.title}</h3>
                  <p className="mt-1 text-sm text-background/60">{r.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── COD FAQ ── */}
      <section className="border-t">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:py-14">
          <CODFaq />
        </div>
      </section>

      {/* Sticky mobile CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card/95 p-3 backdrop-blur-md lg:hidden">
        <Button
          size="lg"
          asChild
          className="w-full min-h-[48px] text-base font-semibold gap-2 bg-accent text-accent-foreground hover:bg-accent/90 active:scale-[0.97]"
        >
          <Link to="/colecciones">
            <Banknote className="h-4 w-4" />
            Pedir con Contra Reembolso
          </Link>
        </Button>
      </div>
      <div className="h-16 lg:hidden" />
    </Layout>
  );
}
