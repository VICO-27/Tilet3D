import { useState, useCallback } from "react";
import { aiApi } from "../api/aiApi";
import { Product } from "../../products/types";

export function useAiSearch() {
  const [results, setResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const search = useCallback(async (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const data = await aiApi.aiSearch(trimmed);
      setResults(data.results || []);
    } catch {
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  return { results, isSearching, search };
}