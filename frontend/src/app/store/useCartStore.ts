import { create } from 'zustand';
import apiClient from '@/shared/api/apiClient';

export interface CartProductInfo {
  id: string;
  name: string;
  slug: string;
}

export interface CartVariantInfo {
  id: string;
  name: string;
  sku: string;
  color: string;
  size: string;
  price: number | string;
  stock: number;
}

export interface CartItem {
  id: string;
  quantity: number;
  subtotal: number | string;
  product: CartProductInfo;
  variant: CartVariantInfo;
  image: string | null;
}

interface CartState {
  cartItems: CartItem[];
  loading: boolean;
  addedVariantIds: string[];
  isAdded: (variantId: string) => boolean;
  fetchCart: () => Promise<void>;
  addToCart: (variantId: string, quantity?: number) => Promise<boolean>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  cartTotal: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  cartItems: [],
  loading: false,
  addedVariantIds: [],

  isAdded: (variantId: string) => get().addedVariantIds.includes(variantId),

  fetchCart: async () => {
    set({ loading: true });
    try {
      const response = await apiClient.get('/cart/');
      const rawData = response.data;
      const items = Array.isArray(rawData) 
        ? rawData 
        : (rawData.items || rawData.cart_items || []);

      set({ cartItems: items });
    } catch (err) {
      console.error('Failed to fetch cart from backend', err);
    } finally {
      set({ loading: false });
    }
  },

  addToCart: async (variantId: string, quantity: number = 1) => {
    if (!variantId) return false;

    set((state) => ({
      addedVariantIds: state.addedVariantIds.includes(variantId)
        ? state.addedVariantIds
        : [...state.addedVariantIds, variantId],
    }));

    try {
      await apiClient.post('/cart/add/', {
        variant_id: variantId,
        quantity,
      });
      await get().fetchCart();
      return true;
    } catch (err) {
      set((state) => ({
        addedVariantIds: state.addedVariantIds.filter((id) => id !== variantId),
      }));
      console.error('Could not add to cart', err);
      return false;
    }
  },

  updateQuantity: async (itemId: string, quantity: number) => {
    set((state) => ({
      cartItems: state.cartItems.map((item) =>
        item.id === itemId ? { ...item, quantity } : item
      ),
    }));
    try {
      await apiClient.patch(`/cart/item/${itemId}/update/`, { quantity });
      await get().fetchCart();
    } catch (err) {
      console.error('Update failed', err);
      get().fetchCart();
    }
  },

  removeItem: async (itemId: string) => {
    const previous = get().cartItems;
    set((state) => ({
      cartItems: state.cartItems.filter((item) => item.id !== itemId),
    }));
    try {
      await apiClient.delete(`/cart/item/${itemId}/`);
      await get().fetchCart();
    } catch (err) {
      console.error('Remove failed', err);
      set({ cartItems: previous });
    }
  },

  cartTotal: () =>
    get().cartItems.reduce((acc, item) => acc + Number(item.variant?.price || 0) * item.quantity, 0),
}));