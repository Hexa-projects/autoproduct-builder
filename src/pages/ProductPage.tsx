import { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useShopifyProductByHandle, useShopifyProducts } from '@/hooks/useShopify';
import { useCartStore } from '@/stores/cartStore';
import { Layout } from '@/components/layout/Layout';
import { ProductCard } from '@/components/ProductCard';
import { ScrollReveal } from '@/components/ScrollReveal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
  Truck, ShieldCheck, RotateCcw, ShoppingBag, Loader2, Check,
  Banknote, ChevronLeft, ChevronRight, Phone, Star, MessageCircle,
  Package, X, Award, Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import { trackViewContent, trackAddToCart, trackClickCTACOD, trackSelectKit } from '@/lib/tracking';
import { getProductCROContent } from '@/lib/productContent';

// ─── FAQ (objection-based) ─────────────────────────────────────────
const objectionFAQ = [
  { q: '¿Tengo que pagar ahora?', a: 'No. No necesitas tarjeta ni pago anticipado. Solo pagas cuando el repartidor te entrega el producto en casa.' },
  { q: '¿Cómo se confirma mi pedido?', a: 'Te contactamos por teléfono o WhatsApp en menos de 24h para confirmar dirección y detalles del envío.' },
  { q: '¿Cuánto tarda el envío?', a: 'Procesamos en 24h y la entrega es en 2–5 días laborables en España peninsular.' },
  { q: '¿Puedo devolverlo?', a: 'Sí. Tienes 30 días para devolver el producto sin coste ni explicaciones. Sin letra pequeña.' },
  { q: '¿Tiene coste extra el contra reembolso?', a: 'No. El precio que ves es el precio final. Sin recargos ni costes ocultos.' },
];

// ─── Kit helpers ───────────────────────────────────────────────────
type KitOption = '1x' | '2x' | '3x';
interface KitConfig { label: string; qty: number; discount: number; tag?: string; perks: string[] }
const kitConfigs: Record<KitOption, KitConfig> = {
  '1x': { label: '1 unidad', qty: 1, discount: 0, perks: ['Envío estándar'] },
  '2x': { label: '2 unidades', qty: 2, discount: 10, tag: 'Más vendido', perks: ['Envío prioritario', 'Ahorro por pack'] },
  '3x': { label: '3 unidades', qty: 3, discount: 15, perks: ['Envío prioritario gratis', 'Mejor precio/unidad'] },
};

export default function ProductPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { data: product, isLoading, error } = useShopifyProductByHandle(slug || '');
  const { data: allProducts } = useShopifyProducts();
  const addItem = useCartStore((s) => s.addItem);
  const isCartLoading = useCartStore((s) => s.isLoading);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [selectedKit, setSelectedKit] = useState<KitOption>('1x');

  const croContent = useMemo(() => getProductCROContent(slug || ''), [slug]);

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
    setSelectedKit('1x');
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

  const unitPrice = selectedVariant
    ? parseFloat(selectedVariant.price.amount)
    : parseFloat(product.priceRange.minVariantPrice.amount);
  const compareAt = selectedVariant?.compareAtPrice ? parseFloat(selectedVariant.compareAtPrice.amount) : 0;
  const hasDiscount = compareAt > unitPrice;
  const discount = hasDiscount ? Math.round((1 - unitPrice / compareAt) * 100) : 0;

  const kitCfg = kitConfigs[selectedKit];
  const kitDiscount = kitCfg.discount;
  const kitUnitPrice = kitDiscount > 0 ? unitPrice * (1 - kitDiscount / 100) : unitPrice;
  const kitTotalPrice = kitUnitPrice * kitCfg.qty;
  const kitSavings = kitDiscount > 0 ? (unitPrice * kitCfg.qty - kitTotalPrice).toFixed(2) : null;
  const currency = selectedVariant?.price.currencyCode || 'EUR';

  const handleAddToCart = async () => {
    if (!selectedVariant || !selectedVariant.availableForSale) return;
    for (let i = 0; i < kitCfg.qty; i++) {
      await addItem({
        product: { node: product } as any,
        variantId: selectedVariant.id,
        variantTitle: selectedVariant.title,
        price: selectedVariant.price,
        quantity: 1,
        selectedOptions: selectedVariant.selectedOptions || [],
      });
    }
    trackAddToCart({
      id: selectedVariant.id,
      title: product.title,
      price: kitTotalPrice,
      currency,
      quantity: kitCfg.qty,
    });
    toast.success(`${kitCfg.qty}× añadido al carrito`, { description: product.title });
  };

  const handleBuyNowCOD = async () => {
    if (!selectedVariant || !selectedVariant.availableForSale) return;
    trackClickCTACOD({ id: product.id, title: product.title });
    trackSelectKit(selectedKit, { id: product.id, title: product.title, value: kitTotalPrice, currency });
    for (let i = 0; i < kitCfg.qty; i++) {
      await addItem({
        product: { node: product } as any,
        variantId: selectedVariant.id,
        variantTitle: selectedVariant.title,
        price: selectedVariant.price,
        quantity: 1,
        selectedOptions: selectedVariant.selectedOptions || [],
      });
    }
    trackAddToCart({
      id: selectedVariant.id,
      title: product.title,
      price: kitTotalPrice,
      currency,
      quantity: kitCfg.qty,
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

  const displayHeadline = croContent.headline || product.title;

  return (
    <Layout>
      <div className="mx-auto max-w-6xl px-3 py-3 sm:px-4 sm:py-6">
        {/* Breadcrumb */}
        <nav className="mb-3 flex items-center gap-1.5 text-xs text-muted-foreground overflow-x-auto sm:text-sm sm:gap-2 sm:mb-4">
          <Link to="/" className="transition-colors hover:text-foreground shrink-0">Inicio</Link>
          <span className="shrink-0">&gt;</span>
          <Link to="/colecciones" className="transition-colors hover:text-foreground shrink-0">Catálogo</Link>
          <span className="shrink-0">&gt;</span>
          <span className="text-foreground line-clamp-1">{product.title}</span>
        </nav>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* BLOCO 1 — HERO DE CONVERSÃO */}
        {/* ═══════════════════════════════════════════════════════════ */}
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
                    <button onClick={prevImage} className="absolute left-2 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-card/80 shadow-md backdrop-blur-sm transition hover:bg-card active:scale-95">
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button onClick={nextImage} className="absolute right-2 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-card/80 shadow-md backdrop-blur-sm transition hover:bg-card active:scale-95">
                      <ChevronRight className="h-5 w-5" />
                    </button>
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2">
                      <div className="flex h-1 gap-1">
                        {allImages.map((_, i) => (
                          <button key={i} onClick={() => setSelectedImage(i)} className={`h-1 rounded-full transition-all duration-300 ${i === selectedImage ? 'w-6 bg-foreground' : 'w-2 bg-foreground/30'}`} />
                        ))}
                      </div>
                      <span className="text-xs font-medium text-foreground bg-card/70 rounded px-1.5 py-0.5 backdrop-blur-sm">
                        {selectedImage + 1}/{allImages.length}
                      </span>
                    </div>
                  </>
                )}
              </div>
              {allImages.length > 1 && (
                <div className="flex gap-1.5 overflow-auto pb-1 sm:gap-2">
                  {allImages.map((img, i) => (
                    <button key={i} onClick={() => setSelectedImage(i)} className={`h-12 w-12 shrink-0 overflow-hidden rounded-md border-2 transition-colors sm:h-16 sm:w-16 sm:rounded-lg ${i === selectedImage ? 'border-foreground' : 'border-transparent hover:border-muted-foreground/30'}`}>
                      <img src={img.url} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </ScrollReveal>

          {/* Product info */}
          <ScrollReveal direction="right">
            <div className="space-y-4 sm:space-y-5">
              {/* Badges */}
              <div className="flex flex-wrap gap-1.5">
                <Badge className="bg-accent text-accent-foreground text-[10px] gap-1 px-2 py-0.5 sm:text-xs sm:gap-1.5 sm:px-3 sm:py-1">
                  <Banknote className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  Pago Contra Reembolso
                </Badge>
                {hasDiscount && (
                  <Badge className="bg-destructive text-destructive-foreground font-semibold text-[10px] px-2 py-0.5 sm:text-xs">-{discount}%</Badge>
                )}
              </div>

              {/* Headline + subtitle */}
              <div>
                <h1 className="text-lg font-bold tracking-tight sm:text-2xl lg:text-3xl" style={{ lineHeight: '1.15' }}>
                  {displayHeadline}
                </h1>
                {croContent.subtitle && (
                  <p className="mt-1 text-xs text-muted-foreground sm:text-sm">{croContent.subtitle}</p>
                )}
              </div>

              {/* Price */}
              <div>
                <div className="flex items-baseline gap-2 sm:gap-3">
                  <span className={`text-2xl font-bold tabular-nums sm:text-3xl ${hasDiscount ? 'text-destructive' : ''}`}>
                    {unitPrice.toFixed(2)} €
                  </span>
                  {hasDiscount && (
                    <span className="text-sm text-muted-foreground line-through tabular-nums sm:text-lg">
                      {compareAt.toFixed(2)} €
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-[11px] text-muted-foreground sm:text-xs">IVA incluido · Sin recargos</p>
                {hasDiscount && (
                  <p className="mt-0.5 text-xs font-medium text-accent sm:text-sm">¡Ahorras {(compareAt - unitPrice).toFixed(2)} €!</p>
                )}
              </div>

              {/* Microcopy COD */}
              <p className="text-xs text-accent font-semibold sm:text-sm">
                💶 Haz tu pedido hoy y paga al recibir
              </p>

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
                        <Button key={value} variant={isSelected ? 'default' : 'outline'} size="sm" disabled={isOOS}
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

              {/* ─── BLOCO 6 — KIT SELECTOR ─── */}
              <div className="space-y-2">
                <p className="text-xs font-semibold sm:text-sm">Elige tu pack</p>
                <div className="grid gap-2 sm:gap-2.5">
                  {(Object.entries(kitConfigs) as [KitOption, KitConfig][]).map(([key, cfg]) => {
                    const isActive = selectedKit === key;
                    const kitPrice = cfg.discount > 0 ? unitPrice * (1 - cfg.discount / 100) : unitPrice;
                    const kitTotal = kitPrice * cfg.qty;
                    const kitSave = cfg.discount > 0 ? (unitPrice * cfg.qty - kitTotal).toFixed(2) : null;
                    return (
                      <button
                        key={key}
                        onClick={() => {
                          setSelectedKit(key);
                          trackSelectKit(key, { id: product.id, title: product.title, value: kitTotal, currency });
                        }}
                        className={`relative flex items-center gap-3 rounded-lg border-2 p-3 text-left transition-all active:scale-[0.98] sm:p-4 ${
                          isActive
                            ? 'border-accent bg-accent/5 shadow-sm'
                            : 'border-border hover:border-muted-foreground/30'
                        }`}
                      >
                        {/* Radio dot */}
                        <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${isActive ? 'border-accent' : 'border-muted-foreground/30'}`}>
                          {isActive && <div className="h-2.5 w-2.5 rounded-full bg-accent" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold sm:text-sm">{cfg.label}</span>
                            {cfg.tag && (
                              <Badge className="bg-accent text-accent-foreground text-[9px] px-1.5 py-0 sm:text-[10px]">{cfg.tag}</Badge>
                            )}
                          </div>
                          <div className="flex flex-wrap items-baseline gap-1.5 mt-0.5">
                            <span className="text-sm font-bold tabular-nums sm:text-base">{kitTotal.toFixed(2)} €</span>
                            {kitSave && (
                              <span className="text-[10px] font-semibold text-accent sm:text-xs">Ahorras {kitSave} €</span>
                            )}
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-0.5 sm:text-[11px]">
                            {cfg.perks.join(' · ')}
                          </p>
                        </div>
                        {cfg.discount > 0 && (
                          <Badge variant="secondary" className="text-[9px] px-1.5 py-0 shrink-0 sm:text-[10px]">-{cfg.discount}%</Badge>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Stock + delivery */}
              <div className="space-y-1.5 sm:space-y-2">
                {product.availableForSale ? (
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-accent sm:h-2 sm:w-2" />
                    <span className="text-xs font-medium text-accent sm:text-sm">En stock · Envío rápido</span>
                  </div>
                ) : (
                  <Badge variant="destructive" className="text-xs">Agotado</Badge>
                )}
                {product.availableForSale && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground sm:gap-2 sm:text-sm">
                    <Truck className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                    <span>Entrega: {formatDate(deliveryStart)} – {formatDate(deliveryEnd)}</span>
                  </div>
                )}
              </div>

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
                      Pedir ahora y pagar al recibir
                    </>
                  )}
                </Button>
                <Button
                  size="lg" variant="outline"
                  className="w-full min-h-[44px] text-xs font-medium active:scale-[0.97] transition-transform gap-2 sm:min-h-[48px] sm:text-sm"
                  onClick={handleAddToCart}
                  disabled={!product.availableForSale || !selectedVariant?.availableForSale || isCartLoading}
                >
                  <ShoppingBag className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  Añadir al carrito
                </Button>
              </div>

              {/* Mini trust row */}
              <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                {[
                  { icon: Banknote, text: 'Pago al recibir' },
                  { icon: Truck, text: 'Envío 2–5 días' },
                  { icon: Phone, text: 'Confirmación WhatsApp' },
                  { icon: RotateCcw, text: 'Devolución 30 días' },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-1.5 rounded-md border p-2 sm:rounded-lg sm:p-2.5">
                    <Icon className="h-3.5 w-3.5 shrink-0 text-accent sm:h-4 sm:w-4" />
                    <span className="text-[10px] font-medium leading-tight sm:text-xs">{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>
        </div>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* BLOCO 2 — PROVA SOCIAL */}
        {/* ═══════════════════════════════════════════════════════════ */}
        {croContent.testimonials.length > 0 && (
          <section className="mt-10 sm:mt-16">
            <ScrollReveal>
              <div className="text-center">
                <h2 className="text-lg font-bold tracking-tight sm:text-2xl" style={{ lineHeight: '1.15' }}>
                  Lo que dicen nuestros clientes
                </h2>
                <div className="mt-1.5 flex items-center justify-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-warning text-warning sm:h-5 sm:w-5" />
                  ))}
                  <span className="ml-1.5 text-xs text-muted-foreground sm:text-sm">
                    4.8/5 · {croContent.testimonials.length}+ opiniones
                  </span>
                </div>
              </div>
            </ScrollReveal>
            <div className="mt-5 grid gap-3 sm:grid-cols-3 sm:gap-4">
              {croContent.testimonials.map((t, i) => (
                <ScrollReveal key={i} delay={i * 0.08}>
                  <div className="rounded-lg border bg-card p-4 sm:p-5">
                    <div className="flex items-center gap-0.5 mb-2">
                      {Array.from({ length: t.rating }).map((_, j) => (
                        <Star key={j} className="h-3 w-3 fill-warning text-warning sm:h-3.5 sm:w-3.5" />
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed sm:text-sm">"{t.text}"</p>
                    <p className="mt-2 text-[11px] font-semibold sm:text-xs">— {t.name}</p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </section>
        )}

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* BLOCO 3 — CÓMO FUNCIONA */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <section className="mt-10 sm:mt-16">
          <ScrollReveal>
            <h2 className="text-center text-lg font-bold tracking-tight sm:text-2xl" style={{ lineHeight: '1.15' }}>
              Cómo funciona el Pago Contra Reembolso
            </h2>
            <p className="mx-auto mt-1 max-w-md text-center text-xs text-muted-foreground sm:text-sm">
              Sin tarjeta. Sin pago anticipado. Así de fácil.
            </p>
          </ScrollReveal>
          <div className="mt-5 grid gap-3 grid-cols-1 sm:grid-cols-3 sm:gap-4">
            {[
              { icon: ShoppingBag, step: '1', title: 'Pides online', desc: 'Haces tu pedido sin tarjeta ni pago adelantado.' },
              { icon: MessageCircle, step: '2', title: 'Confirmamos por WhatsApp', desc: 'Verificamos tu pedido y dirección antes del envío.' },
              { icon: Banknote, step: '3', title: 'Recibes y pagas', desc: 'Pagas al repartidor cuando tienes el producto en mano.' },
            ].map((s, i) => (
              <ScrollReveal key={s.step} delay={i * 0.1}>
                <div className="flex items-center gap-4 rounded-xl border bg-card p-4 shadow-sm sm:flex-col sm:items-center sm:text-center sm:p-6">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground text-sm font-bold sm:h-12 sm:w-12">
                    {s.step}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-sm sm:text-base">{s.title}</h3>
                    <p className="mt-0.5 text-xs text-muted-foreground sm:mt-1 sm:text-sm">{s.desc}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* BLOCO 4 — BENEFÍCIOS */}
        {/* ═══════════════════════════════════════════════════════════ */}
        {croContent.benefits.length > 0 && (
          <section className="mt-10 sm:mt-16">
            <ScrollReveal>
              <h2 className="text-lg font-bold tracking-tight sm:text-2xl" style={{ lineHeight: '1.15' }}>
                Beneficios principales
              </h2>
            </ScrollReveal>
            <div className="mt-4 grid gap-2.5 sm:grid-cols-2 sm:gap-3">
              {croContent.benefits.map((b, i) => (
                <ScrollReveal key={i} delay={i * 0.05}>
                  <div className="flex items-start gap-2.5 rounded-lg border p-3 sm:p-4">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                    <span className="text-xs sm:text-sm">{b}</span>
                  </div>
                </ScrollReveal>
              ))}
            </div>

            {/* Qué incluye + Cómo usar */}
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {croContent.includes.length > 0 && (
                <ScrollReveal>
                  <div className="rounded-lg border bg-card p-4 sm:p-5">
                    <h3 className="text-sm font-bold flex items-center gap-1.5 sm:text-base">
                      <Package className="h-4 w-4 text-accent" /> Qué incluye
                    </h3>
                    <ul className="mt-2 space-y-1.5">
                      {croContent.includes.map((item, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground sm:text-sm">
                          <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </ScrollReveal>
              )}
              {croContent.howToUse.length > 0 && (
                <ScrollReveal delay={0.1}>
                  <div className="rounded-lg border bg-card p-4 sm:p-5">
                    <h3 className="text-sm font-bold flex items-center gap-1.5 sm:text-base">
                      <Zap className="h-4 w-4 text-accent" /> Cómo usar
                    </h3>
                    <ol className="mt-2 space-y-1.5 list-decimal list-inside">
                      {croContent.howToUse.map((step, i) => (
                        <li key={i} className="text-xs text-muted-foreground sm:text-sm">{step}</li>
                      ))}
                    </ol>
                  </div>
                </ScrollReveal>
              )}
            </div>
          </section>
        )}

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* BLOCO 5 — COMPARATIVO */}
        {/* ═══════════════════════════════════════════════════════════ */}
        {croContent.comparison.length > 0 && (
          <section className="mt-10 sm:mt-16">
            <ScrollReveal>
              <h2 className="text-center text-lg font-bold tracking-tight sm:text-2xl" style={{ lineHeight: '1.15' }}>
                Nuestro producto vs opciones genéricas
              </h2>
            </ScrollReveal>
            <ScrollReveal delay={0.1}>
              <div className="mt-5 overflow-x-auto">
                <table className="w-full min-w-[400px] text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="py-2 pr-3 text-left font-semibold text-muted-foreground">Criterio</th>
                      <th className="py-2 px-3 text-center font-bold text-accent">Revolución Fit</th>
                      <th className="py-2 pl-3 text-center font-semibold text-muted-foreground">Genérico</th>
                    </tr>
                  </thead>
                  <tbody>
                    {croContent.comparison.map(([criteria, ours, generic], i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="py-2.5 pr-3 font-medium">{criteria}</td>
                        <td className="py-2.5 px-3 text-center text-accent font-medium">{ours}</td>
                        <td className="py-2.5 pl-3 text-center text-muted-foreground">{generic}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ScrollReveal>
          </section>
        )}

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* BLOCO 7 — FAQ DE OBJEÇÕES */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <section className="mt-10 sm:mt-16">
          <ScrollReveal>
            <h2 className="text-center text-lg font-bold tracking-tight sm:text-2xl" style={{ lineHeight: '1.15' }}>
              Preguntas frecuentes
            </h2>
          </ScrollReveal>
          <div className="mx-auto mt-5 max-w-2xl">
            <Accordion type="single" collapsible>
              {objectionFAQ.map((item, i) => (
                <ScrollReveal key={i} delay={i * 0.04}>
                  <AccordionItem value={`faq-${i}`}>
                    <AccordionTrigger className="text-xs font-semibold text-left sm:text-sm">{item.q}</AccordionTrigger>
                    <AccordionContent className="text-xs text-muted-foreground sm:text-sm">{item.a}</AccordionContent>
                  </AccordionItem>
                </ScrollReveal>
              ))}
            </Accordion>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* BLOCO 8 — GARANTÍA */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <section className="mt-10 sm:mt-16">
          <ScrollReveal>
            <div className="rounded-xl border bg-accent/5 p-5 sm:p-8 text-center">
              <ShieldCheck className="mx-auto h-8 w-8 text-accent sm:h-10 sm:w-10" />
              <h2 className="mt-3 text-lg font-bold sm:text-2xl">Compra sin riesgo</h2>
              <p className="mx-auto mt-2 max-w-lg text-xs text-muted-foreground leading-relaxed sm:text-sm">
                No necesitas tarjeta. Confirmamos tu pedido por WhatsApp, lo enviamos y pagas al repartidor.
                Si no te convence, tienes 30 días para devolverlo sin coste. Sin letra pequeña.
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-3 sm:gap-4">
                {[
                  { icon: Banknote, text: 'Sin pago anticipado' },
                  { icon: RotateCcw, text: '30 días devolución' },
                  { icon: Phone, text: 'Soporte en español' },
                  { icon: Truck, text: 'Seguimiento incluido' },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-1.5">
                    <Icon className="h-3.5 w-3.5 text-accent sm:h-4 sm:w-4" />
                    <span className="text-[10px] font-medium sm:text-xs">{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>
        </section>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* BLOCO 9 — CTA FINAL */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <section className="mt-10 sm:mt-16">
          <ScrollReveal>
            <div className="mx-auto max-w-xl text-center">
              <h2 className="text-lg font-bold sm:text-2xl">¿Listo para probarlo?</h2>
              <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                Sin riesgo. Pagas solo cuando lo tengas en tus manos.
              </p>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-center sm:gap-3">
                <Button
                  size="lg"
                  className="min-h-[48px] text-sm font-semibold shadow-md active:scale-[0.97] gap-2 bg-accent text-accent-foreground hover:bg-accent/90 sm:text-base sm:px-8"
                  onClick={handleBuyNowCOD}
                  disabled={!product.availableForSale || isCartLoading}
                >
                  <Banknote className="h-4 w-4 shrink-0" />
                  Finalizar pedido y pagar al recibir
                </Button>
                <Button
                  size="lg" variant="outline"
                  className="min-h-[44px] text-xs font-medium active:scale-[0.97] gap-2 sm:text-sm"
                  onClick={handleAddToCart}
                  disabled={!product.availableForSale || isCartLoading}
                >
                  <ShoppingBag className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  Añadir al carrito
                </Button>
              </div>
            </div>
          </ScrollReveal>
        </section>

        {/* Cross-sell */}
        {crossSell.length > 0 && (
          <section className="mt-10 sm:mt-16">
            <ScrollReveal>
              <h2 className="text-lg font-bold tracking-tight sm:text-2xl">Completa tu equipo</h2>
            </ScrollReveal>
            <div className="mt-5 grid gap-3 grid-cols-2 sm:gap-4 lg:grid-cols-4">
              {crossSell.map((p, i) => (
                <ScrollReveal key={p.node.id} delay={i * 0.06}>
                  <ProductCard product={p} />
                </ScrollReveal>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Sticky mobile CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card/95 p-2.5 backdrop-blur-md lg:hidden">
        <div className="mx-auto flex max-w-lg items-center gap-2.5">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-muted-foreground line-clamp-1">{product.title}</p>
            <p className={`text-base font-bold tabular-nums ${hasDiscount ? 'text-destructive' : ''}`}>
              {kitTotalPrice.toFixed(2)} €
              {kitCfg.qty > 1 && <span className="text-[10px] font-normal text-muted-foreground ml-1">({kitCfg.qty}×)</span>}
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
