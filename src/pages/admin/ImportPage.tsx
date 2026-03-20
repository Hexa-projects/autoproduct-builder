import { useState, useCallback } from 'react';
import { useSaveProduct, useCategories } from '@/hooks/useProducts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Upload, Check, X } from 'lucide-react';
import type { Product } from '@/types/product';

interface ImportRow {
  name: string;
  category?: string;
  original_price?: number;
  promotional_price?: number;
  short_description?: string;
  main_image?: string;
  sku?: string;
  stock?: number;
  checkout_url_default?: string;
  valid: boolean;
  error?: string;
}

export default function ImportPage() {
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [done, setDone] = useState(false);
  const { data: categories } = useCategories();
  const saveProduct = useSaveProduct();

  const parseCSV = (text: string): ImportRow[] => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());

    return lines.slice(1).map((line) => {
      const values = line.split(',').map((v) => v.trim());
      const obj: any = {};
      headers.forEach((h, i) => { obj[h] = values[i] || ''; });

      const row: ImportRow = {
        name: obj.name || obj.nombre || '',
        category: obj.category || obj.categoria || '',
        original_price: parseFloat(obj.original_price || obj.precio || '0') || undefined,
        promotional_price: parseFloat(obj.promotional_price || obj.precio_promocional || '0') || undefined,
        short_description: obj.short_description || obj.descripcion || '',
        main_image: obj.main_image || obj.imagen_url || obj.image_url || '',
        sku: obj.sku || '',
        stock: parseInt(obj.stock || obj.estoque || '0') || 0,
        checkout_url_default: obj.checkout_url || obj.checkout_url_default || '',
        valid: true,
      };

      if (!row.name) {
        row.valid = false;
        row.error = 'Nombre requerido';
      }
      return row;
    });
  };

  const parseJSON = (text: string): ImportRow[] => {
    try {
      const arr = JSON.parse(text);
      if (!Array.isArray(arr)) return [];
      return arr.map((obj: any) => {
        const row: ImportRow = {
          name: obj.name || obj.nombre || '',
          category: obj.category || obj.categoria || '',
          original_price: parseFloat(obj.original_price || obj.precio || '0') || undefined,
          promotional_price: parseFloat(obj.promotional_price || obj.precio_promocional || '0') || undefined,
          short_description: obj.short_description || obj.descripcion || '',
          main_image: obj.main_image || obj.imagen_url || obj.image_url || '',
          sku: obj.sku || '',
          stock: parseInt(obj.stock || obj.estoque || '0') || 0,
          checkout_url_default: obj.checkout_url || obj.checkout_url_default || '',
          valid: true,
        };
        if (!row.name) { row.valid = false; row.error = 'Nombre requerido'; }
        return row;
      });
    } catch {
      return [];
    }
  };

  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setDone(false);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const parsed = file.name.endsWith('.json') ? parseJSON(text) : parseCSV(text);
      if (parsed.length === 0) {
        toast({ title: 'Archivo vacío o formato inválido', variant: 'destructive' });
        return;
      }
      setRows(parsed);
    };
    reader.readAsText(file);
  }, []);

  const handleImport = async () => {
    const valid = rows.filter((r) => r.valid);
    if (valid.length === 0) return;

    setImporting(true);
    let success = 0;
    for (const row of valid) {
      try {
        const catMatch = categories?.find(
          (c) => c.name.toLowerCase() === (row.category || '').toLowerCase()
        );

        await saveProduct.mutateAsync({
          name: row.name,
          short_description: row.short_description || null,
          original_price: row.original_price || null,
          promotional_price: row.promotional_price || null,
          main_image: row.main_image || null,
          sku: row.sku || null,
          stock: row.stock || 0,
          checkout_url_default: row.checkout_url_default || null,
          category_id: catMatch?.id || null,
          status: 'draft',
        } as any);
        success++;
      } catch {
        // continue
      }
    }
    setImporting(false);
    setDone(true);
    toast({ title: `${success} de ${valid.length} productos importados como borrador` });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Importar productos</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Subir archivo CSV o JSON</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Columnas soportadas: name, category, original_price, promotional_price, short_description, main_image / image_url, sku, stock, checkout_url
          </p>
          <div className="flex items-center gap-4">
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed px-6 py-4 transition-colors hover:bg-muted">
              <Upload className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium">Seleccionar archivo</span>
              <input type="file" accept=".csv,.json" className="hidden" onChange={handleFile} />
            </label>
          </div>
        </CardContent>
      </Card>

      {rows.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Preview ({rows.length} filas)</CardTitle>
            <Button onClick={handleImport} disabled={importing || done || rows.filter(r => r.valid).length === 0}>
              {importing ? 'Importando...' : done ? 'Completado' : `Importar ${rows.filter(r => r.valid).length} productos`}
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Estado</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Precio</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>SKU</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r, i) => (
                    <TableRow key={i} className={!r.valid ? 'opacity-50' : ''}>
                      <TableCell>
                        {r.valid ? (
                          <Check className="h-4 w-4" style={{ color: 'hsl(var(--success))' }} />
                        ) : (
                          <span className="flex items-center gap-1 text-destructive text-xs">
                            <X className="h-4 w-4" /> {r.error}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{r.name || '—'}</TableCell>
                      <TableCell>{r.category || '—'}</TableCell>
                      <TableCell className="tabular-nums">
                        {r.promotional_price ? `€${r.promotional_price}` : r.original_price ? `€${r.original_price}` : '—'}
                      </TableCell>
                      <TableCell>{r.stock ?? 0}</TableCell>
                      <TableCell>{r.sku || '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
