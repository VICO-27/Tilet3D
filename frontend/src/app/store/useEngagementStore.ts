import { useCallback, useState } from "react";

/**
 * Tilet3D Engagement Store
 * Connects UI interactions (Likes, Comments, Shares) to the Django API.
 */

export interface ProductComment {
  id: string;
  user: string; // Updated from 'author' to match standard Django user relation
  text: string;
  created_at: string;
}

const API_URL = "http://127.0.0.1:8000/api";
const ACCESS_TOKEN_KEY = "tilet3d_access_token";

export const useEngagementStore = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Helper to get headers with JWT
  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }, []);

  const toggleLike = useCallback(
    async (productId: string) => {
      setLoading(true);
      try {
        const response = await fetch(`${API_URL}/products/like/`, {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({ product_id: productId }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.detail || "Could not process like");
        }

        const result = await response.json();
        return result; // Usually returns { status: 'liked' | 'unliked' }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Like failed");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [getAuthHeaders]
  );

  const addComment = useCallback(
    async (productId: string, text: string) => {
      if (!text.trim()) return null;
      setLoading(true);
      try {
        const response = await fetch(`${API_URL}/products/comment/`, {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({ 
            product: productId, 
            text: text.trim() 
          }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.detail || "Failed to add comment");

        return data as ProductComment;
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Comment failed");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [getAuthHeaders]
  );

  const trackShare = useCallback(
    async (productId: string, platform: string = "link") => {
      try {
        await fetch(`${API_URL}/products/share/`, {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({ 
            product: productId,
            platform: platform 
          }),
        });
      } catch (err) {
        // Sharing analytics failures are usually silent to the user
        console.error("Share tracking failed", err);
      }
    },
    [getAuthHeaders]
  );

  return {
    loading,
    error,
    toggleLike,
    addComment,
    trackShare,
  };
};