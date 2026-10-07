// frontend/src/features/products/hooks/useProducts.ts
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Product } from '../types';
import { productApi } from '../api/productApi';
import { groupProductsByCategory, extractUniqueCategories } from '../utils/productHelpers';

let cachedProducts: Product[] | null = null;
let cachedNextPage: number | null = 1;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 60_000; 

let inFlightRequest: Promise<{ results: Product[], next: string | null }> | null = null;

async function loadProducts(page: number): Promise<{ results: Product[], next: string | null }> {
  // If we want page 1 and it's fresh, return cache
  if (page === 1) {
    const isFresh = cachedProducts && Date.now() - cacheTimestamp < CACHE_TTL_MS;
    if (isFresh) return { results: cachedProducts!, next: cachedNextPage ? String(cachedNextPage) : null };
  }

  if (!inFlightRequest) {
    inFlightRequest = productApi.getProducts(undefined, page).finally(() => {
      inFlightRequest = null;
    });
  }

  const data = await inFlightRequest;
  
  if (page === 1) {
      cachedProducts = data.results;
      cacheTimestamp = Date.now();
  } else if (cachedProducts) {
      // Append for subsequent pages
      const newIds = new Set(data.results.map(p => p.id));
      const filteredCache = cachedProducts.filter(p => !newIds.has(p.id));
      cachedProducts = [...filteredCache, ...data.results];
  }
  
  cachedNextPage = data.next ? page + 1 : null;
  return data;
}

export function prefetchProducts(): void {
  loadProducts(1).catch(() => {});
}

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>(cachedProducts ?? []);
  const [isLoading, setIsLoading] = useState<boolean>(!cachedProducts);
  const [isFetchingNext, setIsFetchingNext] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [nextPage, setNextPage] = useState<number | null>(cachedNextPage);
  const mountedRef = useRef(true);

  const fetchProducts = useCallback(async (page: number) => {
    try {
      if (page === 1) setIsLoading(true);
      else setIsFetchingNext(true);
      
      const data = await loadProducts(page);
      
      if (mountedRef.current) {
        if (page === 1) {
            setProducts(data.results);
        } else {
            setProducts(prev => {
                const newIds = new Set(data.results.map(p => p.id));
                const filtered = prev.filter(p => !newIds.has(p.id));
                return [...filtered, ...data.results];
            });
        }
        setNextPage(data.next ? page + 1 : null);
      }
    } catch (err) {
      if (mountedRef.current) setError('Failed to load products');
      console.error(err);
    } finally {
      if (mountedRef.current) {
          setIsLoading(false);
          setIsFetchingNext(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    const isFresh = cachedProducts && Date.now() - cacheTimestamp < CACHE_TTL_MS;
    if (isFresh) {
      setProducts(cachedProducts!);
      setNextPage(cachedNextPage);
      setIsLoading(false);
      return () => { mountedRef.current = false; };
    }

    fetchProducts(1);
    return () => { mountedRef.current = false; };
  }, [fetchProducts]);
  
  const loadMore = useCallback(() => {
      if (nextPage && !isFetchingNext && !isLoading) {
          fetchProducts(nextPage);
      }
  }, [nextPage, isFetchingNext, isLoading, fetchProducts]);

  const groupedProducts = useMemo(() => groupProductsByCategory(products), [products]);
  const categories = useMemo(() => extractUniqueCategories(products), [products]);

  return {
    products,
    groupedProducts,
    categories,
    isLoading,
    isFetchingNext,
    hasNextPage: !!nextPage,
    loadMore,
    error
  };
};