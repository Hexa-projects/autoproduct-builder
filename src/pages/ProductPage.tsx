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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
  Truck, ShieldCheck, RotateCcw, ShoppingBag, Loader2, Check,
  Package, CreditCard, ChevronLeft, ChevronRight, ShoppingCart,
} from 'lucide-react';
import { toast } from 'sonner';

const generalFAQ = [
  { q: '¿Cuánto tarda el envío?', a: 'Los pedidos se procesan en 24h y el envío estándar tarda 2-5 días laborables en España y Portugal.' },
  { q: '¿Puedo devolver el producto?', a: 'Sí, dispones de 30 días desde la recepción para solicitar una devolución sin preguntas. La recogida es gratuita.' },
  { q: '¿Qué métodos de pago aceptáis?', a: 'Aceptamos tarjeta de crédito/débito (Visa, Mastercard), Google Pay, PayPal y pago a plazos.' },
  { q: '¿Cómo elijo la talla correcta?', a: 'Consulta la tabla de medidas en cada ficha de producto. Si estás entre dos tallas, recomendamos la más grande.' },
];

const trustBlocks = [
  {
    icon: Package,
    title: 'Devoluciones gratuitas',
    desc: 'Compra sin riesgo. Si no estás satisfecho, lo recogemos gratis.',
  },
  {
    icon: RotateCcw,
    title: '30 días de devolución',
    desc: 'Prueba nuestro equipamiento y devuélvelo en 30 días sin dar explicación.',
  },
  {
    icon: CreditCard,
    title: 'Pago a plazos',
    desc: 'Paga con flexibilidad: rápido, fácil y transparente.',
  },
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

  useEffect(() => {
    if (product && !selectedVariantId) {
      const first = product.variants.edges.find((v) => v.node.availableForSale);
      setSelectedVariantId(first?.node.id || product.variants.edges[0]?.node.id || null);
    }
  }, [product, selectedVariantId]);

  useEffect(() => {
    setSelectedImage(0);
    setSelectedVariantId(null);
  }, [slug]);

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

  // Estimate delivery date
  const deliveryStart = new Date();
  deliveryStart.setDate(deliveryStart.getDate() + 2);
  const deliveryEnd = new Date();
  deliveryEnd.setDate(deliveryEnd.getDate() + 5);
  const formatDate = (d: Date) => d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });

  const prevImage = () => setSelectedImage((i) => (i > 0 ? i - 1 : allImages.length - 1));
  const nextImage = () => setSelectedImage((i) => (i < allImages.length - 1 ? i + 1 : 0));

  return (
    <Layout>
      <div className="mx-auto max-w-6xl px-4 py-4 sm:py-6">
        {/* Breadcrumb */}
        <ScrollReveal>
          <nav className="mb-4 flex items-center gap-2 text-sm text-muted-foreground overflow-x-auto">
            <Link to="/" className="transition-colors hover:text-foreground shrink-0">Inicio</Link>
            <span className="shrink-0">&gt;</span>
            <Link to="/colecciones" className="transition-colors hover:text-foreground shrink-0">Catálogo</Link>
            <span className="shrink-0">&gt;</span>
            <span className="text-foreground line-clamp-1">{product.title}</span>
          </nav>
        </ScrollReveal>

        {/* Main product grid */}
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Gallery */}
          <ScrollReveal direction="left">
            <div className="space-y-3">
              <div className="relative aspect-square overflow-hidden rounded-xl bg-muted">
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
                {/* Gallery navigation */}
                {allImages.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-2 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-card/80 shadow-md backdrop-blur-sm transition hover:bg-card active:scale-95"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-2 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-card/80 shadow-md backdrop-blur-sm transition hover:bg-card active:scale-95"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                    {/* Progress bar */}
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2">
                      <div className="flex h-1 gap-1">
                        {allImages.map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setSelectedImage(i)}
                            className={`h-1 rounded-full transition-all duration-300 ${
                              i === selectedImage ? 'w-6 bg-foreground' : 'w-2 bg-foreground/30'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs font-medium text-foreground bg-card/70 rounded px-1.5 py-0.5 backdrop-blur-sm">
                        {selectedImage + 1} / {allImages.length}
                      </span>
                    </div>
                  </>
                )}
              </div>
              {/* Thumbnails */}
              {allImages.length > 1 && (
                <div className="flex gap-2 overflow-auto pb-1">
                  {allImages.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedImage(i)}
                      className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${
                        i === selectedImage ? 'border-foreground' : 'border-transparent hover:border-muted-foreground/30'
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
              {/* Badges row */}
              <div className="flex flex-wrap gap-2">
                {product.availableForSale && (
                  <Badge variant="secondary" className="text-xs">Más vendido</Badge>
                )}
                {product.tags?.includes('nuevo') && (
                  <Badge variant="secondary" className="text-xs">Nuevo</Badge>
                )}
              </div>

              {/* Title + bullet benefits */}
              <div>
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl" style={{ lineHeight: '1.1' }}>
                  {product.title}
                </h1>
                {product.description && (
                  <ul className="mt-3 space-y-1">
                    {product.description.split('. ').filter(Boolean).slice(0, 3).map((line, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                        <span>{line.trim().replace(/\.$/, '')}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Price */}
              <div>
                <div className="flex items-baseline gap-3">
                  <span className={`text-3xl font-bold tabular-nums ${hasDiscount ? 'text-destructive' : ''}`}>
                    {price.toFixed(2)} €
                  </span>
                  {hasDiscount && (
                    <>
                      <span className="text-lg text-muted-foreground line-through tabular-nums">
                        {compareAt.toFixed(2)} €
                      </span>
                      <Badge className="bg-destructive text-destructive-foreground font-semibold">-{discount}%</Badge>
                    </>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">Impuesto incluido.</p>
                {savings && (
                  <p className="mt-1 text-sm font-medium text-accent">¡Ahorras {savings} €!</p>
                )}
              </div>

              {/* Variant selectors */}
              {optionGroups.map((option) => (
                <div key={option.name} className="space-y-2">
                  <p className="text-sm font-semibold">{option.name}</p>
                  <div className="flex flex-wrap gap-2">
                    {option.values.map((value) => {
                      const matchingVariant = product.variants.edges.find((v) =>
                        v.node.selectedOptions.some((o) => o.name === option.name && o.value === value)
                      );
                      const isSelected = selectedVariant?.selectedOptions.some(
                        (o) => o.name === option.name && o.value === value
                      );
                      const isOOS = matchingVariant && !matchingVariant.node.availableForSale;
                      return (
                        <Button
                          key={value}
                          variant={isSelected ? 'default' : 'outline'}
                          size="sm"
                          disabled={isOOS}
                          onClick={() => matchingVariant && setSelectedVariantId(matchingVariant.node.id)}
                          className={`active:scale-[0.97] ${isOOS ? 'line-through' : ''}`}
                        >
                          {value}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Stock + delivery */}
              <div className="space-y-2">
                {product.availableForSale ? (
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-accent" />
                    <span className="text-sm font-medium text-accent">En existencias</span>
                  </div>
                ) : (
                  <Badge variant="destructive">Agotado</Badge>
                )}
                {product.availableForSale && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Truck className="h-4 w-4 shrink-0" />
                    <span>
                      {formatDate(deliveryStart)} – {formatDate(deliveryEnd)} · Fecha estimada de entrega (península)
                    </span>
                  </div>
                )}
              </div>

              {/* CTA */}
              <Button
                size="lg"
                className="w-full text-base font-semibold shadow-md active:scale-[0.97] transition-transform gap-2"
                onClick={handleAddToCart}
                disabled={!product.availableForSale || !selectedVariant?.availableForSale || isCartLoading}
              >
                {isCartLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : !product.availableForSale ? (
                  'Agotado'
                ) : (
                  <>
                    <ShoppingCart className="h-5 w-5" />
                    Agregar al carrito
                  </>
                )}
              </Button>

              {/* Trust blocks under CTA */}
              <div className="space-y-3 rounded-xl border p-4">
                {trustBlocks.map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="flex items-start gap-3">
                    <Icon className="h-5 w-5 shrink-0 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold">{title}</p>
                      <p className="text-xs text-muted-foreground">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>
        </div>

        {/* ─── Below the fold: Tabs ─── */}
        <div className="mt-12">
          <ScrollReveal>
            <Tabs defaultValue="description" className="w-full">
              <TabsList className="w-full justify-start border-b rounded-none bg-transparent p-0 h-auto">
                <TabsTrigger
                  value="description"
                  className="rounded-none border-b-2 border-transparent px-6 py-3 text-sm font-medium data-[state=active]:border-foreground data-[state=active]:shadow-none"
                >
                  Descripción
                </TabsTrigger>
                <TabsTrigger
                  value="faq"
                  className="rounded-none border-b-2 border-transparent px-6 py-3 text-sm font-medium data-[state=active]:border-foreground data-[state=active]:shadow-none"
                >
                  Preguntas frecuentes
                </TabsTrigger>
              </TabsList>

              <TabsContent value="description" className="mt-6">
                {product.descriptionHtml ? (
                  <div
                    className="prose prose-sm max-w-none text-muted-foreground prose-headings:text-foreground prose-headings:font-semibold prose-strong:text-foreground"
                    dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No hay descripción disponible para este producto.
                  </p>
                )}
              </TabsContent>

              <TabsContent value="faq" className="mt-6">
                <Accordion type="single" collapsible>
                  {generalFAQ.map((item, i) => (
                    <AccordionItem key={i} value={`faq-${i}`}>
                      <AccordionTrigger className="text-sm font-medium text-left">{item.q}</AccordionTrigger>
                      <AccordionContent className="text-sm text-muted-foreground">{item.a}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </TabsContent>
            </Tabs>
          </ScrollReveal>
        </div>

        {/* Cross-sell */}
        {crossSell.length > 0 && (
          <div className="mt-14">
            <ScrollReveal>
              <h2 className="text-xl font-bold tracking-tight sm:text-2xl">Completa tu equipo</h2>
            </ScrollReveal>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {crossSell.map((p, i) => (
                <ScrollReveal key={p.node.id} delay={i * 0.06}>
                  <ProductCard product={p} />
                </ScrollReveal>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sticky mobile CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card/95 p-3 backdrop-blur-md lg:hidden">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground line-clamp-1">{product.title}</p>
            <p className={`text-lg font-bold tabular-nums ${hasDiscount ? 'text-destructive' : ''}`}>
              {price.toFixed(2)} €
            </p>
          </div>
          <Button
            className="shrink-0 active:scale-[0.97] gap-2"
            onClick={handleAddToCart}
            disabled={!product.availableForSale || !selectedVariant?.availableForSale || isCartLoading}
          >
            {isCartLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <ShoppingCart className="h-4 w-4" />
                Comprar
              </>
            )}
          </Button>
        </div>
      </div>
      <div className="h-20 lg:hidden" />
    </Layout>
  );
}
