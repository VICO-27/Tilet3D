import apiClient from "@/shared/api/apiClient";

export interface AddressData {
  id?: string;
  label: "home" | "work" | "other";
  full_name: string;
  phone_number: string;
  region?: string;
  city: string;
  sub_city?: string;
  woreda?: string;
  house_no?: string;
  is_default?: boolean;
}

export const addressService = {
  getAddresses: async () => {
    // Changed from "/api/auth/addresses/" to "/auth/addresses/"
    const response = await apiClient.get<AddressData[]>("/auth/addresses/");
    return response.data;
  },

  createAddress: async (data: AddressData) => {
    const response = await apiClient.post<AddressData>("/auth/addresses/", data);
    return response.data;
  },

  updateAddress: async (id: string, data: Partial<AddressData>) => {
    const response = await apiClient.patch<AddressData>(`/auth/addresses/${id}/`, data);
    return response.data;
  },

  deleteAddress: async (id: string) => {
    await apiClient.delete(`/auth/addresses/${id}/`);
  },
};