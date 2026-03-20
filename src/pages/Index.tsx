import { useState } from 'react';
import { Link } from 'react-router-dom';
import { usePublishedProducts, useCategories } from '@/hooks/useProducts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Search, ShoppingBag, Star } from 'lucide-react';
import logo from '@/assets/logo.png';
import bannerDesktop from '@/assets/banner-desktop.png';
import bannerMobileHombre from '@/assets/banner-mobile-hombre.png';
import bannerMobileMujer from '@/assets/banner-mobile-mujer.png';

export default function Index() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sort, setSort] = useState<'newest' | 'price_asc' | 'price_desc'>('newest');
  const [featuredOnly, setFeaturedOnly] = useState(false);

  const { data: products, isLoading } = usePublishedProducts({
    search: search || undefined,
    category: categoryFilter !== 'all' ? categoryFilter : undefined,
    featured: featuredOnly || undefined,
    sort,
  });
  const { data: categories } = useCategories();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b bg-card/80 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <Link to="/" className="flex items-center">
            <img src={logo} alt="Revolución Fit" className="h-10" />
          </Link>
          <nav className="flex items-center gap-4">
            <Link to="/admin" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Admin
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero — desktop banner + mobile banners */}
      <section className="relative overflow-hidden">
        {/* Desktop */}
        <div className="hidden md:block">
          <img
            src={bannerDesktop}
            alt="Revolución Fit — Tu mejor versión empieza aquí"
            className="w-full object-cover"
            style={{ maxHeight: '520px' }}
          />
        </div>
        {/* Mobile — two banners side by side as a swipeable feel */}
        <div className="md:hidden grid grid-cols-2">
          <img
            src={bannerMobileHombre}
            alt="Revolución Fit Hombre"
            className="w-full object-cover aspect-[3/4]"
          />
          <img
            src={bannerMobileMujer}
            alt="Revolución Fit Mujer"
            className="w-full object-cover aspect-[3/4]"
          />
        </div>
      </section>

      {/* Filters */}
      <section className="border-b bg-card">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-4">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar productos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              {categories?.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sort} onValueChange={(v) => setSort(v as any)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Más recientes</SelectItem>
              <SelectItem value="price_asc">Precio: menor</SelectItem>
              <SelectItem value="price_desc">Precio: mayor</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant={featuredOnly ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFeaturedOnly(!featuredOnly)}
            className="gap-1.5"
          >
            <Star className="h-3.5 w-3.5" />
            Destacados
          </Button>
        </div>
      </section>

      {/* Product Grid */}
      <section className="mx-auto max-w-7xl px-4 py-8">
        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-square w-full rounded-xl" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : products?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <ShoppingBag className="h-12 w-12 text-muted-foreground/40" />
            <h2 className="mt-4 text-lg font-semibold">No hay productos</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {search ? 'Intenta con otra búsqueda.' : 'Los productos aparecerán aquí cuando se publiquen.'}
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products?.map((product) => {
              const price = product.promotional_price ?? product.original_price;
              const hasDiscount = product.promotional_price && product.original_price && product.promotional_price < product.original_price;
              const discount = hasDiscount
                ? Math.round((1 - Number(product.promotional_price) / Number(product.original_price)) * 100)
                : 0;

              return (
                <Link
                  key={product.id}
                  to={`/products/${product.slug}`}
                  className="group relative overflow-hidden rounded-xl border bg-card shadow-sm transition-shadow hover:shadow-md active:scale-[0.98]"
                >
                  <div className="relative aspect-square overflow-hidden bg-muted">
                    {product.main_image ? (
                      <img
                        src={product.main_image}
                        alt={product.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-muted-foreground">
                        <ShoppingBag className="h-10 w-10" />
                      </div>
                    )}
                    {hasDiscount && discount > 0 && (
                      <Badge className="absolute left-3 top-3 bg-accent text-accent-foreground font-semibold shadow-sm">
                        -{discount}%
                      </Badge>
                    )}
                    {product.stock === 0 && (
                      <div className="absolute inset-0 flex items-center justify-center bg-foreground/40">
                        <span className="rounded-md bg-card px-3 py-1 text-sm font-semibold text-foreground">
                          Agotado
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    {product.category && (
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {product.category.name}
                      </p>
                    )}
                    <h3 className="mt-1 font-semibold leading-snug text-foreground line-clamp-2">
                      {product.name}
                    </h3>
                    <div className="mt-2 flex items-baseline gap-2">
                      {price && (
                        <span className="text-lg font-bold tabular-nums">
                          €{Number(price).toFixed(2)}
                        </span>
                      )}
                      {hasDiscount && (
                        <span className="text-sm text-muted-foreground line-through tabular-nums">
                          €{Number(product.original_price).toFixed(2)}
                        </span>
                      )}
                    </div>
                    <Button size="sm" className="mt-3 w-full gap-2" variant="default">
                      Ver producto
                    </Button>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t bg-card py-8">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <img src={logo} alt="Revolución Fit" className="mx-auto h-8 mb-3" />
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Revolución Fit. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
