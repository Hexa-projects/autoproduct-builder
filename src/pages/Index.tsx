import { Link } from 'react-router-dom';
import { useShopifyProducts, useShopifyCollections } from '@/hooks/useShopify';
import { Layout } from '@/components/layout/Layout';
import { ProductCard } from '@/components/ProductCard';
import { ScrollReveal } from '@/components/ScrollReveal';
import { CODFaq } from '@/components/CODFaq';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  ArrowRight, ShoppingBag, Dumbbell, Heart,
  Shield, Star, Truck, RotateCcw, ShieldCheck,
  Banknote, Phone, Package, MessageCircle,
} from 'lucide-react';
import bannerDesktop from '@/assets/banner-desktop.png';

const categoryBlocks = [
  {
    title: 'Soporte y Postura',
    desc: 'Fajas, muñequeras y soportes.',
    icon: Shield,
    handle: 'soporte-postura',
  },
  {
    title: 'Recuperación',
    desc: 'Rodillos, bandas y accesorios.',
    icon: Heart,
    handle: 'recuperacion',
  },
  {
    title: 'Accesorios Gym',
    desc: 'Guantes, correas y más.',
    icon: Dumbbell,
    handle: 'accesorios',
  },
];

const codSteps = [
  {
    icon: ShoppingBag,
    step: '1',
    title: 'Haces tu pedido',
    desc: 'Sin tarjeta ni pago anticipado.',
  },
  {
    icon: MessageCircle,
    step: '2',
    title: 'Procesamos tu pedido',
    desc: 'Enviamos tu pedido a la transportadora en la misma hora.',
  },
  {
    icon: Banknote,
    step: '3',
    title: 'Recibes y pagas',
    desc: 'Pagas al repartidor en tu domicilio.',
  },
];

const guarantees = [
  { icon: Banknote, text: 'Sin pago anticipado' },
  { icon: Phone, text: 'Atención en español' },
  { icon: RotateCcw, text: 'Devolución 30 días' },
  { icon: Package, text: 'Seguimiento envío' },
];

const whyBuyReasons = [
  {
    icon: ShieldCheck,
    title: 'Sin riesgo para ti',
    desc: 'Pagas solo cuando tienes el producto en tus manos.',
  },
  {
    icon: RotateCcw,
    title: 'Devolución sin excusas',
    desc: '30 días para devolver gratis.',
  },
  {
    icon: Truck,
    title: 'Envío rápido España',
    desc: 'Recíbelo en 2–5 días laborables.',
  },
];

const topCODHandles = [
  'rodillera-estabilizadora-de-rotula-1',
  'masajeador-de-rodilla-con-calefactor',
  'giroscopio-de-mano-para-fortalecer-muneca',
];

export default function Index() {
  const { data: products, isLoading } = useShopifyProducts();
  const { data: collections } = useShopifyCollections();

  const featuredProducts = products?.slice(0, 8) || [];
  const topCODProducts = products?.filter((p) =>
    topCODHandles.includes(p.node.handle)
  ) || [];

  return (
    <Layout>
      {/* Hero — horizontal layout */}
      <section className="relative overflow-hidden bg-foreground">
        <img
          src={bannerDesktop}
          alt="Revolución Fit — Compra y paga al recibir"
          className="w-full object-cover h-[220px] sm:h-[320px] md:h-[420px] lg:h-[480px]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent sm:bg-gradient-to-r sm:from-black/75 sm:via-black/40 sm:to-transparent" />
        <div className="absolute inset-0 flex items-center">
          <div className="w-full px-4 sm:px-8 lg:px-12 max-w-7xl mx-auto">
            <div className="max-w-sm sm:max-w-md">
              <h1
                className="text-white text-base font-bold tracking-tight drop-shadow-lg sm:text-2xl md:text-3xl lg:text-4xl"
                style={{ fontFamily: 'Space Grotesk', lineHeight: '1.15' }}
              >
                Compra hoy y paga al recibir
              </h1>
              <p className="text-white/80 text-[11px] mt-1 drop-shadow-sm sm:text-sm sm:mt-2 max-w-xs sm:max-w-sm">
                Sin tarjeta, sin pago anticipado. Confirmamos tu pedido y pagas en casa.
              </p>
              <div className="flex flex-col gap-2 mt-3 sm:flex-row sm:items-center sm:gap-3 sm:mt-4">
                <Button
                  size="lg"
                  asChild
                  className="shadow-lg text-xs font-semibold active:scale-[0.97] bg-accent text-accent-foreground hover:bg-accent/90 min-h-[42px] gap-2 w-full sm:w-auto sm:text-sm sm:min-h-[48px]"
                >
                  <Link to="/colecciones">
                    <Banknote className="h-4 w-4 shrink-0" />
                    Pedir con Contra Reembolso
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  asChild
                  className="shadow-lg text-xs font-semibold active:scale-[0.97] border-white/50 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 hover:text-white w-full sm:w-auto sm:text-sm"
                >
                  <Link to="/colecciones">
                    Ver más vendidos <ArrowRight className="h-4 w-4 ml-1 shrink-0" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cómo funciona */}
      <section className="border-b bg-card">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:py-14">
          <ScrollReveal>
            <h2 className="text-center text-xl font-bold tracking-tight sm:text-3xl" style={{ lineHeight: '1.1' }}>
              Cómo funciona
            </h2>
            <p className="mx-auto mt-1.5 max-w-lg text-center text-xs text-muted-foreground sm:text-sm">
              Compra sin riesgo en 3 pasos
            </p>
          </ScrollReveal>

          <div className="mt-6 grid gap-3 grid-cols-1 sm:grid-cols-3 sm:gap-6">
            {codSteps.map((s, i) => (
              <ScrollReveal key={s.step} delay={i * 0.1}>
                <div className="flex items-center gap-4 rounded-xl border bg-background p-4 shadow-sm sm:flex-col sm:items-center sm:text-center sm:p-6">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground text-sm font-bold sm:h-14 sm:w-14 sm:mb-2">
                    {s.step}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-sm sm:text-lg">{s.title}</h3>
                    <p className="mt-0.5 text-xs text-muted-foreground sm:mt-2 sm:text-sm">{s.desc}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>

          {/* Guarantees */}
          <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
            {guarantees.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-1.5 rounded-lg border bg-background p-2.5 sm:p-3">
                <Icon className="h-4 w-4 shrink-0 text-accent sm:h-5 sm:w-5" />
                <span className="text-[11px] font-medium leading-tight sm:text-sm">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Más vendidos COD */}
      {topCODProducts.length > 0 && (
        <section className="border-b bg-accent/5">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:py-14">
            <ScrollReveal>
              <div className="text-center">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent mb-2">
                  <Star className="h-3.5 w-3.5" />
                  Los favoritos
                </div>
                <h2 className="text-xl font-bold tracking-tight sm:text-3xl" style={{ lineHeight: '1.1' }}>
                  Más vendidos con Pago al Recibir
                </h2>
                <p className="mt-1.5 text-xs text-muted-foreground sm:text-sm">
                  Los más pedidos por nuestros clientes.
                </p>
              </div>
            </ScrollReveal>
            <div className="mt-6 grid gap-4 grid-cols-2 max-w-2xl mx-auto sm:gap-6">
              {topCODProducts.map((product, i) => (
                <ScrollReveal key={product.node.id} delay={i * 0.08}>
                  <ProductCard product={product} />
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Todos los productos */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:py-14">
        <ScrollReveal>
          <div className="flex items-end justify-between gap-2">
            <div className="min-w-0">
              <h2 className="text-xl font-bold tracking-tight sm:text-3xl" style={{ lineHeight: '1.1' }}>
                Todos los productos
              </h2>
              <p className="mt-1 text-muted-foreground text-xs sm:text-base">
                Con pago contra reembolso disponible.
              </p>
            </div>
            <Button variant="outline" asChild className="hidden sm:flex gap-1 text-accent border-accent/30 hover:bg-accent/10 hover:text-accent shrink-0">
              <Link to="/colecciones">
                Ver todo <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </ScrollReveal>

        {isLoading ? (
          <div className="mt-5 grid gap-3 grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="aspect-square w-full rounded-xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : featuredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <ShoppingBag className="h-10 w-10 text-muted-foreground/40" />
            <h3 className="mt-3 text-base font-semibold">No hay productos todavía</h3>
          </div>
        ) : (
          <div className="mt-5 grid gap-3 grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
            {featuredProducts.map((product, i) => (
              <ScrollReveal key={product.node.id} delay={i * 0.04}>
                <ProductCard product={product} />
              </ScrollReveal>
            ))}
          </div>
        )}

        <div className="mt-6 text-center sm:hidden">
          <Button variant="outline" asChild size="sm" className="text-accent border-accent/30 hover:bg-accent/10 hover:text-accent gap-1">
            <Link to="/colecciones">
              Ver todo el catálogo <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Categorías */}
      <section className="border-y bg-card">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:py-14">
          <ScrollReveal>
            <h2 className="text-center text-xl font-bold tracking-tight sm:text-3xl" style={{ lineHeight: '1.1' }}>
              Categorías populares
            </h2>
          </ScrollReveal>

          <div className="mt-6 grid gap-3 grid-cols-1 sm:grid-cols-3 sm:gap-4">
            {categoryBlocks.map((cat, i) => (
              <ScrollReveal key={cat.handle} delay={i * 0.08}>
                <Link
                  to={`/colecciones/${cat.handle}`}
                  className="group flex items-center gap-4 overflow-hidden rounded-xl border bg-background p-4 shadow-sm transition-all duration-300 hover:shadow-md active:scale-[0.98] sm:flex-col sm:items-center sm:p-8 sm:text-center"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent/10 sm:h-14 sm:w-14">
                    <cat.icon className="h-5 w-5 text-accent sm:h-7 sm:w-7" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold sm:mt-4 sm:text-lg">{cat.title}</h3>
                    <p className="mt-0.5 text-xs text-muted-foreground sm:mt-1.5 sm:text-sm">{cat.desc}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-accent sm:hidden" />
                </Link>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Por qué COD */}
      <section className="bg-foreground text-background">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:py-20">
          <ScrollReveal>
            <h2 className="text-center text-xl font-bold tracking-tight sm:text-3xl" style={{ lineHeight: '1.1' }}>
              Por qué Pago Contra Reembolso
            </h2>
            <p className="mx-auto mt-2 max-w-md text-center text-background/70 text-xs sm:text-base">
              Sin riesgo. Recibes primero, pagas después.
            </p>
          </ScrollReveal>

          <div className="mt-8 grid gap-6 grid-cols-1 sm:grid-cols-3">
            {whyBuyReasons.map((r, i) => (
              <ScrollReveal key={r.title} delay={i * 0.08}>
                <div className="flex items-start gap-4 sm:flex-col sm:items-center sm:text-center">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-background/10 sm:h-12 sm:w-12">
                    <r.icon className="h-5 w-5 sm:h-6 sm:w-6" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-sm sm:mt-3 sm:text-base">{r.title}</h3>
                    <p className="mt-0.5 text-xs text-background/60 sm:mt-1 sm:text-sm">{r.desc}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:py-14">
          <CODFaq />
        </div>
      </section>

      {/* Sticky mobile CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card/95 p-3 backdrop-blur-md lg:hidden">
        <Button
          size="lg"
          asChild
          className="w-full min-h-[48px] text-sm font-semibold gap-2 bg-accent text-accent-foreground hover:bg-accent/90 active:scale-[0.97]"
        >
          <Link to="/colecciones">
            <Banknote className="h-4 w-4 shrink-0" />
            Pedir con Contra Reembolso
          </Link>
        </Button>
      </div>
      <div className="h-[60px] lg:hidden" />
    </Layout>
  );
}
