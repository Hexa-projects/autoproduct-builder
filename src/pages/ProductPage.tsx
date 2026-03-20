import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useShopifyProductByHandle } from '@/hooks/useShopify';
import { useCartStore } from '@/stores/cartStore';
import { CartDrawer } from '@/components/CartDrawer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Truck, ShieldCheck, RotateCcw, ShoppingBag, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import logo from '@/assets/logo.png';

export default function ProductPage() {
  const { slug } = useParams();
  const { data: product, isLoading, error } = useShopifyProductByHandle(slug || '');
  const addItem = useCartStore(s => s.addItem);
  const isCartLoading = useCartStore(s => s.isLoading);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);

  // Track ViewContent
  useEffect(() => {
    if (product && typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('track', 'ViewContent', {
        content_name: product.title,
        content_ids: [product.id],
        content_type: 'product',
        value: parseFloat(product.priceRange.minVariantPrice.amount),
        currency: product.priceRange.minVariantPrice.currencyCode,
      });
    }
  }, [product]);

  // Set default variant
  useEffect(() => {
    if (product && !selectedVariantId) {
      const firstAvailable = product.variants.edges.find(v => v.node.availableForSale);
      setSelectedVariantId(firstAvailable?.node.id || product.variants.edges[0]?.node.id || null);
    }
  }, [product, selectedVariantId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-30 border-b bg-card/80 backdrop-blur-sm">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
            <Link to="/" className="flex items-center"><img src={logo} alt="Revolución Fit" className="h-10" /></Link>
            <CartDrawer />
          </div>
        </header>
        <div className="mx-auto max-w-6xl px-4 py-8">
          <div className="grid gap-8 lg:grid-cols-2">
            <Skeleton className="aspect-square rounded-xl" />
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-12 w-1/3" />
              <Skeleton className="h-40 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background text-center">
        <ShoppingBag className="h-16 w-16 text-muted-foreground/40" />
        <h1 className="mt-4 text-xl font-bold">Producto no encontrado</h1>
        <Button asChild className="mt-4" variant="outline">
          <Link to="/">Volver al catálogo</Link>
        </Button>
      </div>
    );
  }

  const allImages = product.images.edges.map(e => e.node);
  const selectedVariant = product.variants.edges.find(v => v.node.id === selectedVariantId)?.node
    || product.variants.edges[0]?.node;

  const price = selectedVariant ? parseFloat(selectedVariant.price.amount) : parseFloat(product.priceRange.minVariantPrice.amount);
  const compareAt = selectedVariant?.compareAtPrice ? parseFloat(selectedVariant.compareAtPrice.amount) : 0;
  const hasDiscount = compareAt > price;
  const discount = hasDiscount ? Math.round((1 - price / compareAt) * 100) : 0;
  const savings = hasDiscount ? (compareAt - price).toFixed(2) : null;

  const handleAddToCart = async () => {
    if (!selectedVariant || !selectedVariant.availableForSale) return;
    await addItem({
      product: { node: product } as any,
      variantId: selectedVariant.id,
      variantTitle: selectedVariant.title,
      price: selectedVariant.price,
      quantity: 1,
      selectedOptions: selectedVariant.selectedOptions || [],
    });
    toast.success('Añadido al carrito', { description: product.title });
  };

  // Build option groups
  const optionGroups = product.options.filter(o => o.name !== 'Title' || o.values.length > 1);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b bg-card/80 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <Link to="/" className="flex items-center"><img src={logo} alt="Revolución Fit" className="h-10" /></Link>
          <CartDrawer />
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-6">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground transition-colors">Inicio</Link>
          <span>/</span>
          <span className="text-foreground">{product.title}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Gallery */}
          <div className="space-y-3">
            <div className="aspect-square overflow-hidden rounded-xl bg-muted">
              {allImages[selectedImage] ? (
                <img src={allImages[selectedImage].url} alt={allImages[selectedImage].altText || product.title} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center"><ShoppingBag className="h-16 w-16 text-muted-foreground/30" /></div>
              )}
            </div>
            {allImages.length > 1 && (
              <div className="flex gap-2 overflow-auto">
                {allImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${i === selectedImage ? 'border-primary' : 'border-transparent hover:border-muted-foreground/30'}`}
                  >
                    <img src={img.url} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight" style={{ lineHeight: '1.15' }}>
              {product.title}
            </h1>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold tabular-nums">€{price.toFixed(2)}</span>
              {hasDiscount && (
                <>
                  <span className="text-lg text-muted-foreground line-through tabular-nums">€{compareAt.toFixed(2)}</span>
                  <Badge className="bg-accent text-accent-foreground font-semibold">-{discount}%</Badge>
                </>
              )}
            </div>
            {savings && (
              <p className="text-sm font-medium" style={{ color: 'hsl(var(--success))' }}>¡Ahorras €{savings}!</p>
            )}

            {!product.availableForSale && (
              <Badge variant="destructive" className="text-sm">Agotado</Badge>
            )}

            {/* Variant selectors */}
            {optionGroups.map((option) => (
              <div key={option.name} className="space-y-2">
                <p className="text-sm font-medium">{option.name}</p>
                <div className="flex flex-wrap gap-2">
                  {option.values.map((value) => {
                    // Find variant matching this option value
                    const matchingVariant = product.variants.edges.find(v =>
                      v.node.selectedOptions.some(o => o.name === option.name && o.value === value)
                    );
                    const isSelected = selectedVariant?.selectedOptions.some(o => o.name === option.name && o.value === value);
                    return (
                      <Button
                        key={value}
                        variant={isSelected ? 'default' : 'outline'}
                        size="sm"
                        disabled={matchingVariant && !matchingVariant.node.availableForSale}
                        onClick={() => matchingVariant && setSelectedVariantId(matchingVariant.node.id)}
                      >
                        {value}
                      </Button>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* CTA */}
            <Button
              size="lg"
              className="w-full text-base font-semibold shadow-md active:scale-[0.97] transition-transform"
              onClick={handleAddToCart}
              disabled={!product.availableForSale || !selectedVariant?.availableForSale || isCartLoading}
            >
              {isCartLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : !product.availableForSale ? 'Agotado' : 'Añadir al carrito'}
            </Button>

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-3 rounded-xl border p-4">
              <div className="flex flex-col items-center gap-1 text-center">
                <Truck className="h-5 w-5 text-muted-foreground" />
                <span className="text-xs font-medium">Envío rápido</span>
              </div>
              <div className="flex flex-col items-center gap-1 text-center">
                <RotateCcw className="h-5 w-5 text-muted-foreground" />
                <span className="text-xs font-medium">Devolución 30 días</span>
              </div>
              <div className="flex flex-col items-center gap-1 text-center">
                <ShieldCheck className="h-5 w-5 text-muted-foreground" />
                <span className="text-xs font-medium">Pago seguro</span>
              </div>
            </div>

            {/* Description */}
            {product.descriptionHtml && (
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-2">Descripción</h2>
                <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: product.descriptionHtml }} />
              </div>
            )}
          </div>
        </div>
      </div>

      <footer className="mt-16 border-t bg-card py-8">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <img src={logo} alt="Revolución Fit" className="mx-auto h-8 mb-3" />
          <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} Revolución Fit. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
