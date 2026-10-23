import apiClient from "@/shared/api/apiClient";
import type {
  AdminOverviewResponse,
  AdminCategory,
  AdminCategoryDetail,
  AdminProduct,
  AdminProductListResponse,
  AdminProductFormData,
  AdminOrderListResponse,
  AdminOrderDetail,
  AdminInventoryVariant,
  AdminInventoryListResponse,
  AdminCustomer,
  AdminCustomerDetail,
  AdminCustomerListResponse,
  AdminPaymentListResponse,
  AdminAnalyticsResponse,
  AdminAuditLogListResponse,
  AdminSettingsResponse,
} from "../types/admin";

class AdminApi {
  /**
   * Fetches the operational admin overview metrics.
   * Requires staff authorization (HTTP 403 returned if non-staff).
   */
  async getOverview(): Promise<AdminOverviewResponse> {
    const response = await apiClient.get<AdminOverviewResponse>("/admin/overview/");
    return response.data;
  }

  /**
   * Fetches all categories for product assignment.
   */
  async getCategories(): Promise<AdminCategory[]> {
    const response = await apiClient.get<AdminCategory[]>("/admin/categories/");
    return response.data;
  }

  /**
   * Fetches detailed categories with product counts.
   */
  async getCategoriesDetail(): Promise<AdminCategoryDetail[]> {
    const response = await apiClient.get<AdminCategoryDetail[]>("/admin/categories/");
    return response.data;
  }

  /**
   * Creates a new category.
   */
  async createCategory(data: { name: string; description?: string }): Promise<AdminCategoryDetail> {
    const response = await apiClient.post<AdminCategoryDetail>("/admin/categories/", data);
    return response.data;
  }

  /**
   * Updates an existing category.
   */
  async updateCategory(
    id: string,
    data: Partial<AdminCategoryDetail>
  ): Promise<AdminCategoryDetail> {
    const response = await apiClient.patch<AdminCategoryDetail>(`/admin/categories/${id}/`, data);
    return response.data;
  }

  /**
   * Fetches paginated products with search, category, and status filters.
   */
  async getProducts(params?: {
    page?: number;
    search?: string;
    category?: string;
    status?: string;
  }): Promise<AdminProductListResponse> {
    const query = new URLSearchParams();
    if (params?.page) query.append("page", String(params.page));
    if (params?.search) query.append("search", params.search.trim());
    if (params?.category) query.append("category", params.category);
    if (params?.status) query.append("status", params.status);

    const qs = query.toString();
    const url = qs ? `/admin/products/?${qs}` : "/admin/products/";
    const response = await apiClient.get<AdminProductListResponse>(url);
    return response.data;
  }

  /**
   * Fetches single product details with variants and media.
   */
  async getProductById(id: string): Promise<AdminProduct> {
    const response = await apiClient.get<AdminProduct>(`/admin/products/${id}/`);
    return response.data;
  }

  /**
   * Creates a new product with default variant and optional media.
   */
  async createProduct(
    data: AdminProductFormData | FormData
  ): Promise<AdminProduct> {
    const isFormData = data instanceof FormData;
    const response = await apiClient.post<AdminProduct>("/admin/products/", data, {
      headers: isFormData ? { "Content-Type": "multipart/form-data" } : undefined,
    });
    return response.data;
  }

  /**
   * Updates an existing product and its primary variant.
   */
  async updateProduct(
    id: string,
    data: Partial<AdminProductFormData> | FormData
  ): Promise<AdminProduct> {
    const isFormData = data instanceof FormData;
    const response = await apiClient.patch<AdminProduct>(`/admin/products/${id}/`, data, {
      headers: isFormData ? { "Content-Type": "multipart/form-data" } : undefined,
    });
    return response.data;
  }

  /**
   * Toggles product active/deactive status safely without deleting records.
   */
  async toggleProductActive(
    id: string
  ): Promise<{ id: string; name: string; is_active: boolean; message: string }> {
    const response = await apiClient.post<{
      id: string;
      name: string;
      is_active: boolean;
      message: string;
    }>(`/admin/products/${id}/toggle-active/`);
    return response.data;
  }

  /**
   * Fetches paginated orders with search and status filters.
   */
  async getOrders(params?: {
    page?: number;
    search?: string;
    status?: string;
    payment_status?: string;
  }): Promise<AdminOrderListResponse> {
    const query = new URLSearchParams();
    if (params?.page) query.append("page", String(params.page));
    if (params?.search) query.append("search", params.search.trim());
    if (params?.status) query.append("status", params.status);
    if (params?.payment_status) query.append("payment_status", params.payment_status);

    const qs = query.toString();
    const url = qs ? `/admin/orders/?${qs}` : "/admin/orders/";
    const response = await apiClient.get<AdminOrderListResponse>(url);
    return response.data;
  }

  /**
   * Fetches single order details including line items, delivery address, and payment info.
   */
  async getOrderById(id: string): Promise<AdminOrderDetail> {
    const response = await apiClient.get<AdminOrderDetail>(`/admin/orders/${id}/`);
    return response.data;
  }

  /**
   * Transitions an order's fulfillment status via the backend OrderLifecycle service.
   */
  async transitionOrderStatus(
    id: string,
    status: string,
    reason?: string
  ): Promise<{ message: string; order: AdminOrderDetail }> {
    const response = await apiClient.post<{ message: string; order: AdminOrderDetail }>(
      `/admin/orders/${id}/transition/`,
      { status, reason }
    );
    return response.data;
  }

  /**
   * Fetches paginated inventory variants with stock details.
   */
  async getInventory(params?: {
    page?: number;
    search?: string;
    status?: string;
  }): Promise<AdminInventoryListResponse> {
    const query = new URLSearchParams();
    if (params?.page) query.append("page", String(params.page));
    if (params?.search) query.append("search", params.search.trim());
    if (params?.status) query.append("status", params.status);

    const qs = query.toString();
    const url = qs ? `/admin/inventory/?${qs}` : "/admin/inventory/";
    const response = await apiClient.get<AdminInventoryListResponse>(url);
    return response.data;
  }

  /**
   * Adjusts physical stock for a variant safely.
   */
  async adjustInventoryStock(
    id: string,
    stock: number,
    reason?: string
  ): Promise<{ message: string; variant: AdminInventoryVariant }> {
    const response = await apiClient.post<{ message: string; variant: AdminInventoryVariant }>(
      `/admin/inventory/${id}/adjust/`,
      { stock, reason }
    );
    return response.data;
  }

  /**
   * Fetches paginated customer directory.
   */
  async getCustomers(params?: {
    page?: number;
    search?: string;
  }): Promise<AdminCustomerListResponse> {
    const query = new URLSearchParams();
    if (params?.page) query.append("page", String(params.page));
    if (params?.search) query.append("search", params.search.trim());

    const qs = query.toString();
    const url = qs ? `/admin/customers/?${qs}` : "/admin/customers/";
    const response = await apiClient.get<AdminCustomerListResponse>(url);
    return response.data;
  }

  /**
   * Fetches single customer details with address and order history.
   */
  async getCustomerById(id: string): Promise<AdminCustomerDetail> {
    const response = await apiClient.get<AdminCustomerDetail>(`/admin/customers/${id}/`);
    return response.data;
  }

  /**
   * Fetches read-only payments log.
   */
  async getPayments(params?: {
    page?: number;
    search?: string;
    status?: string;
  }): Promise<AdminPaymentListResponse> {
    const query = new URLSearchParams();
    if (params?.page) query.append("page", String(params.page));
    if (params?.search) query.append("search", params.search.trim());
    if (params?.status) query.append("status", params.status);

    const qs = query.toString();
    const url = qs ? `/admin/payments/?${qs}` : "/admin/payments/";
    const response = await apiClient.get<AdminPaymentListResponse>(url);
    return response.data;
  }

  /**
   * Fetches aggregate analytics.
   */
  async getAnalytics(): Promise<AdminAnalyticsResponse> {
    const response = await apiClient.get<AdminAnalyticsResponse>("/admin/analytics/");
    return response.data;
  }

  /**
   * Fetches read-only security audit logs.
   */
  async getAuditLogs(params?: {
    page?: number;
    search?: string;
  }): Promise<AdminAuditLogListResponse> {
    const query = new URLSearchParams();
    if (params?.page) query.append("page", String(params.page));
    if (params?.search) query.append("search", params.search.trim());

    const qs = query.toString();
    const url = qs ? `/admin/audit-logs/?${qs}` : "/admin/audit-logs/";
    const response = await apiClient.get<AdminAuditLogListResponse>(url);
    return response.data;
  }

  /**
   * Fetches system configuration and telemetry without secrets.
   */
  async getSettings(): Promise<AdminSettingsResponse> {
    const response = await apiClient.get<AdminSettingsResponse>("/admin/settings/");
    return response.data;
  }

  /**
   * Updates platform operational and security policies (e.g. OTP verification).
   */
  async updateSettings(data: { otp_verification_enabled: boolean }): Promise<AdminSettingsResponse> {
    const response = await apiClient.patch<AdminSettingsResponse>("/admin/settings/", data);
    return response.data;
  }
}

export const adminApi = new AdminApi();
export default adminApi;

