import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useShopifyProducts, useShopifyCollections, useShopifyCollectionProducts } from '@/hooks/useShopify';
import { Layout } from '@/components/layout/Layout';
import { ProductCard } from '@/components/ProductCard';
import { ScrollReveal } from '@/components/ScrollReveal';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Search, SlidersHorizontal, ShoppingBag, X } from 'lucide-react';
import type { ShopifyProduct } from '@/lib/shopify';

type SortOption = 'relevance' | 'best-sellers' | 'price-asc' | 'price-desc' | 'newest';

function sortProducts(products: ShopifyProduct[], sort: SortOption): ShopifyProduct[] {
  const sorted = [...products];
  switch (sort) {
    case 'best-sellers':
      return sorted.sort((a, b) => {
        const aTop = a.node.tags?.some(t => ['bestseller', 'top', 'popular'].includes(t.toLowerCase())) ? 1 : 0;
        const bTop = b.node.tags?.some(t => ['bestseller', 'top', 'popular'].includes(t.toLowerCase())) ? 1 : 0;
        if (bTop !== aTop) return bTop - aTop;
        return (b.node.availableForSale ? 1 : 0) - (a.node.availableForSale ? 1 : 0);
      });
    case 'price-asc':
      return sorted.sort((a, b) => parseFloat(a.node.priceRange.minVariantPrice.amount) - parseFloat(b.node.priceRange.minVariantPrice.amount));
    case 'price-desc':
      return sorted.sort((a, b) => parseFloat(b.node.priceRange.minVariantPrice.amount) - parseFloat(a.node.priceRange.minVariantPrice.amount));
    default:
      return sorted;
  }
}

function FilterSidebar({
  collections, activeCollection, onCollectionChange,
  availability, onAvailabilityChange,
  priceRange, onPriceRangeChange,
}: {
  collections: { node: { handle: string; title: string } }[];
  activeCollection: string | null;
  onCollectionChange: (handle: string | null) => void;
  availability: 'all' | 'available';
  onAvailabilityChange: (v: 'all' | 'available') => void;
  priceRange: [number, number];
  onPriceRangeChange: (v: [number, number]) => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Categoría</h3>
        <div className="flex flex-wrap gap-1.5">
          <Button size="sm" variant={!activeCollection ? 'default' : 'outline'} onClick={() => onCollectionChange(null)} className="text-xs h-8">
            Todos
          </Button>
          {collections.map((c) => (
            <Button key={c.node.handle} size="sm" variant={activeCollection === c.node.handle ? 'default' : 'outline'} onClick={() => onCollectionChange(c.node.handle)} className="text-xs h-8">
              {c.node.title}
            </Button>
          ))}
        </div>
      </div>
      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Disponibilidad</h3>
        <div className="flex gap-1.5">
          <Button size="sm" variant={availability === 'all' ? 'default' : 'outline'} onClick={() => onAvailabilityChange('all')} className="text-xs h-8">Todos</Button>
          <Button size="sm" variant={availability === 'available' ? 'default' : 'outline'} onClick={() => onAvailabilityChange('available')} className="text-xs h-8">En stock</Button>
        </div>
      </div>
      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Precio</h3>
        <div className="flex items-center gap-2">
          <Input type="number" placeholder="Min" value={priceRange[0] || ''} onChange={(e) => onPriceRangeChange([Number(e.target.value) || 0, priceRange[1]])} className="w-20 h-8 text-xs" />
          <span className="text-muted-foreground text-xs">—</span>
          <Input type="number" placeholder="Max" value={priceRange[1] || ''} onChange={(e) => onPriceRangeChange([priceRange[0], Number(e.target.value) || 999])} className="w-20 h-8 text-xs" />
        </div>
      </div>
    </div>
  );
}

export default function CatalogPage() {
  const { handle } = useParams<{ handle?: string }>();
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortOption>('relevance');
  const [availability, setAvailability] = useState<'all' | 'available'>('all');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 999]);
  const [activeCollection, setActiveCollection] = useState<string | null>(handle || null);

  const { data: allProducts, isLoading: loadingAll } = useShopifyProducts(search || undefined);
  const { data: collectionProducts, isLoading: loadingCollection } = useShopifyCollectionProducts(activeCollection || '');
  const { data: collections } = useShopifyCollections();

  const rawProducts = activeCollection ? collectionProducts : allProducts;
  const isLoading = activeCollection ? loadingCollection : loadingAll;

  const filtered = useMemo(() => {
    if (!rawProducts) return [];
    let result = [...rawProducts];
    if (availability === 'available') result = result.filter((p) => p.node.availableForSale);
    if (priceRange[0] > 0 || priceRange[1] < 999) {
      result = result.filter((p) => {
        const price = parseFloat(p.node.priceRange.minVariantPrice.amount);
        return price >= priceRange[0] && price <= priceRange[1];
      });
    }
    return sortProducts(result, sort);
  }, [rawProducts, sort, availability, priceRange]);

  const activeFilters = [
    activeCollection && 'Categoría',
    availability === 'available' && 'En stock',
    (priceRange[0] > 0 || priceRange[1] < 999) && 'Precio',
  ].filter(Boolean);

  return (
    <Layout>
      <div className="mx-auto max-w-7xl px-3 py-4 sm:px-4 sm:py-6">
        <ScrollReveal>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
            <div>
              <h1 className="text-xl font-bold tracking-tight sm:text-3xl" style={{ lineHeight: '1.15' }}>
                {activeCollection
                  ? collections?.find((c) => c.node.handle === activeCollection)?.node.title || 'Colección'
                  : 'Catálogo'}
              </h1>
              <p className="mt-0.5 text-muted-foreground text-xs sm:text-base">
                {filtered.length} producto{filtered.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-48 sm:flex-none">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-9 text-xs sm:text-sm" />
              </div>
              <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
                <SelectTrigger className="w-28 h-9 text-xs sm:w-40 sm:text-sm">
                  <SelectValue placeholder="Ordenar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevance">Relevancia</SelectItem>
                  <SelectItem value="best-sellers">Más vendidos</SelectItem>
                  <SelectItem value="price-asc">Precio ↑</SelectItem>
                  <SelectItem value="price-desc">Precio ↓</SelectItem>
                  <SelectItem value="newest">Novedades</SelectItem>
                </SelectContent>
              </Select>
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="lg:hidden h-9 w-9">
                    <SlidersHorizontal className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[280px] max-w-[85vw]">
                  <SheetTitle>Filtros</SheetTitle>
                  <div className="mt-6">
                    <FilterSidebar
                      collections={collections || []}
                      activeCollection={activeCollection}
                      onCollectionChange={setActiveCollection}
                      availability={availability}
                      onAvailabilityChange={setAvailability}
                      priceRange={priceRange}
                      onPriceRangeChange={setPriceRange}
                    />
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </ScrollReveal>

        {activeFilters.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {activeFilters.map((f) => (
              <Badge key={f as string} variant="secondary" className="gap-1 text-[10px] sm:text-xs">
                {f as string}
                <X className="h-3 w-3 cursor-pointer" onClick={() => {
                  if (f === 'Categoría') setActiveCollection(null);
                  if (f === 'En stock') setAvailability('all');
                  if (f === 'Precio') setPriceRange([0, 999]);
                }} />
              </Badge>
            ))}
          </div>
        )}

        <div className="mt-4 flex gap-6 sm:mt-6 sm:gap-8">
          <aside className="hidden w-52 shrink-0 lg:block">
            <FilterSidebar
              collections={collections || []}
              activeCollection={activeCollection}
              onCollectionChange={setActiveCollection}
              availability={availability}
              onAvailabilityChange={setAvailability}
              priceRange={priceRange}
              onPriceRangeChange={setPriceRange}
            />
          </aside>

          <div className="flex-1 min-w-0">
            {isLoading ? (
              <div className="grid gap-3 grid-cols-2 sm:gap-4 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="aspect-square w-full rounded-lg" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <ShoppingBag className="h-10 w-10 text-muted-foreground/40" />
                <h3 className="mt-3 text-base font-semibold">Sin resultados</h3>
                <p className="mt-1 text-xs text-muted-foreground">Prueba con otros filtros.</p>
              </div>
            ) : (
              <div className="grid gap-3 grid-cols-2 sm:gap-4 xl:grid-cols-3">
                {filtered.map((product, i) => (
                  <ScrollReveal key={product.node.id} delay={i * 0.04}>
                    <ProductCard product={product} />
                  </ScrollReveal>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
