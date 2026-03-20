import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useProductBySlug } from '@/hooks/useProducts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ArrowLeft, Truck, ShieldCheck, RotateCcw, Package, ShoppingBag
} from 'lucide-react';

function appendUTM(url: string) {
  try {
    const params = new URLSearchParams(window.location.search);
    const u = new URL(url);
    ['utm_source', 'utm_campaign', 'utm_content', 'utm_term'].forEach((k) => {
      const v = params.get(k);
      if (v) u.searchParams.set(k, v);
    });
    return u.toString();
  } catch {
    return url;
  }
}

export default function ProductPage() {
  const { slug } = useParams();
  const { data: product, isLoading, error } = useProductBySlug(slug || '');
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedPack, setSelectedPack] = useState<string>('default');
  const [selectedVariation, setSelectedVariation] = useState<string | null>(null);

  // Track ViewContent
  useEffect(() => {
    if (product && typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('track', 'ViewContent', {
        content_name: product.name,
        content_ids: [product.id],
        content_type: 'product',
        value: Number(product.promotional_price ?? product.original_price ?? 0),
        currency: product.currency,
      });
    }
  }, [product]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
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
          <Link to="/"><ArrowLeft className="mr-2 h-4 w-4" /> Volver al catálogo</Link>
        </Button>
      </div>
    );
  }

  const allImages = [product.main_image, ...(product.gallery || [])].filter(Boolean) as string[];
  const price = product.promotional_price ?? product.original_price;
  const hasDiscount = product.promotional_price && product.original_price && product.promotional_price < product.original_price;
  const discount = hasDiscount ? Math.round((1 - Number(product.promotional_price) / Number(product.original_price)) * 100) : 0;
  const savings = hasDiscount ? (Number(product.original_price) - Number(product.promotional_price)).toFixed(2) : null;

  const packs = [
    { key: 'default', label: 'Individual', url: product.checkout_url_default },
    { key: 'pack_1', label: 'Pack 1', url: product.checkout_url_pack_1 },
    { key: 'pack_2', label: 'Pack 2', url: product.checkout_url_pack_2 },
    { key: 'pack_3', label: 'Pack 3', url: product.checkout_url_pack_3 },
  ].filter((p) => p.url);

  const getCheckoutUrl = () => {
    if (selectedVariation) {
      const variation = product.variations?.find((v) => v.id === selectedVariation);
      if (variation?.checkout_url) return variation.checkout_url;
    }
    const pack = packs.find((p) => p.key === selectedPack);
    return pack?.url || product.checkout_url_default || '#';
  };

  const handleBuy = () => {
    const url = getCheckoutUrl();
    if (!url || url === '#') return;

    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('track', 'InitiateCheckout', {
        content_name: product.name,
        content_ids: [product.id],
        value: Number(price ?? 0),
        currency: product.currency,
      });
    }

    window.open(appendUTM(url), '_blank');
  };

  const sizes = [...new Set(product.variations?.map((v) => v.size).filter(Boolean))];
  const colors = [...new Set(product.variations?.map((v) => v.color).filter(Boolean))];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b bg-card/80 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center px-4">
          <Link to="/" className="text-xl font-bold tracking-tight" style={{ fontFamily: 'Space Grotesk' }}>
            Revolución Fit
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-6">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground transition-colors">Inicio</Link>
          <span>/</span>
          {product.category && (
            <>
              <span>{product.category.name}</span>
              <span>/</span>
            </>
          )}
          <span className="text-foreground">{product.name}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Gallery */}
          <div className="space-y-3">
            <div className="aspect-square overflow-hidden rounded-xl bg-muted">
              {allImages[selectedImage] ? (
                <img
                  src={allImages[selectedImage]}
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <ShoppingBag className="h-16 w-16 text-muted-foreground/30" />
                </div>
              )}
            </div>
            {allImages.length > 1 && (
              <div className="flex gap-2 overflow-auto">
                {allImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${
                      i === selectedImage ? 'border-primary' : 'border-transparent hover:border-muted-foreground/30'
                    }`}
                  >
                    <img src={img} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
            {product.video_url && (
              <div className="mt-4 aspect-video rounded-xl overflow-hidden">
                <iframe
                  src={product.video_url.replace('watch?v=', 'embed/')}
                  className="h-full w-full"
                  allowFullScreen
                  title="Video"
                />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="space-y-6">
            {product.category && (
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                {product.category.name}
              </p>
            )}
            <h1 className="text-3xl font-bold tracking-tight" style={{ lineHeight: '1.15' }}>
              {product.name}
            </h1>
            {product.subtitle && (
              <p className="text-lg text-muted-foreground">{product.subtitle}</p>
            )}

            {/* Pricing */}
            <div className="flex items-baseline gap-3">
              {price && (
                <span className="text-3xl font-bold tabular-nums">€{Number(price).toFixed(2)}</span>
              )}
              {hasDiscount && (
                <>
                  <span className="text-lg text-muted-foreground line-through tabular-nums">
                    €{Number(product.original_price).toFixed(2)}
                  </span>
                  <Badge className="bg-accent text-accent-foreground font-semibold">-{discount}%</Badge>
                </>
              )}
            </div>
            {savings && (
              <p className="text-sm font-medium" style={{ color: 'hsl(142, 60%, 40%)' }}>¡Ahorras €{savings}!</p>
            )}

            {/* Stock */}
            {product.stock === 0 && (
              <Badge variant="destructive" className="text-sm">Agotado</Badge>
            )}

            {/* Variations */}
            {sizes.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Talla</p>
                <div className="flex flex-wrap gap-2">
                  {sizes.map((s) => {
                    const v = product.variations?.find((vr) => vr.size === s);
                    return (
                      <Button
                        key={s}
                        variant={selectedVariation === v?.id ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedVariation(v?.id || null)}
                        disabled={v?.stock === 0}
                      >
                        {s}
                      </Button>
                    );
                  })}
                </div>
              </div>
            )}
            {colors.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Color</p>
                <div className="flex flex-wrap gap-2">
                  {colors.map((c) => {
                    const v = product.variations?.find((vr) => vr.color === c);
                    return (
                      <Button
                        key={c}
                        variant={selectedVariation === v?.id ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedVariation(v?.id || null)}
                        disabled={v?.stock === 0}
                      >
                        {c}
                      </Button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Packs */}
            {packs.length > 1 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Seleccionar pack</p>
                <Select value={selectedPack} onValueChange={setSelectedPack}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {packs.map((p) => (
                      <SelectItem key={p.key} value={p.key}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* CTA */}
            <Button
              size="lg"
              className="w-full text-base font-semibold shadow-md active:scale-[0.97] transition-transform"
              onClick={handleBuy}
              disabled={product.stock === 0 || !getCheckoutUrl() || getCheckoutUrl() === '#'}
            >
              {product.stock === 0 ? 'Agotado' : 'Comprar ahora'}
            </Button>

            {/* Payment options */}
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
              {product.prepaid_available && (
                <span className="flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5" /> Pago seguro</span>
              )}
              {product.cod_available && (
                <span className="flex items-center gap-1"><Package className="h-3.5 w-3.5" /> Pago contra reembolso</span>
              )}
            </div>

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-3 rounded-xl border p-4">
              <div className="flex flex-col items-center gap-1 text-center">
                <Truck className="h-5 w-5 text-muted-foreground" />
                <span className="text-xs font-medium">Envío rápido</span>
                {product.shipping_time && (
                  <span className="text-[10px] text-muted-foreground">{product.shipping_time}</span>
                )}
              </div>
              <div className="flex flex-col items-center gap-1 text-center">
                <RotateCcw className="h-5 w-5 text-muted-foreground" />
                <span className="text-xs font-medium">Devolución</span>
                <span className="text-[10px] text-muted-foreground">30 días</span>
              </div>
              <div className="flex flex-col items-center gap-1 text-center">
                <ShieldCheck className="h-5 w-5 text-muted-foreground" />
                <span className="text-xs font-medium">Pago seguro</span>
                <span className="text-[10px] text-muted-foreground">SSL encriptado</span>
              </div>
            </div>

            {/* Description */}
            {product.short_description && (
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-2">Descripción</h2>
                <p className="text-sm leading-relaxed">{product.short_description}</p>
              </div>
            )}
            {product.full_description && (
              <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: product.full_description }} />
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-16 border-t bg-card py-8">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Revolución Fit. Todos los derechos reservados.
        </div>
      </footer>
    </div>
  );
}
