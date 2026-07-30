import { useState, useEffect } from 'react';
import { orderApi, OrderListType } from '../api/orderApi';
import { AxiosError } from 'axios';

export const useOrders = () => {
  const [orders, setOrders] = useState<OrderListType[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setIsLoading(true);
        const data = await orderApi.getOrders();
        setOrders(data);
      } catch (err) {
        // Check if the error is an authentication error (401)
        if (err instanceof AxiosError && err.response?.status === 401) {
          setError('session_expired'); // We will use this flag in the UI
        } else {
          setError('Failed to load orders.');
        }
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, []);

  return { orders, isLoading, error };
};