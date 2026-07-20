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

  const pill = "flex items-center gap-2 px-4 py-2.5 rounded-full border border-zinc-200 text-[13px] font-medium text-zinc-800 hover:bg-zinc-50 transition-colors";

  return (
    <div className="flex flex-wrap items-center gap-3 py-4 border-y border-zinc-100">
      <button onClick={() => handleAction(() => toggleLike(product.id))} className={pill}>
        <Heart size={16} fill={liked ? '#a21caf' : 'none'} className={liked ? 'text-plum-600' : 'text-zinc-600'} />
        {likeCount}
      </button>

      <button onClick={onScrollToComments} className={pill}>
        <MessageCircle size={16} className="text-zinc-600" />
        {product.comment_count}
      </button>

      <button onClick={onShare} className={pill}>
        {copied ? <Check size={16} className="text-green-600" /> : <Share2 size={16} className="text-zinc-600" />}
        {copied ? 'Copied' : 'Share'}
      </button>

      <button onClick={() => handleAction(() => toggleBookmark(product.id))} className={`${pill} ml-auto`}>
        <Bookmark size={16} fill={saved ? '#a21caf' : 'none'} className={saved ? 'text-plum-600' : 'text-zinc-600'} />
        {saved ? 'Saved' : 'Save'}
      </button>
    </div>
  );
};

export default ProductEngagementRow;