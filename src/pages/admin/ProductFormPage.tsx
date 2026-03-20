import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useSaveProduct, useCategories } from '@/hooks/useProducts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, Save } from 'lucide-react';
import type { Product } from '@/types/product';

const emptyProduct: Partial<Product> = {
  name: '', subtitle: '', short_description: '', full_description: '',
  category_id: null, tags: [], status: 'draft',
  main_image: null, gallery: [], video_url: null,
  base_cost: null, original_price: null, promotional_price: null,
  currency: 'EUR', sku: null, stock: 0,
  featured: false, mvp_ads: false,
  available_countries: [], shipping_time: null, shipping_cost: 0,
  cod_available: false, prepaid_available: true,
  meta_title: null, meta_description: null, og_image: null,
  checkout_url_default: null, checkout_url_pack_1: null,
  checkout_url_pack_2: null, checkout_url_pack_3: null,
};

export default function ProductFormPage() {
  const { id } = useParams();
  const isNew = id === 'new';
  const navigate = useNavigate();
  const { data: categories } = useCategories();
  const saveProduct = useSaveProduct();
  const [form, setForm] = useState<Partial<Product>>(emptyProduct);
  const [loading, setLoading] = useState(!isNew);
  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => {
    if (!isNew && id) {
      supabase.from('products').select('*').eq('id', id).single().then(({ data, error }) => {
        if (error || !data) { navigate('/admin/products'); return; }
        setForm(data as Product);
        setLoading(false);
      });
    }
  }, [id, isNew, navigate]);

  const set = (key: keyof Product, value: any) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleImageUpload = async (file: File) => {
    const ext = file.name.split('.').pop();
    const path = `products/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('product-images').upload(path, file);
    if (error) throw error;
    const { data } = supabase.storage.from('product-images').getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) { toast({ title: 'Nombre requerido', variant: 'destructive' }); return; }

    try {
      let mainImage = form.main_image;
      if (imageFile) {
        mainImage = await handleImageUpload(imageFile);
      }

      if (form.status === 'published' && !mainImage) {
        toast({ title: 'Se requiere imagen para publicar', variant: 'destructive' });
        return;
      }

      await saveProduct.mutateAsync({
        ...form,
        main_image: mainImage,
        ...(isNew ? {} : { id }),
      } as any);

      toast({ title: isNew ? 'Producto creado' : 'Producto actualizado' });
      navigate('/admin/products');
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  if (loading) return <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/products')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">
          {isNew ? 'Nuevo producto' : 'Editar producto'}
        </h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Tabs defaultValue="general" className="space-y-6">
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="pricing">Precios</TabsTrigger>
            <TabsTrigger value="media">Media</TabsTrigger>
            <TabsTrigger value="shipping">Envío</TabsTrigger>
            <TabsTrigger value="checkout">Checkout</TabsTrigger>
            <TabsTrigger value="seo">SEO</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Información básica</CardTitle></CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label>Nombre *</Label>
                  <Input value={form.name || ''} onChange={(e) => set('name', e.target.value)} required />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Subtítulo</Label>
                  <Input value={form.subtitle || ''} onChange={(e) => set('subtitle', e.target.value)} />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Descripción corta</Label>
                  <Textarea value={form.short_description || ''} onChange={(e) => set('short_description', e.target.value)} rows={2} />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Descripción completa</Label>
                  <Textarea value={form.full_description || ''} onChange={(e) => set('full_description', e.target.value)} rows={6} />
                </div>
                <div className="space-y-2">
                  <Label>Categoría</Label>
                  <Select value={form.category_id || ''} onValueChange={(v) => set('category_id', v || null)}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>
                      {categories?.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>SKU</Label>
                  <Input value={form.sku || ''} onChange={(e) => set('sku', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Tags (separados por coma)</Label>
                  <Input
                    value={(form.tags || []).join(', ')}
                    onChange={(e) => set('tags', e.target.value.split(',').map((t) => t.trim()).filter(Boolean))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Stock</Label>
                  <Input type="number" value={form.stock ?? 0} onChange={(e) => set('stock', parseInt(e.target.value) || 0)} />
                </div>
                <div className="space-y-2">
                  <Label>Estado</Label>
                  <Select value={form.status || 'draft'} onValueChange={(v) => set('status', v as any)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Borrador</SelectItem>
                      <SelectItem value="published">Publicado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-3">
                  <Switch checked={form.featured || false} onCheckedChange={(v) => set('featured', v)} />
                  <Label>Destacado</Label>
                </div>
                <div className="flex items-center gap-3">
                  <Switch checked={form.mvp_ads || false} onCheckedChange={(v) => set('mvp_ads', v)} />
                  <Label>MVP Ads</Label>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pricing" className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Precios</CardTitle></CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>Costo base (€)</Label>
                  <Input type="number" step="0.01" value={form.base_cost ?? ''} onChange={(e) => set('base_cost', parseFloat(e.target.value) || null)} />
                </div>
                <div className="space-y-2">
                  <Label>Precio original (€)</Label>
                  <Input type="number" step="0.01" value={form.original_price ?? ''} onChange={(e) => set('original_price', parseFloat(e.target.value) || null)} />
                </div>
                <div className="space-y-2">
                  <Label>Precio promocional (€)</Label>
                  <Input type="number" step="0.01" value={form.promotional_price ?? ''} onChange={(e) => set('promotional_price', parseFloat(e.target.value) || null)} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="media" className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Imágenes y video</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Imagen principal</Label>
                  {form.main_image && (
                    <img src={form.main_image} alt="Preview" className="h-32 w-32 rounded-lg object-cover" />
                  )}
                  <Input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
                </div>
                <div className="space-y-2">
                  <Label>URL de video (opcional)</Label>
                  <Input value={form.video_url || ''} onChange={(e) => set('video_url', e.target.value || null)} placeholder="https://youtube.com/..." />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="shipping" className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Envío</CardTitle></CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Plazo de envío</Label>
                  <Input value={form.shipping_time || ''} onChange={(e) => set('shipping_time', e.target.value || null)} placeholder="3-5 días" />
                </div>
                <div className="space-y-2">
                  <Label>Costo de envío (€)</Label>
                  <Input type="number" step="0.01" value={form.shipping_cost ?? 0} onChange={(e) => set('shipping_cost', parseFloat(e.target.value) || 0)} />
                </div>
                <div className="flex items-center gap-3">
                  <Switch checked={form.cod_available || false} onCheckedChange={(v) => set('cod_available', v)} />
                  <Label>Pago contra reembolso</Label>
                </div>
                <div className="flex items-center gap-3">
                  <Switch checked={form.prepaid_available ?? true} onCheckedChange={(v) => set('prepaid_available', v)} />
                  <Label>Pago prepago</Label>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="checkout" className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-base">URLs de checkout</CardTitle></CardHeader>
              <CardContent className="grid gap-4">
                <div className="space-y-2">
                  <Label>Checkout default</Label>
                  <Input value={form.checkout_url_default || ''} onChange={(e) => set('checkout_url_default', e.target.value || null)} placeholder="https://checkout.example.com/..." />
                </div>
                <div className="space-y-2">
                  <Label>Checkout Pack 1</Label>
                  <Input value={form.checkout_url_pack_1 || ''} onChange={(e) => set('checkout_url_pack_1', e.target.value || null)} />
                </div>
                <div className="space-y-2">
                  <Label>Checkout Pack 2</Label>
                  <Input value={form.checkout_url_pack_2 || ''} onChange={(e) => set('checkout_url_pack_2', e.target.value || null)} />
                </div>
                <div className="space-y-2">
                  <Label>Checkout Pack 3</Label>
                  <Input value={form.checkout_url_pack_3 || ''} onChange={(e) => set('checkout_url_pack_3', e.target.value || null)} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="seo" className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-base">SEO</CardTitle></CardHeader>
              <CardContent className="grid gap-4">
                <div className="space-y-2">
                  <Label>Meta título</Label>
                  <Input value={form.meta_title || ''} onChange={(e) => set('meta_title', e.target.value || null)} maxLength={60} />
                </div>
                <div className="space-y-2">
                  <Label>Meta descripción</Label>
                  <Textarea value={form.meta_description || ''} onChange={(e) => set('meta_description', e.target.value || null)} maxLength={160} rows={3} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" type="button" onClick={() => navigate('/admin/products')}>Cancelar</Button>
          <Button type="submit" disabled={saveProduct.isPending}>
            <Save className="mr-2 h-4 w-4" />
            {saveProduct.isPending ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </form>
    </div>
  );
}
