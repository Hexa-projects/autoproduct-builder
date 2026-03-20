import { useQuery } from '@tanstack/react-query';
import { fetchProducts, fetchProductByHandle, fetchCollections, fetchCollectionProducts } from '@/lib/shopify';

export function useShopifyProducts(query?: string) {
  return useQuery({
    queryKey: ['shopify-products', query],
    queryFn: () => fetchProducts(50, query),
    staleTime: 5 * 60 * 1000,
  });
}

export function useShopifyProductByHandle(handle: string) {
  return useQuery({
    queryKey: ['shopify-product', handle],
    queryFn: () => fetchProductByHandle(handle),
    enabled: !!handle,
    staleTime: 5 * 60 * 1000,
  });
}

export function useShopifyCollections() {
  return useQuery({
    queryKey: ['shopify-collections'],
    queryFn: () => fetchCollections(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useShopifyCollectionProducts(handle: string) {
  return useQuery({
    queryKey: ['shopify-collection-products', handle],
    queryFn: () => fetchCollectionProducts(handle),
    enabled: !!handle,
    staleTime: 5 * 60 * 1000,
  });
}
