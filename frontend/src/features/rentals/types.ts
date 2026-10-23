export type PricingMode = 'package' | 'flexible_daily';
export type FulfillmentMethod = 'shop_pickup' | 'delivery';

export type RentalBookingStatus =
  | 'pending_payment'
  | 'confirmed'
  | 'ready_for_pickup'
  | 'out_on_rental'
  | 'returned_pending_inspection'
  | 'completed'
  | 'cancelled'
  | 'overdue'
  | 'damage_review';

export type RentalPaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type DepositStatus = 'held' | 'released' | 'partially_refunded' | 'forfeited' | 'waived';
export type GarmentCondition = 'pristine' | 'minor_wear' | 'repairable_damage' | 'severe_damage' | 'lost';

export interface RentalPackage {
  id: string;
  name: string;
  duration_days: number;
  price: string | number;
  is_active: boolean;
  display_order: number;
}

export interface RentalProductConfig {
  id: string;
  is_rental_enabled: boolean;
  rental_inventory_count: number;
  daily_rate: string | number;
  security_deposit: string | number;
  delivery_fee: string | number;
  min_rental_days: number;
  max_rental_days: number;
  cleaning_buffer_days: number;
  terms_and_conditions: string;
  packages: RentalPackage[];
}

export interface RentalQuoteRequest {
  product_id: string;
  variant_id?: string | null;
  pricing_mode: PricingMode;
  start_date: string;
  end_date?: string | null;
  package_id?: string | null;
  quantity?: number;
  fulfillment_method?: FulfillmentMethod;
}

export interface RentalQuoteResponse {
  pricing_mode: PricingMode;
  duration_days: number;
  start_date: string;
  end_date: string;
  daily_rate: number;
  package_id?: string | null;
  package_name?: string | null;
  rental_subtotal: number;
  deposit_amount: number;
  delivery_fee: number;
  total_amount: number;
  currency: string;
}

export interface RentalBookingCreatePayload {
  product_id: string;
  variant_id?: string | null;
  pricing_mode: PricingMode;
  start_date: string;
  end_date?: string | null;
  package_id?: string | null;
  quantity: number;
  fulfillment_method: FulfillmentMethod;
  full_name: string;
  phone: string;
  address_line?: string;
  city?: string;
  special_instructions?: string;
}

export interface RentalBookingCreateResponse {
  booking_id: string;
  booking_reference: string;
  total_amount: string;
  payment_id?: string;
  checkout_url?: string;
  error?: string;
}

export interface RentalInspection {
  id: string;
  condition: GarmentCondition;
  notes: string;
  assessed_damage_fee: string | number;
  deposit_action: string;
  inspected_by?: string;
  inspected_by_name?: string;
  inspected_at: string;
}

export interface RentalBooking {
  id: string;
  booking_reference: string;
  product_name: string;
  product_image?: string | null;
  variant_name?: string | null;
  start_date: string;
  end_date: string;
  duration_days: number;
  quantity: number;
  pricing_mode: PricingMode;
  daily_rate_snapshot: string | number;
  rental_subtotal: string | number;
  deposit_amount: string | number;
  delivery_fee: string | number;
  late_fee: string | number;
  damage_fee: string | number;
  total_amount: string | number;
  status: RentalBookingStatus;
  payment_status: RentalPaymentStatus;
  deposit_status: DepositStatus;
  deposit_refunded_amount: string | number;
  fulfillment_method: FulfillmentMethod;
  full_name: string;
  phone: string;
  address_line?: string;
  city?: string;
  special_instructions?: string;
  reservation_expires_at?: string | null;
  picked_up_at?: string | null;
  returned_at?: string | null;
  inspection?: RentalInspection | null;
  is_overdue: boolean;
  internal_notes?: string;
  created_at: string;
  updated_at: string;
  customer_name?: string;
  customer_email?: string;
}

export interface AdminRentalMetrics {
  total_rentals: number;
  active_rentals: number;
  overdue_count: number;
  pending_inspection: number;
  deposits_held_etb: string;
  rental_revenue_etb: string;
}
