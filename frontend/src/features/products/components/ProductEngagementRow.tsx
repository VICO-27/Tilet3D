import React, { useState } from 'react';
import { Heart, MessageCircle, Share2, Bookmark, Check } from 'lucide-react';
import { useAuthStore } from '@/app/store/useAuthStore';
import { useEngagementStore } from '@/app/store/useEngagementStore';
import { useToastStore } from '@/app/store/useToastStore';
import { useNavigate, useLocation } from 'react-router-dom';
import { Product } from '../types';

interface Props {
  product: Product;
  onScrollToComments: () => void;
}

const ProductEngagementRow: React.FC<Props> = ({ product, onScrollToComments }) => {
  const { isAuthenticated } = useAuthStore();
  const { toggleLike, toggleBookmark, trackShare, hasLiked, isSaved } = useEngagementStore();
  const showToast = useToastStore((s) => s.show);
  const navigate = useNavigate();
  const location = useLocation();
  const [copied, setCopied] = useState(false);

  const liked = hasLiked(product.id);
  const saved = isSaved(product.id);
  const likeCount = product.like_count + (liked ? 1 : 0) - (product.is_liked ? 1 : 0);

  const handleAction = (fn: () => void) => {
    if (!isAuthenticated()) {
      return navigate('/account', { state: { from: location.pathname } });
    }
    fn();
  };

  const onShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopied(true);
    trackShare(product.id, 'link');
    showToast('Link copied');
    setTimeout(() => setCopied(false), 2000);
  };

  const pill = "flex-1 min-w-0 flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2.5 rounded-full border border-zinc-200 text-xs sm:text-[13px] font-medium text-zinc-800 hover:bg-zinc-50 transition-colors whitespace-nowrap";

  return (
    <div className="flex items-center gap-2 sm:gap-3 py-4 border-y border-zinc-100">
      <button
        type="button"
        onClick={() => handleAction(() => toggleLike(product.id))}
        className={pill}
        title="Like product"
      >
        <Heart
          size={16}
          fill={liked ? '#a21caf' : 'none'}
          className={`shrink-0 ${liked ? 'text-plum-600' : 'text-zinc-600'}`}
        />
        <span>{likeCount}</span>
      </button>

      <button
        type="button"
        onClick={onScrollToComments}
        className={pill}
        title="View comments"
      >
        <MessageCircle size={16} className="text-zinc-600 shrink-0" />
        <span>{product.comment_count}</span>
      </button>

      <button
        type="button"
        onClick={onShare}
        className={pill}
        title="Share link"
      >
        {copied ? (
          <Check size={16} className="text-green-600 shrink-0" />
        ) : (
          <Share2 size={16} className="text-zinc-600 shrink-0" />
        )}
        <span>{copied ? 'Copied' : 'Share'}</span>
      </button>

      <button
        type="button"
        onClick={() => handleAction(() => toggleBookmark(product.id))}
        className={pill}
        title="Save product"
      >
        <Bookmark
          size={16}
          fill={saved ? '#a21caf' : 'none'}
          className={`shrink-0 ${saved ? 'text-plum-600' : 'text-zinc-600'}`}
        />
        <span>{saved ? 'Saved' : 'Save'}</span>
      </button>
    </div>
  );
};

export default ProductEngagementRow;