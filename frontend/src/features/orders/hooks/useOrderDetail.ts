import { useState, useEffect } from 'react';
import { orderApi, OrderDetailType } from '../api/orderApi';

export const useOrderDetail = (id: string | undefined) => {
  const [order, setOrder] = useState<OrderDetailType | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    
    const fetchOrder = async () => {
      try {
        setIsLoading(true);
        const data = await orderApi.getOrderById(id);
        setOrder(data);
      } catch (err) {
        setError('Failed to load order details');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  return { order, isLoading, error };
};