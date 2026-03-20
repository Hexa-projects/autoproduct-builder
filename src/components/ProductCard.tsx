import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShoppingBag, Loader2 } from 'lucide-react';
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

  const price = parseFloat(p.priceRange.minVariantPrice.amount);
  const compareAt = parseFloat(p.compareAtPriceRange.minVariantPrice.amount);
  const hasDiscount = compareAt > price;
  const discount = hasDiscount ? Math.round((1 - price / compareAt) * 100) : 0;
  const mainImage = p.images.edges[0]?.node;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const variant = p.variants.edges[0]?.node;
    if (!variant || !variant.availableForSale) return;
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
      className="group relative flex flex-col overflow-hidden rounded-xl border bg-card shadow-sm transition-shadow duration-300 hover:shadow-lg active:scale-[0.98]"
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
            <span className="rounded-md bg-card px-3 py-1 text-sm font-semibold">Agotado</span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-semibold leading-snug text-foreground line-clamp-2">{p.title}</h3>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-lg font-bold tabular-nums">€{price.toFixed(2)}</span>
          {hasDiscount && (
            <span className="text-sm text-muted-foreground line-through tabular-nums">
              €{compareAt.toFixed(2)}
            </span>
          )}
        </div>
        <Button
          size="sm"
          className="mt-3 w-full gap-2 active:scale-[0.97]"
          disabled={!p.availableForSale || isCartLoading}
          onClick={handleAddToCart}
        >
          {isCartLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : p.availableForSale ? (
            'Añadir al carrito'
          ) : (
            'Agotado'
          )}
        </Button>
      </div>
    </Link>
  );
}
