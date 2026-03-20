import { useAllProducts } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useProducts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, FolderOpen, Star, AlertTriangle } from 'lucide-react';

export default function DashboardPage() {
  const { data: products } = useAllProducts();
  const { data: categories } = useCategories();

  const published = products?.filter((p) => p.status === 'published').length ?? 0;
  const drafts = products?.filter((p) => p.status === 'draft').length ?? 0;
  const outOfStock = products?.filter((p) => p.stock === 0 && p.status === 'published').length ?? 0;
  const featured = products?.filter((p) => p.featured).length ?? 0;

  const stats = [
    { label: 'Productos publicados', value: published, icon: Package, color: 'text-green-600' },
    { label: 'Borradores', value: drafts, icon: Package, color: 'text-muted-foreground' },
    { label: 'Sin stock', value: outOfStock, icon: AlertTriangle, color: 'text-destructive' },
    { label: 'Destacados', value: featured, icon: Star, color: 'text-amber-500' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
              <s.icon className={`h-4 w-4 ${s.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tabular-nums">{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Categorías ({categories?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {categories?.length ? (
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <span key={c.id} className="rounded-md bg-secondary px-3 py-1 text-sm font-medium">
                  {c.name}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No hay categorías aún.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
