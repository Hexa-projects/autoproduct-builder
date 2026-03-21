import { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useShopifyProductByHandle, useShopifyProducts } from '@/hooks/useShopify';
import { useCartStore } from '@/stores/cartStore';
import { Layout } from '@/components/layout/Layout';
import { ProductCard } from '@/components/ProductCard';
import { ScrollReveal } from '@/components/ScrollReveal';
import { CODFaq } from '@/components/CODFaq';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
  Truck, ShieldCheck, RotateCcw, ShoppingBag, Loader2, Check,
  Package, Banknote, ChevronLeft, ChevronRight, Phone, MapPin,
} from 'lucide-react';
import { toast } from 'sonner';
import { trackViewContent, trackAddToCart } from '@/lib/tracking';

const generalFAQ = [
  { q: '¿Cuánto tarda el envío?', a: 'Los pedidos se procesan en 24h y el envío estándar tarda 2-5 días laborables en España peninsular.' },
  { q: '¿Puedo devolver el producto?', a: 'Sí, dispones de 30 días desde la recepción para solicitar una devolución sin preguntas.' },
  { q: '¿El contra reembolso tiene coste extra?', a: 'No. El precio que ves es el precio final. Sin recargos.' },
  { q: '¿Cómo se confirma mi pedido?', a: 'Te contactamos por teléfono o WhatsApp para confirmar tu dirección y los detalles del envío.' },
];

const trustBlocks = [
  {
    icon: Banknote,
    title: 'Pago Contra Reembolso',
    desc: 'Pagas solo cuando recibes el producto en tu puerta. Sin riesgo.',
  },
  {
    icon: RotateCcw,
    title: '30 días de devolución',
    desc: 'Si no estás satisfecho, devuélvelo en 30 días sin dar explicación.',
  },
  {
    icon: Truck,
    title: 'Envío rápido España',
    desc: 'Entrega en 2–5 días laborables en península.',
  },
  {
    icon: Phone,
    title: 'Confirmación por WhatsApp',
    desc: 'Te contactamos para confirmar tu pedido antes del envío.',
  },
];

export default function ProductPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { data: product, isLoading, error } = useShopifyProductByHandle(slug || '');
  const { data: allProducts } = useShopifyProducts();
  const addItem = useCartStore((s) => s.addItem);
  const isCartLoading = useCartStore((s) => s.isLoading);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);

  useEffect(() => {
    if (product) {
      trackViewContent({
        id: product.id,
        title: product.title,
        price: parseFloat(product.priceRange.minVariantPrice.amount),
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
    trackAddToCart({
      id: selectedVariant.id,
      title: product.title,
      price: parseFloat(selectedVariant.price.amount),
      currency: selectedVariant.price.currencyCode,
      quantity: 1,
    });
    toast.success('Añadido al carrito', { description: product.title });
  };

  const handleBuyNowCOD = async () => {
    if (!selectedVariant || !selectedVariant.availableForSale) return;
    await addItem({
      product: { node: product } as any,
      variantId: selectedVariant.id,
      variantTitle: selectedVariant.title,
      price: selectedVariant.price,
      quantity: 1,
      selectedOptions: selectedVariant.selectedOptions || [],
    });
    trackAddToCart({
      id: selectedVariant.id,
      title: product.title,
      price: parseFloat(selectedVariant.price.amount),
      currency: selectedVariant.price.currencyCode,
      quantity: 1,
    });
    navigate('/checkout/cod');
  };

  const optionGroups = product.options.filter((o) => o.name !== 'Title' || o.values.length > 1);

  const deliveryStart = new Date();
  deliveryStart.setDate(deliveryStart.getDate() + 2);
  const deliveryEnd = new Date();
  deliveryEnd.setDate(deliveryEnd.getDate() + 5);
  const formatDate = (d: Date) => d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });

  const prevImage = () => setSelectedImage((i) => (i > 0 ? i - 1 : allImages.length - 1));
  const nextImage = () => setSelectedImage((i) => (i < allImages.length - 1 ? i + 1 : 0));

  return (
    <Layout>
      <div className="mx-auto max-w-6xl px-3 py-3 sm:px-4 sm:py-6">
        {/* Breadcrumb */}
        <ScrollReveal>
          <nav className="mb-3 flex items-center gap-1.5 text-xs text-muted-foreground overflow-x-auto sm:text-sm sm:gap-2 sm:mb-4">
            <Link to="/" className="transition-colors hover:text-foreground shrink-0">Inicio</Link>
            <span className="shrink-0">&gt;</span>
            <Link to="/colecciones" className="transition-colors hover:text-foreground shrink-0">Catálogo</Link>
            <span className="shrink-0">&gt;</span>
            <span className="text-foreground line-clamp-1">{product.title}</span>
          </nav>
        </ScrollReveal>

        {/* Main product grid */}
        <div className="grid gap-5 lg:grid-cols-2 lg:gap-8">
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
            <div className="space-y-4 sm:space-y-5">
              {/* COD Badge */}
              <div className="flex flex-wrap gap-1.5">
                <Badge className="bg-accent text-accent-foreground text-[10px] gap-1 px-2 py-0.5 sm:text-xs sm:gap-1.5 sm:px-3 sm:py-1">
                  <Banknote className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  Pago Contra Reembolso
                </Badge>
                {hasDiscount && (
                  <Badge className="bg-destructive text-destructive-foreground font-semibold">-{discount}%</Badge>
                )}
              </div>

              {/* Title + bullet benefits */}
              <div>
                <h1 className="text-xl font-bold tracking-tight sm:text-3xl" style={{ lineHeight: '1.1' }}>
                  {product.title}
                </h1>
                {product.description && (
                  <ul className="mt-2 space-y-1 sm:mt-3">
                    {product.description.split('. ').filter(Boolean).slice(0, 3).map((line, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground sm:gap-2 sm:text-sm">
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent sm:h-4 sm:w-4" />
                        <span>{line.trim().replace(/\.$/, '')}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Price */}
              <div>
                <div className="flex items-baseline gap-2 sm:gap-3">
                  <span className={`text-2xl font-bold tabular-nums sm:text-3xl ${hasDiscount ? 'text-destructive' : ''}`}>
                    {price.toFixed(2)} €
                  </span>
                  {hasDiscount && (
                    <span className="text-sm text-muted-foreground line-through tabular-nums sm:text-lg">
                      {compareAt.toFixed(2)} €
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-[11px] text-muted-foreground sm:text-xs">Impuesto incluido</p>
                {savings && (
                  <p className="mt-0.5 text-xs font-medium text-accent sm:text-sm">¡Ahorras {savings} €!</p>
                )}
              </div>

              {/* Variant selectors */}
              {optionGroups.map((option) => (
                <div key={option.name} className="space-y-1.5 sm:space-y-2">
                  <p className="text-xs font-semibold sm:text-sm">{option.name}</p>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
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
                          className={`active:scale-[0.97] text-xs h-8 px-3 sm:text-sm sm:h-9 ${isOOS ? 'line-through' : ''}`}
                        >
                          {value}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Stock + delivery */}
              <div className="space-y-1.5 sm:space-y-2">
                {product.availableForSale ? (
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-accent sm:h-2 sm:w-2" />
                    <span className="text-xs font-medium text-accent sm:text-sm">En existencias · Envío rápido</span>
                  </div>
                ) : (
                  <Badge variant="destructive" className="text-xs">Agotado</Badge>
                )}
                {product.availableForSale && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground sm:gap-2 sm:text-sm">
                    <Truck className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                    <span>
                      Entrega: {formatDate(deliveryStart)} – {formatDate(deliveryEnd)}
                    </span>
                  </div>
                )}
              </div>

              {/* Microcopy COD */}
              <p className="text-xs text-accent font-medium sm:text-sm">
                💶 Haz tu pedido y paga al recibir
              </p>

              {/* CTAs */}
              <div className="space-y-2 sm:space-y-3">
                <Button
                  size="lg"
                  className="w-full min-h-[48px] text-sm font-semibold shadow-md active:scale-[0.97] transition-transform gap-2 bg-accent text-accent-foreground hover:bg-accent/90 sm:min-h-[52px] sm:text-base"
                  onClick={handleBuyNowCOD}
                  disabled={!product.availableForSale || !selectedVariant?.availableForSale || isCartLoading}
                >
                  {isCartLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : !product.availableForSale ? (
                    'Agotado'
                  ) : (
                    <>
                      <Banknote className="h-4 w-4 shrink-0" />
                      Pedir y pagar al recibir
                    </>
                  )}
                </Button>

                <Button
                  size="lg"
                  variant="outline"
                  className="w-full min-h-[44px] text-xs font-medium active:scale-[0.97] transition-transform gap-2 sm:min-h-[48px] sm:text-sm"
                  onClick={handleAddToCart}
                  disabled={!product.availableForSale || !selectedVariant?.availableForSale || isCartLoading}
                >
                  <ShoppingBag className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  Añadir al carrito
                </Button>
              </div>

              {/* Trust icons row */}
              <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                {[
                  { icon: Banknote, text: 'Pago al recibir' },
                  { icon: Truck, text: 'Envío España' },
                  { icon: Phone, text: 'Soporte español' },
                  { icon: RotateCcw, text: 'Devolución 30d' },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-1.5 rounded-md border p-2 sm:rounded-lg sm:p-2.5">
                    <Icon className="h-3.5 w-3.5 shrink-0 text-accent sm:h-4 sm:w-4" />
                    <span className="text-[10px] font-medium sm:text-xs">{text}</span>
                  </div>
                ))}
              </div>

              {/* Why buy COD block */}
              <div className="rounded-lg border bg-accent/5 p-3 space-y-2 sm:rounded-xl sm:p-4 sm:space-y-3">
                <h3 className="text-xs font-bold sm:text-sm">💰 Por qué comprar con Contra Reembolso</h3>
                <ul className="space-y-1.5 sm:space-y-2">
                  {[
                    'No arriesgas tu dinero',
                    'Verificas el producto antes de pagar',
                    'Confirmación por WhatsApp',
                    'Devolución gratuita',
                  ].map((text, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground sm:gap-2 sm:text-sm">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent sm:h-4 sm:w-4" />
                      <span>{text}</span>
                    </li>
                  ))}
                </ul>
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
                  value="shipping"
                  className="rounded-none border-b-2 border-transparent px-6 py-3 text-sm font-medium data-[state=active]:border-foreground data-[state=active]:shadow-none"
                >
                  Envío y COD
                </TabsTrigger>
                <TabsTrigger
                  value="faq"
                  className="rounded-none border-b-2 border-transparent px-6 py-3 text-sm font-medium data-[state=active]:border-foreground data-[state=active]:shadow-none"
                >
                  FAQ
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

              <TabsContent value="shipping" className="mt-6">
                <div className="space-y-6">
                  <div className="flex items-start gap-3">
                    <Banknote className="h-5 w-5 shrink-0 text-accent mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold">Pago Contra Reembolso (COD)</p>
                      <p className="text-sm text-muted-foreground">
                        No necesitas tarjeta. Pagas al repartidor cuando recibes el producto. Sin coste extra.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Truck className="h-5 w-5 shrink-0 text-accent mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold">Envío estándar (2–5 días laborables)</p>
                      <p className="text-sm text-muted-foreground">
                        Disponible para España peninsular, Baleares y Canarias. Pedidos procesados en 24 horas.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 shrink-0 text-accent mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold">Seguimiento incluido</p>
                      <p className="text-sm text-muted-foreground">
                        Recibirás el número de seguimiento por WhatsApp en cuanto tu pedido sea enviado.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <RotateCcw className="h-5 w-5 shrink-0 text-accent mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold">Devolución gratuita en 30 días</p>
                      <p className="text-sm text-muted-foreground">
                        Si no estás satisfecho, solicita la devolución sin coste.
                      </p>
                    </div>
                  </div>
                </div>
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
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card/95 p-2.5 backdrop-blur-md lg:hidden">
        <div className="mx-auto flex max-w-lg items-center gap-2.5">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-muted-foreground line-clamp-1">{product.title}</p>
            <p className={`text-base font-bold tabular-nums ${hasDiscount ? 'text-destructive' : ''}`}>
              {price.toFixed(2)} €
            </p>
          </div>
          <Button
            className="shrink-0 min-h-[44px] active:scale-[0.97] gap-1.5 px-4 text-xs bg-accent text-accent-foreground hover:bg-accent/90"
            onClick={handleBuyNowCOD}
            disabled={!product.availableForSale || !selectedVariant?.availableForSale || isCartLoading}
          >
            {isCartLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Banknote className="h-3.5 w-3.5" />
                Pagar al recibir
              </>
            )}
          </Button>
        </div>
      </div>
      <div className="h-16 lg:hidden" />
    </Layout>
  );
}