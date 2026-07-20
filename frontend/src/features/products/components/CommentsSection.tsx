import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/app/store/useAuthStore';
import { useEngagementStore } from '@/app/store/useEngagementStore';
import { productApi } from '../api/productApi';
import { ProductCommentDTO } from '../types';

interface Props {
  productId: string;
}

const timeAgo = (iso: string): string => {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
};

const CommentsSection = React.forwardRef<HTMLDivElement, Props>(({ productId }, ref) => {
  const { isAuthenticated } = useAuthStore();
  const { addComment } = useEngagementStore();
  const [comments, setComments] = useState<ProductCommentDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    productApi.getComments(productId)
      .then((data) => { if (!cancelled) setComments(data); })
      .catch((err) => console.error('Failed to load comments', err))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [productId]);

  const handlePost = async () => {
    if (!text.trim() || posting) return;
    setPosting(true);
    const result = await addComment(productId, text);
    setPosting(false);
    if (result) {
      // Backend now returns the full serialized comment, so this is safe to prepend directly
      setComments((prev) => [result, ...prev]);
      setText('');
    }
  };

  return (
    <div ref={ref} className="pt-10">
      <h2
        className="text-xl font-bold text-zinc-900 mb-6"
        style={{ fontFamily: "'Iowan Old Style','Palatino Linotype',serif" }}
      >
        {comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}
      </h2>

      {isAuthenticated() ? (
        <div className="flex items-center gap-3 mb-8">
          <input
            type="text"
            placeholder="Add a comment..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handlePost()}
            disabled={posting}
            className="flex-1 border-b border-zinc-200 focus:border-zinc-900 outline-none py-2 text-sm transition-colors"
          />
          <button
            onClick={handlePost}
            disabled={posting || !text.trim()}
            className="text-xs font-bold uppercase tracking-wider text-white bg-zinc-900 px-4 py-2 rounded-full disabled:opacity-40 transition-opacity"
          >
            {posting ? '...' : 'Post'}
          </button>
        </div>
      ) : (
        <p className="text-sm text-zinc-400 mb-8">Sign in to leave a comment.</p>
      )}

      {loading ? (
        <p className="text-sm text-zinc-400">Loading comments...</p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-zinc-400">No comments yet — be the first to share your thoughts.</p>
      ) : (
        <div className="space-y-6">
          {comments.map((c) => (
            <div key={c.id} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-zinc-200 flex items-center justify-center text-xs font-bold text-zinc-600 shrink-0">
                {c.user_email?.[0]?.toUpperCase() || '?'}
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-semibold text-zinc-900">{c.user_email}</span>
                  <span className="text-xs text-zinc-400">{timeAgo(c.created_at)}</span>
                </div>
                <p className="text-sm text-zinc-700 mt-0.5">{c.text}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

CommentsSection.displayName = 'CommentsSection';
export default CommentsSection;