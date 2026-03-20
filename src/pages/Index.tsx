import { Link } from 'react-router-dom';
import { useShopifyProducts, useShopifyCollections } from '@/hooks/useShopify';
import { Layout } from '@/components/layout/Layout';
import { ProductCard } from '@/components/ProductCard';
import { ScrollReveal } from '@/components/ScrollReveal';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowRight, ShoppingBag, Dumbbell, Heart, Sparkles, Shield, Star } from 'lucide-react';
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

const valueProps = [
  { icon: Star, title: 'Calidad probada', desc: 'Materiales de alta durabilidad para uso diario.' },
  { icon: Shield, title: 'Compra segura', desc: 'Pago encriptado y protección al comprador.' },
  { icon: Heart, title: 'Satisfacción garantizada', desc: 'Devolución gratuita en 30 días.' },
];

export default function Index() {
  const { data: products, isLoading } = useShopifyProducts();
  const { data: collections } = useShopifyCollections();

  const featuredProducts = products?.slice(0, 8) || [];

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
        {/* CTA overlay */}
        <div className="absolute inset-0 flex items-end justify-center pb-8 sm:pb-12">
          <Button size="lg" asChild className="shadow-lg text-base font-semibold active:scale-[0.97]">
            <Link to="/colecciones">
              Ver colecciones <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
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
            <Button variant="ghost" asChild className="hidden sm:flex gap-1">
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
          <Button variant="outline" asChild>
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
                  className="group relative flex flex-col items-center overflow-hidden rounded-xl border bg-background p-8 text-center shadow-sm transition-all duration-300 hover:shadow-md active:scale-[0.98]"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
                    <cat.icon className="h-7 w-7 text-foreground" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">{cat.title}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground max-w-[220px]">{cat.desc}</p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-foreground group-hover:underline">
                    Ver productos <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Brand story / value proposition */}
      <section className="bg-foreground text-background">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:py-20">
          <ScrollReveal>
            <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl" style={{ lineHeight: '1.1' }}>
              Tu tienda de fitness de confianza
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-center text-background/70 text-sm sm:text-base">
              En Revolución Fit ofrecemos equipamiento diseñado para mejorar tu comodidad y rendimiento en cada sesión.
              Calidad, funcionalidad y precios accesibles para que te centres en lo que importa: tu entrenamiento.
            </p>
          </ScrollReveal>

          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {valueProps.map((vp, i) => (
              <ScrollReveal key={vp.title} delay={i * 0.08}>
                <div className="flex flex-col items-center text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-background/10">
                    <vp.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-3 font-semibold">{vp.title}</h3>
                  <p className="mt-1 text-sm text-background/60">{vp.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}
