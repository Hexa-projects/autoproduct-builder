import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useShopifyProductByHandle, useShopifyProducts } from '@/hooks/useShopify';
import { useCartStore } from '@/stores/cartStore';
import { Layout } from '@/components/layout/Layout';
import { ProductCard } from '@/components/ProductCard';
import { ScrollReveal } from '@/components/ScrollReveal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Truck, ShieldCheck, RotateCcw, ShoppingBag, Loader2, ChevronLeft, Check } from 'lucide-react';
import { toast } from 'sonner';

// ─── FAQ static (applies to all products) ───
const generalFAQ = [
  { q: '¿Cuánto tarda el envío?', a: 'Los pedidos se procesan en 24h y el envío estándar tarda 2-5 días laborables en España y Portugal.' },
  { q: '¿Puedo devolver el producto?', a: 'Sí, dispones de 30 días desde la recepción para solicitar una devolución sin preguntas.' },
  { q: '¿Qué métodos de pago aceptáis?', a: 'Aceptamos tarjeta de crédito/débito (Visa, Mastercard), PayPal y otras pasarelas seguras.' },
  { q: '¿Cómo elijo la talla correcta?', a: 'Consulta la tabla de medidas en cada ficha de producto. Si estás entre dos tallas, recomendamos la más grande.' },
];

// ─── Benefits static ───
const defaultBenefits = [
  'Materiales de alta calidad y durabilidad',
  'Diseño ergonómico para máximo confort',
  'Ideal para uso diario en el gimnasio',
  'Fácil de limpiar y mantener',
];

export default function ProductPage() {
  const { slug } = useParams();
  const { data: product, isLoading, error } = useShopifyProductByHandle(slug || '');
  const { data: allProducts } = useShopifyProducts();
  const addItem = useCartStore((s) => s.addItem);
  const isCartLoading = useCartStore((s) => s.isLoading);
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
      const first = product.variants.edges.find((v) => v.node.availableForSale);
      setSelectedVariantId(first?.node.id || product.variants.edges[0]?.node.id || null);
    }
  }, [product, selectedVariantId]);

  // Reset on slug change
  useEffect(() => {
    setSelectedImage(0);
    setSelectedVariantId(null);
  }, [slug]);

  // Cross-sell: other products excluding this one
  const crossSell = useMemo(
    () => (allProducts || []).filter((p) => p.node.handle !== slug).slice(0, 4),
    [allProducts, slug]
  );

  if (isLoading) {
    return (
      <Layout>
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
      </Layout>
    );
  }

  if (error || !product) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <ShoppingBag className="h-16 w-16 text-muted-foreground/40" />
          <h1 className="mt-4 text-xl font-bold">Producto no encontrado</h1>
          <Button asChild className="mt-4" variant="outline">
            <Link to="/colecciones">Volver al catálogo</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const allImages = product.images.edges.map((e) => e.node);
  const selectedVariant =
    product.variants.edges.find((v) => v.node.id === selectedVariantId)?.node ||
    product.variants.edges[0]?.node;

  const price = selectedVariant
    ? parseFloat(selectedVariant.price.amount)
    : parseFloat(product.priceRange.minVariantPrice.amount);
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

  const optionGroups = product.options.filter((o) => o.name !== 'Title' || o.values.length > 1);

  return (
    <Layout>
      <div className="mx-auto max-w-6xl px-4 py-4 sm:py-6">
        {/* Breadcrumb */}
        <ScrollReveal>
          <nav className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/" className="transition-colors hover:text-foreground">Inicio</Link>
            <span>/</span>
            <Link to="/colecciones" className="transition-colors hover:text-foreground">Catálogo</Link>
            <span>/</span>
            <span className="text-foreground line-clamp-1">{product.title}</span>
          </nav>
        </ScrollReveal>

        {/* Main product grid */}
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Gallery */}
          <ScrollReveal direction="left">
            <div className="space-y-3">
              <div className="aspect-square overflow-hidden rounded-xl bg-muted">
                {allImages[selectedImage] ? (
                  <img
                    src={allImages[selectedImage].url}
                    alt={allImages[selectedImage].altText || product.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <ShoppingBag className="h-16 w-16 text-muted-foreground/30" />
                  </div>
                )}
              </div>
              {allImages.length > 1 && (
                <div className="flex gap-2 overflow-auto pb-1">
                  {allImages.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedImage(i)}
                      className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${
                        i === selectedImage ? 'border-primary' : 'border-transparent hover:border-muted-foreground/30'
                      }`}
                    >
                      <img src={img.url} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </ScrollReveal>

          {/* Info */}
          <ScrollReveal direction="right">
            <div className="space-y-5">
              <div>
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl" style={{ lineHeight: '1.15' }}>
                  {product.title}
                </h1>
                {product.description && (
                  <p className="mt-2 text-muted-foreground line-clamp-2">{product.description}</p>
                )}
              </div>

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
                <p className="text-sm font-medium text-accent">¡Ahorras €{savings}!</p>
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
                      const matchingVariant = product.variants.edges.find((v) =>
                        v.node.selectedOptions.some((o) => o.name === option.name && o.value === value)
                      );
                      const isSelected = selectedVariant?.selectedOptions.some(
                        (o) => o.name === option.name && o.value === value
                      );
                      return (
                        <Button
                          key={value}
                          variant={isSelected ? 'default' : 'outline'}
                          size="sm"
                          disabled={matchingVariant && !matchingVariant.node.availableForSale}
                          onClick={() => matchingVariant && setSelectedVariantId(matchingVariant.node.id)}
                          className="active:scale-[0.97]"
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
                ) : !product.availableForSale ? (
                  'Agotado'
                ) : (
                  'Añadir al carrito'
                )}
              </Button>

              {/* Trust badges */}
              <div className="grid grid-cols-3 gap-3 rounded-xl border p-4">
                {[
                  { icon: Truck, label: 'Envío 24–48h' },
                  { icon: RotateCcw, label: 'Devolución 30 días' },
                  { icon: ShieldCheck, label: 'Pago seguro' },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex flex-col items-center gap-1 text-center">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                    <span className="text-xs font-medium">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>
        </div>

        {/* ─── Below the fold sections ─── */}
        <div className="mt-12 space-y-12">
          {/* Benefits */}
          <ScrollReveal>
            <section className="rounded-xl border bg-card p-6 sm:p-8">
              <h2 className="text-lg font-bold tracking-tight sm:text-xl">Beneficios</h2>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {defaultBenefits.map((b) => (
                  <li key={b} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                    <span className="text-sm text-muted-foreground">{b}</span>
                  </li>
                ))}
              </ul>
            </section>
          </ScrollReveal>

          {/* Description from Shopify */}
          {product.descriptionHtml && (
            <ScrollReveal>
              <section className="rounded-xl border bg-card p-6 sm:p-8">
                <h2 className="text-lg font-bold tracking-tight sm:text-xl">Descripción del producto</h2>
                <div
                  className="prose prose-sm mt-4 max-w-none text-muted-foreground"
                  dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}
                />
              </section>
            </ScrollReveal>
          )}

          {/* FAQ */}
          <ScrollReveal>
            <section className="rounded-xl border bg-card p-6 sm:p-8">
              <h2 className="text-lg font-bold tracking-tight sm:text-xl">Preguntas frecuentes</h2>
              <Accordion type="single" collapsible className="mt-4">
                {generalFAQ.map((item, i) => (
                  <AccordionItem key={i} value={`faq-${i}`}>
                    <AccordionTrigger className="text-sm font-medium text-left">{item.q}</AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground">{item.a}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </section>
          </ScrollReveal>

          {/* Cross-sell */}
          {crossSell.length > 0 && (
            <ScrollReveal>
              <section>
                <h2 className="text-lg font-bold tracking-tight sm:text-xl">También te puede interesar</h2>
                <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  {crossSell.map((p, i) => (
                    <ScrollReveal key={p.node.id} delay={i * 0.06}>
                      <ProductCard product={p} />
                    </ScrollReveal>
                  ))}
                </div>
              </section>
            </ScrollReveal>
          )}
        </div>
      </div>

      {/* Sticky mobile CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card/95 p-3 backdrop-blur-md lg:hidden">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <div className="flex-1">
            <p className="text-xs text-muted-foreground line-clamp-1">{product.title}</p>
            <p className="text-lg font-bold tabular-nums">€{price.toFixed(2)}</p>
          </div>
          <Button
            className="shrink-0 active:scale-[0.97]"
            onClick={handleAddToCart}
            disabled={!product.availableForSale || !selectedVariant?.availableForSale || isCartLoading}
          >
            {isCartLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Comprar'}
          </Button>
        </div>
      </div>
      {/* Spacer for sticky CTA on mobile */}
      <div className="h-20 lg:hidden" />
    </Layout>
  );
}
