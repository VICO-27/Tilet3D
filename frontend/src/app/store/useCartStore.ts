import { create } from 'zustand';
import apiClient from '@/shared/api/apiClient';

export interface CartItem {
  id: string;
  product_name: string;
  price: number;
  quantity: number;
  variant_details: any;
}

interface CartState {
  cartItems: CartItem[];
  loading: boolean;
  addedVariantIds: string[]; // variants added this session — drives the TikTok-style "added" icon
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
      const { data } = await apiClient.get('/cart/');
      set({ cartItems: data.items || [] });
    } catch (err) {
      console.error('Failed to fetch cart', err);
    } finally {
      set({ loading: false });
    }
  },

  addToCart: async (variantId: string, quantity: number = 1) => {
    if (!variantId) return false;

    // Optimistic: flip the icon instantly, don't wait on the network
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
      get().fetchCart(); // refresh in the background, doesn't block UI
      return true;
    } catch (err) {
      // Roll back on failure so the icon reverts to "+"
      set((state) => ({
        addedVariantIds: state.addedVariantIds.filter((id) => id !== variantId),
      }));
      console.error('Could not add to cart', err);
      return false;
    }
  },

  updateQuantity: async (itemId: string, quantity: number) => {
    // Optimistic update first
    set((state) => ({
      cartItems: state.cartItems.map((item) =>
        item.id === itemId ? { ...item, quantity } : item
      ),
    }));
    try {
      await apiClient.patch(`/cart/item/${itemId}/update/`, { quantity });
    } catch (err) {
      console.error('Update failed', err);
      get().fetchCart(); // resync with server truth on failure
    }
  },

  removeItem: async (itemId: string) => {
    const previous = get().cartItems;
    set((state) => ({
      cartItems: state.cartItems.filter((item) => item.id !== itemId),
    }));
    try {
      await apiClient.delete(`/cart/item/${itemId}/`);
    } catch (err) {
      console.error('Remove failed', err);
      set({ cartItems: previous }); // roll back
    }
  },

  cartTotal: () =>
    get().cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0),
}));