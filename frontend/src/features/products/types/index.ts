export interface ProductMedia {
  id: string;               // ADD THIS LINE
  media_type: 'image' | 'video';
  file: string;
  is_primary: boolean;
  display_order: number;
}

export interface ProductVariant {
  id: string;
  name: string;
  sku: string;
  color: string;
  size: string;
  price: string; 
  available_stock: number;
  measurements: Record<string, string | number>; // Replaced 'any' with specific record type
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  brand: string;
  is_featured: boolean;
  category_name: string;
  media: ProductMedia[];
  variants: ProductVariant[];
  like_count: number;
  comment_count: number;
  is_liked: boolean;
}


export interface ProductCommentDTO {
  id: string;
  product: string;
  user: string;
  user_email: string;
  text: string;
  created_at: string;
}

export interface ToggleLikePayload { product_id: string; }
export interface AddCommentPayload { product_id: string; text: string; }
export interface ShareProductPayload { product_id: string; platform: string; }