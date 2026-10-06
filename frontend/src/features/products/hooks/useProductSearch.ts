import { useState, useEffect } from 'react';
import { Product } from '../types';
import apiClient from '@/shared/api/apiClient';

interface SearchResult {
  count: number;
  next: string | null;
  previous: string | null;
  results: Product[];
}

export const useProductSearch = (searchParams: URLSearchParams) => {
  const [data, setData] = useState<SearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if any search or filter params are present
    const hasFilters = Array.from(searchParams.entries()).length > 0;
    
    if (!hasFilters) {
      setData(null);
      return;
    }

    const fetchSearch = async () => {
      try {
        setIsLoading(true);
        // We use the new paginated unified endpoint
        const response = await apiClient.get<SearchResult>(`/products/search/?${searchParams.toString()}`);
        setData(response.data);
        setError(null);
      } catch (err) {
        console.error('Search failed:', err);
        setError('Failed to fetch search results.');
      } finally {
        setIsLoading(false);
      }
    };

    const debounceId = setTimeout(() => {
      fetchSearch();
    }, 300);

    return () => clearTimeout(debounceId);
  }, [searchParams]);

  return {
    data,
    isLoading,
    error,
    hasFilters: Array.from(searchParams.entries()).length > 0
  };
};
