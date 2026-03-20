import { Link } from 'react-router-dom';
import { useShopifyProducts, useShopifyCollections } from '@/hooks/useShopify';
import { Layout } from '@/components/layout/Layout';
import { ProductCard } from '@/components/ProductCard';
import { ScrollReveal } from '@/components/ScrollReveal';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowRight, ShoppingBag, Dumbbell, Heart, Sparkles } from 'lucide-react';
import bannerDesktop from '@/assets/banner-desktop.png';
import bannerMobileHombre from '@/assets/banner-mobile-hombre.png';
import bannerMobileMujer from '@/assets/banner-mobile-mujer.png';

const categoryBlocks = [
  {
    title: 'Soporte y Postura',
    desc: 'Fajas, muñequeras y soportes para entrenar con confianza.',
    icon: Dumbbell,
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
    icon: Sparkles,
    handle: 'accesorios',
  },
];

export default function Index() {
  const { data: products, isLoading } = useShopifyProducts();
  const { data: collections } = useShopifyCollections();

  return (
    <Layout>
      {/* Hero */}
      <section className="relative overflow-hidden bg-primary">
        <div className="hidden md:block">
          <img
            src={bannerDesktop}
            alt="Revolución Fit — Mejora tu rendimiento"
            className="w-full object-cover"
            style={{ maxHeight: '520px' }}
          />
        </div>
        <div className="md:hidden grid grid-cols-2">
          <img src={bannerMobileHombre} alt="Revolución Fit Hombre" className="w-full object-cover aspect-[3/4]" />
          <img src={bannerMobileMujer} alt="Revolución Fit Mujer" className="w-full object-cover aspect-[3/4]" />
        </div>
      </section>

      {/* Category blocks */}
      <section className="border-b bg-card">
        <div className="mx-auto max-w-7xl px-4 py-12">
          <ScrollReveal>
            <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl" style={{ lineHeight: '1.15' }}>
              Encuentra lo que necesitas
            </h2>
            <p className="mx-auto mt-2 max-w-lg text-center text-muted-foreground">
              Equipamiento diseñado para mejorar tu comodidad y rendimiento en cada sesión.
            </p>
          </ScrollReveal>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {categoryBlocks.map((cat, i) => (
              <ScrollReveal key={cat.handle} delay={i * 0.08}>
                <Link
                  to={`/colecciones/${cat.handle}`}
                  className="group flex flex-col items-center rounded-xl border bg-background p-6 text-center shadow-sm transition-shadow duration-300 hover:shadow-md active:scale-[0.98]"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
                    <cat.icon className="h-6 w-6 text-foreground" />
                  </div>
                  <h3 className="mt-3 font-semibold">{cat.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{cat.desc}</p>
                  <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-foreground opacity-0 transition-opacity group-hover:opacity-100">
                    Ver productos <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Best sellers / All products */}
      <section className="mx-auto max-w-7xl px-4 py-12">
        <ScrollReveal>
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl" style={{ lineHeight: '1.15' }}>
                Productos destacados
              </h2>
              <p className="mt-1 text-muted-foreground">Lo más buscado por nuestra comunidad.</p>
            </div>
            <Button variant="ghost" asChild className="hidden sm:flex">
              <Link to="/colecciones" className="gap-1">
                Ver todo <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </ScrollReveal>

        {isLoading ? (
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-square w-full rounded-xl" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : !products || products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <ShoppingBag className="h-12 w-12 text-muted-foreground/40" />
            <h3 className="mt-4 text-lg font-semibold">No hay productos todavía</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Los productos aparecerán aquí cuando se añadan a la tienda Shopify.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product, i) => (
              <ScrollReveal key={product.node.id} delay={i * 0.06}>
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
    </Layout>
  );
}
