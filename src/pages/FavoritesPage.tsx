import { Layout } from '@/components/layout/Layout';
import { useFavoritesStore } from '@/stores/favoritesStore';
import { useShopifyProducts } from '@/hooks/useShopify';
import { Heart, ShoppingBag } from 'lucide-react';
import { ProductCard } from '@/components/ProductCard';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function FavoritesPage() {
  const ids = useFavoritesStore((s) => s.ids);
  const { products, loading } = useShopify();

  const favorites = products?.filter((p) => ids.includes(p.node.handle)) ?? [];

  return (
    <Layout>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:py-12">
        <div className="mb-6 flex items-center gap-2 sm:mb-8">
          <Heart className="h-5 w-5 text-destructive" fill="currentColor" />
          <h1 className="text-xl font-bold sm:text-2xl">Mis favoritos</h1>
          {favorites.length > 0 && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              {favorites.length}
            </span>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 sm:gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-square animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : favorites.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Heart className="mb-4 h-12 w-12 text-muted-foreground/40" />
            <h2 className="mb-2 text-lg font-semibold">No tienes favoritos aún</h2>
            <p className="mb-6 max-w-sm text-sm text-muted-foreground">
              Explora nuestros productos y pulsa el corazón para guardarlos aquí.
            </p>
            <Link to="/colecciones">
              <Button className="gap-2">
                <ShoppingBag className="h-4 w-4" />
                Ver productos
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 sm:gap-4">
            {favorites.map((product) => (
              <ProductCard key={product.node.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
