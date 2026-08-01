// frontend/src/features/products/hooks/useProducts.ts
import { useState, useEffect, useMemo, useRef } from 'react';
import { Product } from '../types';
import { productApi } from '../api/productApi';
import { groupProductsByCategory, extractUniqueCategories } from '../utils/productHelpers';

// ─────────────────────────────────────────────────────────────────────────────
// Module-level cache — survives unmount/remount within the same tab. The
// FIRST visit to /products still pays the real network round trip (that's
// what the backend fix above targets); every visit after that, within
// CACHE_TTL_MS, is instant because no request is made at all.
// ─────────────────────────────────────────────────────────────────────────────
let cachedProducts: Product[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 60_000; // catalog doesn't change second-to-second

// Dedupes concurrent callers (e.g. a hover-prefetch racing the page's own
// fetch) so only one network request goes out even if both fire close together.
let inFlightRequest: Promise<Product[]> | null = null;

async function loadProducts(): Promise<Product[]> {
  const isFresh = cachedProducts && Date.now() - cacheTimestamp < CACHE_TTL_MS;
  if (isFresh) return cachedProducts!;

  if (!inFlightRequest) {
    inFlightRequest = productApi.getProducts().finally(() => {
      inFlightRequest = null;
    });
  }

  const data = await inFlightRequest;
  cachedProducts = data;
  cacheTimestamp = Date.now();
  return data;
}

// Call this on hover/focus of the "Products" nav link to start the fetch
// before the user even clicks — by the time ProductsPage mounts, the cache
// may already be warm. Example: <Link onMouseEnter={prefetchProducts} ... />
export function prefetchProducts(): void {
  loadProducts().catch(() => {
    // Swallow here — the real fetch inside useProducts will surface the error.
  });
}

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>(cachedProducts ?? []);
  const [isLoading, setIsLoading] = useState<boolean>(!cachedProducts);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const isFresh = cachedProducts && Date.now() - cacheTimestamp < CACHE_TTL_MS;
    if (isFresh) {
      setProducts(cachedProducts!);
      setIsLoading(false);
      return () => { mountedRef.current = false; };
    }

    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        const data = await loadProducts();
        if (mountedRef.current) setProducts(data);
      } catch (err) {
        if (mountedRef.current) setError('Failed to load products');
        console.error(err);
      } finally {
        if (mountedRef.current) setIsLoading(false);
      }
    };

    fetchProducts();
    return () => { mountedRef.current = false; };
  }, []);

  const groupedProducts = useMemo(() => groupProductsByCategory(products), [products]);
  const categories = useMemo(() => extractUniqueCategories(products), [products]);

  return {
    products,
    groupedProducts,
    categories,
    isLoading,
    error
  };
};