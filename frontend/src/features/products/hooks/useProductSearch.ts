import { useState, useEffect, useCallback, useRef } from 'react';
import { Product } from '../types';
import apiClient from '@/shared/api/apiClient';

interface SearchResult {
  count: number;
  next: string | null;
  previous: string | null;
  results: Product[];
}

// Memory cache to make filtering feel instantaneous when returning to a previous filter state
const searchCache = new Map<string, SearchResult>();

export const useProductSearch = (searchParams: URLSearchParams) => {
  const [data, setData] = useState<SearchResult | null>(null);
  const [results, setResults] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingNext, setIsFetchingNext] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextPage, setNextPage] = useState<number | null>(null);

  const searchParamsString = searchParams.toString();
  const mountedRef = useRef(true);

  // When search filters change, reset and fetch page 1
  useEffect(() => {
    mountedRef.current = true;
    
    const hasFilters = Array.from(searchParams.entries()).length > 0;
    if (!hasFilters) {
      setData(null);
      setResults([]);
      setNextPage(null);
      return;
    }

    // FAST PATH: If we have this exact filter combination cached, use it instantly!
    if (searchCache.has(searchParamsString)) {
      const cached = searchCache.get(searchParamsString)!;
      setData(cached);
      setResults(cached.results);
      const nextMatch = cached.next?.match(/page=(\d+)/);
      setNextPage(nextMatch ? parseInt(nextMatch[1], 10) : (cached.next ? 2 : null));
      setIsLoading(false);
      return;
    }

    const abortController = new AbortController();

    const fetchSearch = async () => {
      try {
        setIsLoading(true);
        const params = new URLSearchParams(searchParams);
        params.delete('page');
        
        const response = await apiClient.get<SearchResult>(`/products/search/?${params.toString()}`, {
          signal: abortController.signal
        });
        
        if (mountedRef.current) {
            searchCache.set(searchParamsString, response.data); // Save to cache
            setData(response.data);
            setResults(response.data.results);
            const nextMatch = response.data.next?.match(/page=(\d+)/);
            setNextPage(nextMatch ? parseInt(nextMatch[1], 10) : (response.data.next ? 2 : null));
            setError(null);
        }
      } catch (err: any) {
        if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') {
           return;
        }
        console.error('Search failed:', err);
        if (mountedRef.current) setError('Failed to fetch search results.');
      } finally {
        if (mountedRef.current) setIsLoading(false);
      }
    };

    // Removed artificial 150ms debounce delay to make the filter trigger immediately
    fetchSearch();

    return () => {
        abortController.abort();
        mountedRef.current = false;
    };
  }, [searchParamsString]); // Depend on stringified params

  const loadMore = useCallback(async () => {
      if (!nextPage || isFetchingNext || isLoading) return;
      
      try {
          setIsFetchingNext(true);
          const params = new URLSearchParams(searchParamsString);
          params.set('page', nextPage.toString());
          
          const response = await apiClient.get<SearchResult>(`/products/search/?${params.toString()}`);
          if (mountedRef.current) {
              setResults(prev => {
                  const newIds = new Set(response.data.results.map(p => p.id));
                  const filtered = prev.filter(p => !newIds.has(p.id));
                  return [...filtered, ...response.data.results];
              });
              
              const nextMatch = response.data.next?.match(/page=(\d+)/);
              setNextPage(nextMatch ? parseInt(nextMatch[1], 10) : (response.data.next ? nextPage + 1 : null));
          }
      } catch (err) {
          console.error('Load more failed:', err);
      } finally {
          if (mountedRef.current) setIsFetchingNext(false);
      }
  }, [nextPage, isFetchingNext, isLoading, searchParamsString]);

  return {
    data: data ? { ...data, results } : null,
    isLoading,
    isFetchingNext,
    hasNextPage: !!nextPage,
    loadMore,
    error,
    hasFilters: Array.from(searchParams.entries()).length > 0
  };
};
