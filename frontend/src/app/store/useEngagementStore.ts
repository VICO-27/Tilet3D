import { useCallback, useState } from "react";

/**
 * TikTok-style engagement persisted to localStorage:
 * likes, saves (per product id) and public comments (shared in this browser).
 * Each mutation re-reads localStorage before writing so multiple cards on the
 * page never clobber one another.
 */

export interface ProductComment {
  id: string;
  author: string;
  text: string;
  date: string;
}

const LIKES = "tilet3d_likes";
const SAVES = "tilet3d_saves";
const COMMENTS = "tilet3d_comments";

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write<T>(key: string, val: T) {
  localStorage.setItem(key, JSON.stringify(val));
}

export const useEngagementStore = () => {
  const [, bump] = useState(0);
  const rerender = useCallback(() => bump((v) => v + 1), []);

  const likedIds = useCallback(() => read<string[]>(LIKES, []), []);
  const savedIds = useCallback(() => read<string[]>(SAVES, []), []);

  const isLiked = useCallback((id: string) => likedIds().includes(id), [likedIds]);
  const isSaved = useCallback((id: string) => savedIds().includes(id), [savedIds]);

  const toggle = useCallback(
    (key: string, id: string) => {
      const cur = read<string[]>(key, []);
      const next = cur.includes(id) ? cur.filter((x) => x !== id) : [id, ...cur];
      write(key, next);
      rerender();
    },
    [rerender],
  );

  const toggleLike = useCallback((id: string) => toggle(LIKES, id), [toggle]);
  const toggleSave = useCallback((id: string) => toggle(SAVES, id), [toggle]);

  const getComments = useCallback(
    (id: string) => read<Record<string, ProductComment[]>>(COMMENTS, {})[id] ?? [],
    [],
  );

  const addComment = useCallback(
    (id: string, author: string, text: string) => {
      const all = read<Record<string, ProductComment[]>>(COMMENTS, {});
      const comment: ProductComment = {
        id: `${id}-${Date.now()}`,
        author: author || "Guest",
        text: text.trim(),
        date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      };
      all[id] = [comment, ...(all[id] ?? [])];
      write(COMMENTS, all);
      rerender();
    },
    [rerender],
  );

  const commentCount = useCallback((id: string) => getComments(id).length, [getComments]);

  return {
    isLiked,
    isSaved,
    toggleLike,
    toggleSave,
    likedIds,
    savedIds,
    getComments,
    addComment,
    commentCount,
  };
};
