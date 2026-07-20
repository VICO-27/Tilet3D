import { useState, useEffect, useMemo } from 'react';
import { Product } from '../types';
import { productApi } from '../api/productApi';
import { groupProductsByCategory, extractUniqueCategories } from '../utils/productHelpers';

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        const data = await productApi.getProducts();
        setProducts(data);
      } catch (err) {
        setError('Failed to load products');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Derived data using useMemo for performance
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