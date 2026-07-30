import apiClient from '@/shared/api/apiClient';

export type OrderStatus = "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export interface OrderListType {
  id: string;
  order_number: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  total: string | number; // Django Decimals often come as strings
  item_count: number;
  created_at: string;
}

export interface OrderItemType {
  id: number;
  product_name: string;
  variant_name: string;
  sku: string;
  color: string;
  size: string;
  price: string | number;
  quantity: number;
  subtotal: string | number;
}

export interface OrderDetailType {
  id: string;
  order_number: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  subtotal: string | number;
  shipping_fee: string | number;
  tax: string | number;
  discount: string | number;
  total: string | number;
  full_name: string;
  phone: string;
  region: string;
  city: string;
  sub_city: string;
  woreda: string;
  house_no: string;
  postal_code: string;
  note: string;
  items: OrderItemType[];
  created_at: string;
}

export const orderApi = {
  // GET /api/orders/
  getOrders: async (): Promise<OrderListType[]> => {
    const response = await apiClient.get<OrderListType[]>('/orders/');
    return response.data;
  },

  // GET /api/orders/:id/
  getOrderById: async (id: string): Promise<OrderDetailType> => {
    const response = await apiClient.get<OrderDetailType>(`/orders/${id}/`);
    return response.data;
  }
};