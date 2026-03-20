import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Product, ProductVariation, Category } from '@/types/product';

export function usePublishedProducts(filters?: {
  category?: string;
  search?: string;
  featured?: boolean;
  sort?: 'newest' | 'price_asc' | 'price_desc';
  minPrice?: number;
  maxPrice?: number;
}) {
  return useQuery({
    queryKey: ['products', 'published', filters],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select('*, category:categories(*)')
        .eq('status', 'published');

      if (filters?.category) query = query.eq('category_id', filters.category);
      if (filters?.featured) query = query.eq('featured', true);
      if (filters?.search) query = query.ilike('name', `%${filters.search}%`);
      if (filters?.minPrice) query = query.gte('promotional_price', filters.minPrice);
      if (filters?.maxPrice) query = query.lte('promotional_price', filters.maxPrice);

      switch (filters?.sort) {
        case 'price_asc':
          query = query.order('promotional_price', { ascending: true, nullsFirst: false });
          break;
        case 'price_desc':
          query = query.order('promotional_price', { ascending: false, nullsFirst: false });
          break;
        default:
          query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as (Product & { category: Category | null })[];
    },
  });
}

export function useProductBySlug(slug: string) {
  return useQuery({
    queryKey: ['product', slug],
    queryFn: async () => {
      const { data: product, error } = await supabase
        .from('products')
        .select('*, category:categories(*)')
        .eq('slug', slug)
        .eq('status', 'published')
        .single();
      if (error) throw error;

      const { data: variations } = await supabase
        .from('product_variations')
        .select('*')
        .eq('product_id', product.id);

      return { ...product, variations: variations || [] } as Product & { category: Category | null; variations: ProductVariation[] };
    },
    enabled: !!slug,
  });
}

export function useAllProducts() {
  return useQuery({
    queryKey: ['products', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*, category:categories(*)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as (Product & { category: Category | null })[];
    },
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return data as Category[];
    },
  });
}

export function useSaveProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (product: Partial<Product> & { id?: string }) => {
      const { id, category, ...data } = product as any;
      if (id) {
        const { data: updated, error } = await supabase
          .from('products')
          .update(data)
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return updated;
      } else {
        const { data: created, error } = await supabase
          .from('products')
          .insert(data)
          .select()
          .single();
        if (error) throw error;
        return created;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useSaveCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (cat: Partial<Category> & { id?: string }) => {
      const { id, ...data } = cat;
      if (id) {
        const { data: updated, error } = await supabase
          .from('categories')
          .update(data)
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return updated;
      } else {
        const { data: created, error } = await supabase
          .from('categories')
          .insert(data as any)
          .select()
          .single();
        if (error) throw error;
        return created;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

export function useSaveVariation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (variation: Partial<ProductVariation> & { product_id: string; id?: string }) => {
      const { id, ...data } = variation;
      if (id) {
        const { data: updated, error } = await supabase
          .from('product_variations')
          .update(data)
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return updated;
      } else {
        const { data: created, error } = await supabase
          .from('product_variations')
          .insert(data)
          .select()
          .single();
        if (error) throw error;
        return created;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product'] });
    },
  });
}
