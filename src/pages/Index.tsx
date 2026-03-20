import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useShopifyProducts, useShopifyCollections } from '@/hooks/useShopify';
import { useCartStore } from '@/stores/cartStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { CartDrawer } from '@/components/CartDrawer';
import { Search, ShoppingBag, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import logo from '@/assets/logo.png';
import bannerDesktop from '@/assets/banner-desktop.png';
import bannerMobileHombre from '@/assets/banner-mobile-hombre.png';
import bannerMobileMujer from '@/assets/banner-mobile-mujer.png';
import type { ShopifyProduct } from '@/lib/shopify';

export default function Index() {
  const [search, setSearch] = useState('');
  const { data: products, isLoading } = useShopifyProducts(search || undefined);
  const { data: collections } = useShopifyCollections();
  const addItem = useCartStore(s => s.addItem);
  const isCartLoading = useCartStore(s => s.isLoading);

  const handleAddToCart = async (product: ShopifyProduct, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const variant = product.node.variants.edges[0]?.node;
    if (!variant || !variant.availableForSale) return;
    await addItem({
      product,
      variantId: variant.id,
      variantTitle: variant.title,
      price: variant.price,
      quantity: 1,
      selectedOptions: variant.selectedOptions || [],
    });
    toast.success('Añadido al carrito', { description: product.node.title });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b bg-card/80 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <Link to="/" className="flex items-center">
            <img src={logo} alt="Revolución Fit" className="h-10" />
          </Link>
          <div className="flex items-center gap-3">
            {collections && collections.length > 0 && (
              <nav className="hidden md:flex items-center gap-4">
                {collections.map((c) => (
                  <Link
                    key={c.node.id}
                    to={`/?collection=${c.node.handle}`}
                    className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {c.node.title}
                  </Link>
                ))}
              </nav>
            )}
            <Link to="/admin" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Admin
            </Link>
            <CartDrawer />
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="hidden md:block">
          <img src={bannerDesktop} alt="Revolución Fit" className="w-full object-cover" style={{ maxHeight: '520px' }} />
        </div>
        <div className="md:hidden grid grid-cols-2">
          <img src={bannerMobileHombre} alt="Revolución Fit Hombre" className="w-full object-cover aspect-[3/4]" />
          <img src={bannerMobileMujer} alt="Revolución Fit Mujer" className="w-full object-cover aspect-[3/4]" />
        </div>
      </section>

      {/* Search */}
      <section className="border-b bg-card">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar productos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
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
        ) : !products || products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <ShoppingBag className="h-12 w-12 text-muted-foreground/40" />
            <h2 className="mt-4 text-lg font-semibold">No hay productos</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {search ? 'Intenta con otra búsqueda.' : 'Los productos aparecerán aquí cuando se añadan a la tienda Shopify.'}
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => {
              const p = product.node;
              const price = parseFloat(p.priceRange.minVariantPrice.amount);
              const compareAt = parseFloat(p.compareAtPriceRange.minVariantPrice.amount);
              const hasDiscount = compareAt > price;
              const discount = hasDiscount ? Math.round((1 - price / compareAt) * 100) : 0;
              const mainImage = p.images.edges[0]?.node;

              return (
                <Link
                  key={p.id}
                  to={`/products/${p.handle}`}
                  className="group relative overflow-hidden rounded-xl border bg-card shadow-sm transition-shadow hover:shadow-md active:scale-[0.98]"
                >
                  <div className="relative aspect-square overflow-hidden bg-muted">
                    {mainImage ? (
                      <img
                        src={mainImage.url}
                        alt={mainImage.altText || p.title}
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
                    {!p.availableForSale && (
                      <div className="absolute inset-0 flex items-center justify-center bg-foreground/40">
                        <span className="rounded-md bg-card px-3 py-1 text-sm font-semibold text-foreground">
                          Agotado
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <h3 className="font-semibold leading-snug text-foreground line-clamp-2">
                      {p.title}
                    </h3>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-lg font-bold tabular-nums">
                        €{price.toFixed(2)}
                      </span>
                      {hasDiscount && (
                        <span className="text-sm text-muted-foreground line-through tabular-nums">
                          €{compareAt.toFixed(2)}
                        </span>
                      )}
                    </div>
                    <Button
                      size="sm"
                      className="mt-3 w-full gap-2"
                      variant="default"
                      disabled={!p.availableForSale || isCartLoading}
                      onClick={(e) => handleAddToCart(product, e)}
                    >
                      {isCartLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : p.availableForSale ? 'Añadir al carrito' : 'Agotado'}
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
