import { Link } from 'react-router-dom';
import { useShopifyProducts, useShopifyCollections } from '@/hooks/useShopify';
import { Layout } from '@/components/layout/Layout';
import { ProductCard } from '@/components/ProductCard';
import { ScrollReveal } from '@/components/ScrollReveal';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  ArrowRight, ShoppingBag, Dumbbell, Heart, Sparkles,
  Shield, Star, Truck, RotateCcw, ShieldCheck, Zap,
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

const whyBuyReasons = [
  {
    icon: ShieldCheck,
    title: 'Productos testados',
    desc: 'Cada artículo pasa un control de calidad antes de llegar a tu puerta.',
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

export default function Index() {
  const { data: products, isLoading } = useShopifyProducts();
  const { data: collections } = useShopifyCollections();

  const featuredProducts = products?.slice(0, 8) || [];

  // Pick the first product with a discount as "offer of the week"
  const offerProduct = products?.find((p) => {
    const price = parseFloat(p.node.priceRange.minVariantPrice.amount);
    const compare = parseFloat(p.node.compareAtPriceRange.minVariantPrice.amount);
    return compare > price;
  });

  return (
    <Layout>
      {/* Hero */}
      <section className="relative overflow-hidden bg-foreground">
        <div className="hidden md:block">
          <img
            src={bannerDesktop}
            alt="Revolución Fit — Mejora tu rendimiento"
            className="w-full object-cover"
            style={{ maxHeight: '520px' }}
          />
        </div>
        <div className="md:hidden">
          <img src={bannerMobile} alt="Revolución Fit — Entrena con confianza" className="w-full object-cover aspect-[3/4]" />
        </div>
        {/* Gradient overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        {/* CTA overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-end gap-3 pb-8 sm:pb-12">
          <p className="text-white/80 text-xs font-medium tracking-wide sm:text-sm drop-shadow-sm">
            Envío rápido · Devolución 30 días · Pago seguro
          </p>
          <div className="flex items-center gap-3">
            <Button
              size="lg"
              asChild
              className="shadow-lg text-base font-semibold active:scale-[0.97] bg-accent text-accent-foreground hover:bg-accent/90"
            >
              <Link to="/colecciones">
                Comprar ahora <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="shadow-lg text-base font-semibold active:scale-[0.97] border-white/50 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 hover:text-white"
            >
              <Link to="/colecciones">Ver catálogo</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Best sellers */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:py-14">
        <ScrollReveal>
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl" style={{ lineHeight: '1.1' }}>
                Los más vendidos
              </h2>
              <p className="mt-1 text-muted-foreground text-sm sm:text-base">
                Lo más buscado por nuestra comunidad fitness.
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
              Los productos aparecerán aquí cuando se añadan a la tienda Shopify.
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

      {/* ── Oferta de la semana ── */}
      {offerProduct && (
        <section className="border-y bg-secondary/40">
          <div className="mx-auto max-w-7xl px-4 py-10 sm:py-14">
            <ScrollReveal>
              <div className="flex flex-col items-center gap-6 sm:flex-row sm:gap-10">
                {/* Image */}
                <Link
                  to={`/products/${offerProduct.node.handle}`}
                  className="w-full max-w-xs shrink-0 overflow-hidden rounded-xl border bg-card shadow-sm transition-shadow hover:shadow-md active:scale-[0.98]"
                >
                  {offerProduct.node.images.edges[0]?.node && (
                    <img
                      src={offerProduct.node.images.edges[0].node.url}
                      alt={offerProduct.node.title}
                      className="aspect-square w-full object-cover"
                      loading="lazy"
                    />
                  )}
                </Link>
                {/* Copy */}
                <div className="flex-1 text-center sm:text-left">
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-3 py-1 text-xs font-semibold text-destructive">
                    <Zap className="h-3.5 w-3.5" />
                    Oferta de la semana
                  </div>
                  <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl" style={{ lineHeight: '1.1' }}>
                    {offerProduct.node.title}
                  </h2>
                  <div className="mt-3 flex items-baseline justify-center gap-3 sm:justify-start">
                    <span className="text-3xl font-bold text-destructive tabular-nums">
                      {parseFloat(offerProduct.node.priceRange.minVariantPrice.amount).toFixed(2)} €
                    </span>
                    <span className="text-lg text-muted-foreground line-through tabular-nums">
                      {parseFloat(offerProduct.node.compareAtPriceRange.minVariantPrice.amount).toFixed(2)} €
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto sm:mx-0">
                    {offerProduct.node.description.slice(0, 120)}
                    {offerProduct.node.description.length > 120 ? '…' : ''}
                  </p>
                  <Button asChild size="lg" className="mt-5 active:scale-[0.97] gap-1.5 bg-accent text-accent-foreground hover:bg-accent/90">
                    <Link to={`/products/${offerProduct.node.handle}`}>
                      Ver oferta <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>
      )}

      {/* Popular categories */}
      <section className="border-b bg-card">
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

      {/* ── Por qué comprar con Revolución Fit ── */}
      <section className="bg-foreground text-background">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:py-20">
          <ScrollReveal>
            <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl" style={{ lineHeight: '1.1' }}>
              Por qué comprar con Revolución Fit
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-center text-background/70 text-sm sm:text-base">
              Equipamiento seleccionado para mejorar tu comodidad y rendimiento. Sin letra pequeña.
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
    </Layout>
  );
}
