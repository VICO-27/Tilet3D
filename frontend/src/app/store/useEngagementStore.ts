import { create } from 'zustand';
import { useToastStore } from './useToastStore';

export interface ProductComment {
  id: string;
  user: string;
  user_email?: string;
  text: string;
  created_at: string;
}

const API_URL = "http://127.0.0.1:8000/api";
const ACCESS_TOKEN_KEY = "tilet3d_access_token";

interface EngagementState {
  loading: boolean;
  error: string | null;
  likedIdsList: string[];
  savedIdsList: string[];

  likedIds: () => string[];
  savedIds: () => string[];
  hasLiked: (productId: string) => boolean;
  isSaved: (productId: string) => boolean;
  toggleLike: (productId: string) => Promise<{ status: 'liked' | 'unliked' } | null>;
  toggleBookmark: (productId: string) => Promise<{ status: 'saved' | 'unsaved' } | null>;
  addComment: (productId: string, text: string) => Promise<ProductComment | null>;
  trackShare: (productId: string, platform?: string) => Promise<void>;
}

const getAuthHeaders = () => {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const useEngagementStore = create<EngagementState>((set, get) => ({
  loading: false,
  error: null,
  likedIdsList: [],
  savedIdsList: [],

  likedIds: () => get().likedIdsList,
  savedIds: () => get().savedIdsList,

  hasLiked: (productId: string) => get().likedIdsList.includes(productId),
  isSaved: (productId: string) => get().savedIdsList.includes(productId),

  toggleLike: async (productId: string) => {
    const wasLiked = get().likedIdsList.includes(productId);

    // Optimistic flip — instant visual feedback, no waiting on the network
    set((state) => ({
      likedIdsList: wasLiked
        ? state.likedIdsList.filter((id) => id !== productId)
        : [...state.likedIdsList, productId],
      error: null,
    }));

    try {
      const response = await fetch(`${API_URL}/products/like/`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ product_id: productId }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.detail || "Could not process like");
      }

      const result = await response.json();
      
      // Parse backend's boolean payload { liked: true/false }
      const isLikedNow = result.liked === true;

      // Reconcile with server truth in case of a race
      set((state) => {
        const has = state.likedIdsList.includes(productId);
        if (isLikedNow === has) return state;
        return {
          likedIdsList: isLikedNow
            ? [...state.likedIdsList, productId]
            : state.likedIdsList.filter((id) => id !== productId),
        };
      });

      return { status: isLikedNow ? "liked" : "unliked" };
    } catch (err: unknown) {
      // Roll back the optimistic update
      set((state) => ({
        likedIdsList: wasLiked
          ? [...state.likedIdsList, productId]
          : state.likedIdsList.filter((id) => id !== productId),
        error: err instanceof Error ? err.message : "Like failed",
      }));
      useToastStore.getState().show("Couldn't like this — try again", "error");
      return null;
    }
  },

  toggleBookmark: async (productId: string) => {
    const wasSaved = get().savedIdsList.includes(productId);

    // Optimistic flip first — this is what makes Save feel instant
    set((state) => ({
      savedIdsList: wasSaved
        ? state.savedIdsList.filter((id) => id !== productId)
        : [...state.savedIdsList, productId],
      error: null,
    }));

    try {
      const response = await fetch(`${API_URL}/products/bookmark/`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ product_id: productId }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.detail || "Could not process save action");
      }

      const result = await response.json();

      set((state) => {
        const isSavedNow = result.status === "saved";
        const has = state.savedIdsList.includes(productId);
        if (isSavedNow === has) return state;
        return {
          savedIdsList: isSavedNow
            ? [...state.savedIdsList, productId]
            : state.savedIdsList.filter((id) => id !== productId),
        };
      });

      return result;
    } catch (err: unknown) {
      console.error("Bookmark sync failed, keeping local state", err);
      return null;
    }
  },

  addComment: async (productId: string, text: string) => {
    if (!text.trim()) return null;
    set({ loading: true });
    try {
      const response = await fetch(`${API_URL}/products/comment/`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ product_id: productId, text: text.trim() }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Failed to add comment");

      useToastStore.getState().show("Comment posted");
      return data as ProductComment;
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : "Comment failed" });
      useToastStore.getState().show("Couldn't post comment — try again", "error");
      return null;
    } finally {
      set({ loading: false });
    }
  },

  trackShare: async (productId: string, platform: string = "link") => {
    try {
      await fetch(`${API_URL}/products/share/`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ product_id: productId, platform }),
      });
    } catch (err) {
      console.error("Share tracking failed", err);
    }
  },
}));