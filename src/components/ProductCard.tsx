import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShoppingBag, Loader2, ShoppingCart } from 'lucide-react';
import { useCartStore } from '@/stores/cartStore';
import { toast } from 'sonner';
import { trackAddToCart } from '@/lib/tracking';
import type { ShopifyProduct } from '@/lib/shopify';

interface ProductCardProps {
  product: ShopifyProduct;
  isBestSeller?: boolean;
}

export function ProductCard({ product, isBestSeller }: ProductCardProps) {
  const p = product.node;
  const addItem = useCartStore((s) => s.addItem);
  const isCartLoading = useCartStore((s) => s.isLoading);
  const [hovering, setHovering] = useState(false);

  const price = parseFloat(p.priceRange.minVariantPrice.amount);
  const compareAt = parseFloat(p.compareAtPriceRange.minVariantPrice.amount);
  const hasDiscount = compareAt > price;
  const discount = hasDiscount ? Math.round((1 - price / compareAt) * 100) : 0;
  const mainImage = p.images.edges[0]?.node;
  const hoverImage = p.images.edges[1]?.node;
  const isAvailable = p.availableForSale;

  const hasMultipleVariants = p.variants.edges.length > 1 && p.options.some(o => o.name !== 'Title' || o.values.length > 1);

  const handleQuickAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const variant = p.variants.edges.find((v) => v.node.availableForSale)?.node;
    if (!variant) return;
    await addItem({
      product,
      variantId: variant.id,
      variantTitle: variant.title,
      price: variant.price,
      quantity: 1,
      selectedOptions: variant.selectedOptions || [],
    });
    trackAddToCart({
      id: variant.id,
      title: p.title,
      price: parseFloat(variant.price.amount),
      currency: variant.price.currencyCode,
      quantity: 1,
    });
    toast.success('Añadido al carrito', { description: p.title });
  };

  return (
    <Link
      to={`/products/${p.handle}`}
      className="group relative flex flex-col overflow-hidden rounded-lg border bg-card transition-shadow duration-300 hover:shadow-lg active:scale-[0.98]"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-muted">
        {mainImage ? (
          <>
            <img
              src={mainImage.url}
              alt={mainImage.altText || p.title}
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
                hovering && hoverImage ? 'opacity-0' : 'opacity-100'
              }`}
              loading="lazy"
            />
            {hoverImage && (
              <img
                src={hoverImage.url}
                alt={hoverImage.altText || p.title}
                className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
                  hovering ? 'opacity-100' : 'opacity-0'
                }`}
                loading="lazy"
              />
            )}
          </>
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <ShoppingBag className="h-8 w-8" />
          </div>
        )}

        {/* Badges */}
        <div className="absolute left-2 top-2 flex flex-col gap-1">
          {hasDiscount && discount > 0 && (
            <Badge className="bg-destructive text-destructive-foreground text-[10px] font-semibold shadow-sm px-1.5 py-0.5">
              -{discount}%
            </Badge>
          )}
          {isBestSeller && (
            <Badge variant="secondary" className="text-[10px] font-medium shadow-sm px-1.5 py-0.5">
              Top ventas
            </Badge>
          )}
        </div>

        {/* Out of stock */}
        {!isAvailable && (
          <div className="absolute inset-0 flex items-center justify-center bg-foreground/40">
            <span className="rounded-md bg-card px-2 py-0.5 text-xs font-semibold">Agotado</span>
          </div>
        )}

        {/* Quick add — desktop only */}
        {isAvailable && !hasMultipleVariants && (
          <Button
            size="sm"
            className={`absolute bottom-2 right-2 gap-1 shadow-md transition-all duration-300 bg-accent text-accent-foreground hover:bg-accent/90 text-xs h-8 px-2.5 hidden sm:flex ${
              hovering ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
            }`}
            onClick={handleQuickAdd}
            disabled={isCartLoading}
          >
            {isCartLoading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <>
                <ShoppingCart className="h-3 w-3" />
                Añadir
              </>
            )}
          </Button>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col p-2.5 sm:p-4">
        {!isAvailable && (
          <div className="mb-1 flex items-center gap-1">
            <div className="h-1.5 w-1.5 rounded-full bg-destructive" />
            <span className="text-[10px] font-medium text-destructive">Agotado</span>
          </div>
        )}

        <h3 className="font-semibold leading-snug text-foreground line-clamp-2 text-xs sm:text-sm">{p.title}</h3>

        {/* Price */}
        <div className="mt-1.5 flex flex-wrap items-baseline gap-1 sm:gap-2 sm:mt-2">
          {hasDiscount && (
            <span className="text-[11px] text-muted-foreground line-through tabular-nums sm:text-sm">
              €{compareAt.toFixed(2)}
            </span>
          )}
          <span className={`text-sm font-bold tabular-nums sm:text-lg ${hasDiscount ? 'text-destructive' : ''}`}>
            €{price.toFixed(2)}
          </span>
        </div>
        {hasDiscount && hasSavings(price, compareAt) && (
          <span className="text-[10px] font-semibold text-accent mt-0.5 sm:text-[11px]">
            Ahorras €{(compareAt - price).toFixed(2)}
          </span>
        )}

        {/* Variant options */}
        {hasMultipleVariants && (
          <div className="mt-2 flex flex-wrap gap-1">
            {p.options
              .filter((o) => o.name !== 'Title')
              .slice(0, 1)
              .map((option) =>
                option.values.slice(0, 3).map((value) => (
                  <span
                    key={value}
                    className="rounded border px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
                  >
                    {value}
                  </span>
                ))
              )}
            {p.options[0]?.values.length > 3 && (
              <span className="rounded border px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                +{p.options[0].values.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}

function hasSavings(price: number, compareAt: number): boolean {
  return compareAt > price;
}
