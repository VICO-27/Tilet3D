import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useToastStore } from './useToastStore';
import apiClient from '../../shared/api/apiClient';
import type { Product } from '../../features/products/types';

export interface ProductComment {
  id: string;
  user: string;
  user_email?: string;
  text: string;
  created_at: string;
}

interface EngagementState {
  loading: boolean;
  error: string | null;
  likedIdsList: string[];
  savedIdsList: string[];
  likedProducts: Product[];
  savedProducts: Product[];

  likedIds: () => string[];
  savedIds: () => string[];
  hasLiked: (productId: string) => boolean;
  isSaved: (productId: string) => boolean;
  fetchEngagements: () => Promise<void>;
  toggleLike: (productId: string) => Promise<{ status: 'liked' | 'unliked' } | null>;
  toggleBookmark: (productId: string) => Promise<{ status: 'saved' | 'unsaved' } | null>;
  addComment: (productId: string, text: string) => Promise<ProductComment | null>;
  trackShare: (productId: string, platform?: string) => Promise<void>;
  clearEngagements: () => void;
}

export const useEngagementStore = create<EngagementState>()(
  persist(
    (set, get) => ({
      loading: false,
      error: null,
      likedIdsList: [],
      savedIdsList: [],
      likedProducts: [],
      savedProducts: [],

      likedIds: () => get().likedIdsList,
      savedIds: () => get().savedIdsList,

      hasLiked: (productId: string) => get().likedIdsList.includes(productId),
      isSaved: (productId: string) => get().savedIdsList.includes(productId),

      clearEngagements: () => {
        set({
          likedIdsList: [],
          savedIdsList: [],
          likedProducts: [],
          savedProducts: [],
          loading: false,
          error: null,
        });
        try {
          localStorage.removeItem('tilet3d-engagement-storage');
        } catch {
          // ignore
        }
      },

      fetchEngagements: async () => {
        const token = localStorage.getItem('tilet3d_access_token');
        if (!token) {
          get().clearEngagements();
          return;
        }

        set({ loading: true });
        try {
          const [likedRes, savedRes] = await Promise.all([
            apiClient.get('/products/liked/').catch(() => ({ data: [] })),
            apiClient.get('/products/saved/').catch(() => ({ data: [] })),
          ]);

          const likedList: Product[] = Array.isArray(likedRes.data)
            ? likedRes.data
            : (likedRes.data?.results || []);
          const savedList: Product[] = Array.isArray(savedRes.data)
            ? savedRes.data
            : (savedRes.data?.results || []);

          const likedIds = likedList.map((p) => p.id);
          const savedIds = savedList.map((p) => p.id);

          set({
            likedProducts: likedList,
            savedProducts: savedList,
            likedIdsList: likedIds,
            savedIdsList: savedIds,
            loading: false,
            error: null,
          });
        } catch (err: unknown) {
          console.error('Failed to fetch engagements from server', err);
          set({ loading: false });
        }
      },

      toggleLike: async (productId: string) => {
        const wasLiked = get().likedIdsList.includes(productId);

        // Optimistic update
        set((state) => ({
          likedIdsList: wasLiked
            ? state.likedIdsList.filter((id) => id !== productId)
            : [...state.likedIdsList, productId],
          likedProducts: wasLiked
            ? state.likedProducts.filter((p) => p.id !== productId)
            : state.likedProducts,
          error: null,
        }));

        try {
          const response = await apiClient.post('/products/like/', { product_id: productId });
          const result = response.data;
          const isLikedNow = result.liked === true;

          set((state) => {
            const has = state.likedIdsList.includes(productId);
            if (isLikedNow === has) return state;
            return {
              likedIdsList: isLikedNow
                ? [...state.likedIdsList, productId]
                : state.likedIdsList.filter((id) => id !== productId),
            };
          });

          // Background sync to ensure full product list stays updated
          get().fetchEngagements();

          return { status: isLikedNow ? 'liked' : 'unliked' };
        } catch (err: unknown) {
          // Roll back optimistic update
          set((state) => ({
            likedIdsList: wasLiked
              ? [...state.likedIdsList, productId]
              : state.likedIdsList.filter((id) => id !== productId),
            error: err instanceof Error ? err.message : 'Like failed',
          }));
          useToastStore.getState().show("Couldn't like this, please try again", 'error');
          return null;
        }
      },

      toggleBookmark: async (productId: string) => {
        const wasSaved = get().savedIdsList.includes(productId);

        // Optimistic update
        set((state) => ({
          savedIdsList: wasSaved
            ? state.savedIdsList.filter((id) => id !== productId)
            : [...state.savedIdsList, productId],
          savedProducts: wasSaved
            ? state.savedProducts.filter((p) => p.id !== productId)
            : state.savedProducts,
          error: null,
        }));

        try {
          const response = await apiClient.post('/products/bookmark/', { product_id: productId });
          const result = response.data;
          const isSavedNow = result.status === 'saved';

          set((state) => {
            const has = state.savedIdsList.includes(productId);
            if (isSavedNow === has) return state;
            return {
              savedIdsList: isSavedNow
                ? [...state.savedIdsList, productId]
                : state.savedIdsList.filter((id) => id !== productId),
            };
          });

          // Background sync to ensure full product list stays updated
          get().fetchEngagements();

          return result;
        } catch (err: unknown) {
          // Roll back optimistic update
          set((state) => ({
            savedIdsList: wasSaved
              ? [...state.savedIdsList, productId]
              : state.savedIdsList.filter((id) => id !== productId),
            error: err instanceof Error ? err.message : 'Bookmark failed',
          }));
          useToastStore.getState().show("Couldn't save this, please try again", 'error');
          return null;
        }
      },

      addComment: async (productId: string, text: string) => {
        if (!text.trim()) return null;
        set({ loading: true });
        try {
          const response = await apiClient.post('/products/comment/', {
            product_id: productId,
            text: text.trim(),
          });
          const data = response.data;

          useToastStore.getState().show('Comment posted');
          return data as ProductComment;
        } catch (err: unknown) {
          set({ error: err instanceof Error ? err.message : 'Comment failed' });
          useToastStore.getState().show("Couldn't post comment, please try again", 'error');
          return null;
        } finally {
          set({ loading: false });
        }
      },

      trackShare: async (productId: string, platform: string = 'link') => {
        try {
          await apiClient.post('/products/share/', { product_id: productId, platform });
        } catch (err) {
          console.error('Share tracking failed', err);
        }
      },
    }),
    {
      name: 'tilet3d-engagement-storage',
      partialize: (state) => ({
        likedIdsList: state.likedIdsList,
        savedIdsList: state.savedIdsList,
        likedProducts: state.likedProducts,
        savedProducts: state.savedProducts,
      }),
      onRehydrateStorage: () => (state) => {
        if (!localStorage.getItem('tilet3d_access_token')) {
          state?.clearEngagements();
        } else {
          state?.fetchEngagements();
        }
      },
    }
  )
);