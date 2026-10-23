import apiClient from '@/shared/api/apiClient';
import {
  RentalProductConfig,
  RentalQuoteRequest,
  RentalQuoteResponse,
  RentalBookingCreatePayload,
  RentalBookingCreateResponse,
  RentalBooking,
  AdminRentalMetrics,
} from '../types';

export const rentalApi = {
  // Public / Customer
  getProductRentalConfig: async (productId: string): Promise<RentalProductConfig> => {
    const response = await apiClient.get<RentalProductConfig>(`/rentals/products/${productId}/`);
    return response.data;
  },

  checkAvailability: async (
    productId: string,
    startDate: string,
    endDate: string,
    variantId?: string | null,
    quantity = 1
  ): Promise<{ is_available: boolean; available_count: number; message: string }> => {
    const params = new URLSearchParams({
      product_id: productId,
      start_date: startDate,
      end_date: endDate,
      quantity: quantity.toString(),
    });
    if (variantId) params.append('variant_id', variantId);

    const response = await apiClient.get(`/rentals/availability/?${params.toString()}`);
    return response.data;
  },

  getQuote: async (payload: RentalQuoteRequest): Promise<RentalQuoteResponse> => {
    const response = await apiClient.post<RentalQuoteResponse>('/rentals/quote/', payload);
    return response.data;
  },

  createBooking: async (payload: RentalBookingCreatePayload): Promise<RentalBookingCreateResponse> => {
    const response = await apiClient.post<RentalBookingCreateResponse>('/rentals/bookings/', payload);
    return response.data;
  },

  getMyRentals: async (): Promise<{ count: number; results: RentalBooking[] }> => {
    const response = await apiClient.get<{ count: number; results: RentalBooking[] }>('/rentals/my-rentals/');
    return response.data;
  },

  getMyRentalDetail: async (id: string): Promise<RentalBooking> => {
    const response = await apiClient.get<RentalBooking>(`/rentals/my-rentals/${id}/`);
    return response.data;
  },

  // Admin
  getAdminMetrics: async (): Promise<AdminRentalMetrics> => {
    const response = await apiClient.get<AdminRentalMetrics>('/rentals/admin/metrics/');
    return response.data;
  },

  getAdminBookings: async (params?: {
    status?: string;
    payment_status?: string;
    deposit_status?: string;
    fulfillment_method?: string;
    search?: string;
    page?: number;
  }): Promise<{ count: number; results: RentalBooking[] }> => {
    const response = await apiClient.get<{ count: number; results: RentalBooking[] }>('/rentals/admin/bookings/', {
      params,
    });
    return response.data;
  },

  getAdminBookingDetail: async (id: string): Promise<RentalBooking> => {
    const response = await apiClient.get<RentalBooking>(`/rentals/admin/bookings/${id}/`);
    return response.data;
  },

  adminTransitionBooking: async (
    id: string,
    action: 'ready_for_pickup' | 'handover' | 'record_return' | 'cancel'
  ): Promise<RentalBooking> => {
    const response = await apiClient.post<RentalBooking>(`/rentals/admin/bookings/${id}/transition/`, { action });
    return response.data;
  },

  adminInspectBooking: async (
    id: string,
    data: {
      condition: string;
      notes: string;
      assessed_damage_fee: number;
      deposit_action: string;
    }
  ): Promise<RentalBooking> => {
    const response = await apiClient.post<RentalBooking>(`/rentals/admin/bookings/${id}/inspect/`, data);
    return response.data;
  },

  updateAdminConfig: async (
    productId: string,
    data: Partial<RentalProductConfig>
  ): Promise<RentalProductConfig> => {
    const response = await apiClient.put<RentalProductConfig>(`/rentals/admin/config/${productId}/`, data);
    return response.data;
  },
};
