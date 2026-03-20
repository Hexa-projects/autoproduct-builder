import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShoppingBag, Loader2, ShoppingCart } from 'lucide-react';
import { useCartStore } from '@/stores/cartStore';
import { toast } from 'sonner';
import type { ShopifyProduct } from '@/lib/shopify';

interface ProductCardProps {
  product: ShopifyProduct;
}

export function ProductCard({ product }: ProductCardProps) {
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

  // Check stock level from variants
  const availableVariants = p.variants.edges.filter((v) => v.node.availableForSale);
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
    toast.success('Añadido al carrito', { description: p.title });
  };

  return (
    <Link
      to={`/products/${p.handle}`}
      className="group relative flex flex-col overflow-hidden rounded-xl border bg-card transition-shadow duration-300 hover:shadow-lg active:scale-[0.98]"
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
            <ShoppingBag className="h-10 w-10" />
          </div>
        )}

        {/* Badges */}
        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {hasDiscount && discount > 0 && (
            <Badge className="bg-destructive text-destructive-foreground text-xs font-semibold shadow-sm">
              -{discount}%
            </Badge>
          )}
          {isAvailable && (
            <Badge variant="secondary" className="text-xs font-medium shadow-sm">
              Más vendido
            </Badge>
          )}
        </div>

        {/* Out of stock overlay */}
        {!isAvailable && (
          <div className="absolute inset-0 flex items-center justify-center bg-foreground/40">
            <span className="rounded-md bg-card px-3 py-1 text-sm font-semibold">Agotado</span>
          </div>
        )}

        {/* Quick add button - shown on hover */}
        {isAvailable && !hasMultipleVariants && (
          <Button
            size="sm"
            className={`absolute bottom-3 right-3 gap-1.5 shadow-md transition-all duration-300 ${
              hovering ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
            }`}
            onClick={handleQuickAdd}
            disabled={isCartLoading}
          >
            {isCartLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <>
                <ShoppingCart className="h-3.5 w-3.5" />
                Añadir
              </>
            )}
          </Button>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col p-4">
        {/* Stock indicator */}
        <div className="mb-1.5 flex items-center gap-1.5">
          <div className={`h-1.5 w-1.5 rounded-full ${isAvailable ? 'bg-accent' : 'bg-destructive'}`} />
          <span className="text-[11px] font-medium text-muted-foreground">
            {!isAvailable ? 'Agotado' : availableVariants.length <= 3 ? 'Últimas unidades' : 'En existencias'}
          </span>
        </div>

        <h3 className="font-semibold leading-snug text-foreground line-clamp-2 text-sm">{p.title}</h3>

        {/* Price */}
        <div className="mt-2 flex items-baseline gap-2">
          {hasDiscount && (
            <span className="text-sm text-muted-foreground line-through tabular-nums">
              €{compareAt.toFixed(2)}
            </span>
          )}
          <span className={`text-lg font-bold tabular-nums ${hasDiscount ? 'text-destructive' : ''}`}>
            €{price.toFixed(2)}
          </span>
        </div>

        {/* Variant options preview */}
        {hasMultipleVariants && (
          <div className="mt-2.5 flex flex-wrap gap-1">
            {p.options
              .filter((o) => o.name !== 'Title')
              .slice(0, 1)
              .map((option) =>
                option.values.slice(0, 5).map((value) => (
                  <span
                    key={value}
                    className="rounded border px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
                  >
                    {value}
                  </span>
                ))
              )}
            {p.options[0]?.values.length > 5 && (
              <span className="rounded border px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                +{p.options[0].values.length - 5}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
