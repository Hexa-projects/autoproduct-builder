export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  subtitle: string | null;
  short_description: string | null;
  full_description: string | null;
  category_id: string | null;
  tags: string[];
  status: 'draft' | 'published';
  main_image: string | null;
  gallery: string[];
  video_url: string | null;
  base_cost: number | null;
  original_price: number | null;
  promotional_price: number | null;
  currency: string;
  sku: string | null;
  stock: number;
  featured: boolean;
  mvp_ads: boolean;
  available_countries: string[];
  shipping_time: string | null;
  shipping_cost: number;
  cod_available: boolean;
  prepaid_available: boolean;
  meta_title: string | null;
  meta_description: string | null;
  og_image: string | null;
  checkout_url_default: string | null;
  checkout_url_pack_1: string | null;
  checkout_url_pack_2: string | null;
  checkout_url_pack_3: string | null;
  created_at: string;
  updated_at: string;
  category?: Category;
}

export interface ProductVariation {
  id: string;
  product_id: string;
  size: string | null;
  color: string | null;
  price: number | null;
  stock: number;
  sku: string | null;
  checkout_url: string | null;
  created_at: string;
}

export interface ProductWithVariations extends Product {
  variations: ProductVariation[];
}
