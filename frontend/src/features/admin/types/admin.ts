export interface AdminMetrics {
  total_revenue: string;
  total_orders: number;
  paid_orders: number;
  pending_orders: number;
  total_products: number;
  active_products: number;
  total_customers: number;
  low_stock_variants: number;
  out_of_stock_variants: number;
}

export interface OrdersByStatus {
  pending: number;
  confirmed: number;
  processing: number;
  shipped: number;
  delivered: number;
  cancelled: number;
}

export interface AdminOverviewResponse {
  metrics: AdminMetrics;
  orders_by_status: OrdersByStatus;
}

export interface AdminCategory {
  id: string;
  name: string;
  slug: string;
}

export interface AdminProductVariantSummary {
  id: string;
  sku: string;
  price: string;
  stock: number;
  color?: string;
  size?: string;
}

export interface AdminProduct {
  id: string;
  name: string;
  slug: string;
  description: string;
  brand: string;
  category: AdminCategory | null;
  is_active: boolean;
  is_featured: boolean;
  display_order: number;
  price: string;
  total_stock: number;
  variants_count: number;
  primary_image: string | null;
  default_variant?: AdminProductVariantSummary | null;
  created_at: string;
  updated_at: string;
}

export interface AdminProductListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: AdminProduct[];
}

export interface AdminProductFormData {
  name: string;
  category_id: string;
  description?: string;
  brand?: string;
  price: string | number;
  stock?: number;
  sku?: string;
  color?: string;
  size?: string;
  is_active?: boolean;
  is_featured?: boolean;
  display_order?: number;
  image_file?: File | null;
  image_url?: string;
}

export interface AdminOrderItem {
  id: string;
  product_name: string;
  variant_name: string;
  sku: string;
  color: string;
  size: string;
  price: string;
  quantity: number;
  subtotal: string;
}

export interface AdminOrderPayment {
  id: string;
  status: string;
  provider: string;
  amount: string;
  currency: string;
  transaction_id?: string | null;
  checkout_url?: string | null;
  created_at: string;
}

export interface AdminOrderListItem {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  total: string;
  subtotal: string;
  shipping_fee: string;
  full_name: string;
  customer_email: string;
  item_count: number;
  allowed_transitions: string[];
  created_at: string;
  updated_at: string;
}

export interface AdminOrderDetail extends AdminOrderListItem {
  customer_id: string;
  phone: string;
  region: string;
  city: string;
  sub_city: string;
  woreda: string;
  house_no: string;
  postal_code: string;
  note: string;
  tax: string;
  discount: string;
  avatar_snapshot?: Record<string, unknown> | null;
  items: AdminOrderItem[];
  payment?: AdminOrderPayment | null;
}

export interface AdminOrderListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: AdminOrderListItem[];
}

export interface AdminCategoryDetail {
  id: string;
  name: string;
  slug: string;
  description: string;
  is_active: boolean;
  display_order: number;
  product_count: number;
  created_at: string;
  updated_at: string;
}

export interface AdminInventoryVariant {
  id: string;
  product_id: string;
  product_name: string;
  name: string;
  sku: string;
  color: string;
  size: string;
  price: string;
  stock: number;
  reserved_stock: number;
  available_stock: number;
  is_active: boolean;
  updated_at: string;
}

export interface AdminInventoryListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: AdminInventoryVariant[];
}

export interface AdminCustomer {
  id: string;
  email: string;
  full_name: string;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
  orders_count: number;
  total_spent: string;
}

export interface AdminCustomerAddress {
  id: string;
  label: string;
  full_name: string;
  phone_number: string;
  region: string;
  city: string;
  sub_city: string;
  woreda: string;
  house_no: string;
  is_default: boolean;
}

export interface AdminCustomerRecentOrder {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  total: string;
  created_at: string;
}

export interface AdminCustomerDetail extends AdminCustomer {
  addresses: AdminCustomerAddress[];
  recent_orders: AdminCustomerRecentOrder[];
}

export interface AdminCustomerListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: AdminCustomer[];
}

export interface AdminPaymentItem {
  id: string;
  order_id: string;
  order_number: string;
  user_email: string;
  amount: string;
  currency: string;
  provider: string;
  status: string;
  transaction_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminPaymentListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: AdminPaymentItem[];
}

export interface AdminTopProduct {
  product_name: string;
  units_sold: number;
  revenue: string;
}

export interface AdminAnalyticsFinancials {
  total_revenue: string;
  average_order_value: string;
  currency: string;
  paid_orders_count: number;
}

export interface AdminInventoryHealth {
  total_variants: number;
  in_stock: number;
  low_stock: number;
  out_of_stock: number;
}

export interface AdminAnalyticsResponse {
  financials: AdminAnalyticsFinancials;
  orders_by_status: Record<string, number>;
  top_products: AdminTopProduct[];
  inventory_health: AdminInventoryHealth;
}

export interface AdminAuditLogItem {
  id: number;
  user_email: string;
  event: string;
  ip_address: string | null;
  user_agent: string;
  created_at: string;
}

export interface AdminAuditLogListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: AdminAuditLogItem[];
}

export interface AdminSettingsResponse {
  platform: {
    app_name: string;
    version: string;
    environment: string;
    debug_mode: boolean;
    python_version: string;
  };
  integrations: {
    database: string;
    media_storage: string;
    payment_gateway: string;
    email_delivery: string;
    auth_system: string;
    fitting_room: string;
  };
  operational_policy: {
    token_refresh_rotation: string;
    currency: string;
    admin_role_enforcement: string;
    payment_status_mutation: string;
  };
  security_policy?: {
    otp_verification_enabled: boolean;
    updated_at: string | null;
  };
  server_time: string;
}

