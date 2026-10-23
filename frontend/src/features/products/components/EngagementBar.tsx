import React, { useState } from 'react';
import { Heart, MessageCircle, Share2, Plus, Bookmark, Check } from 'lucide-react';
import { useAuthStore } from '@/app/store/useAuthStore';
import { useCartStore } from '@/app/store/useCartStore';
import { useEngagementStore } from '@/app/store/useEngagementStore';
import { useToastStore } from '@/app/store/useToastStore';
import { useNavigate, useLocation } from 'react-router-dom';
import { Product } from './ProductCard';

interface EngagementBarProps {
  product: Product;
  onOpenComment: () => void;
}

const EngagementBar: React.FC<EngagementBarProps> = ({ product, onOpenComment }) => {
  const { isAuthenticated } = useAuthStore();
  const { addToCart, isAdded } = useCartStore();
  const showToast = useToastStore((s) => s.show);
  const location = useLocation();
  const navigate = useNavigate();

  const { toggleLike, toggleBookmark, trackShare, hasLiked, isSaved } = useEngagementStore();
  const [copied, setCopied] = useState(false);

  const liked = hasLiked(product.id);
  const saved = isSaved(product.id);
  const variantId = product.default_variant_id || product.variants?.[0]?.id || product.id;
  const addedToCart = variantId ? isAdded(variantId) : false;

  const handleAction = (fn: () => void) => {
    if (!isAuthenticated()) {
      return navigate('/account', { state: { from: location.pathname } });
    }
    fn();
  };

  const onAddToCart = async () => {
    if (!variantId) {
      showToast("This item isn't available right now", "error");
      return;
    }
    if (addedToCart) {
      showToast("Already in your cart");
      return;
    }
    if (!localStorage.getItem("tilet3d_access_token")) {
      showToast("Please sign in to add to your bag", "error");
      return;
    }
    const success = await addToCart(variantId);
    if (success) {
      showToast("Added to cart");
    }
  };

  const onShare = () => {
    const url = `${window.location.origin}/products/${product.id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    trackShare(product.id, 'link');
    setTimeout(() => setCopied(false), 2000);
  };

  const glassBtn = "w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/30 transition-all duration-300 shadow-xl relative";

  return (
    <div className="flex flex-col items-center space-y-2 sm:space-y-3.5">
      {/* Plus Button / Add to Cart */}
      <button
        onClick={() => handleAction(onAddToCart)}
        className={`${glassBtn} active:scale-95`}
      >
        {addedToCart ? (
          <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-purple-400" strokeWidth={3} />
        ) : (
          <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={3} />
        )}
      </button>

      {/* Like Button */}
      <div className="flex flex-col items-center">
        <button
          onClick={() => handleAction(() => toggleLike(product.id))}
          className={`${glassBtn} active:scale-95`}
        >
          <Heart
            className={`h-4 w-4 sm:h-5 sm:w-5 transition-all ${
              liked ? "text-purple-500 stroke-purple-500 scale-110 fill-[#a21caf]" : "text-white"
            }`}
          />
        </button>
        <span className="text-[9px] sm:text-[10px] font-bold mt-0.5 sm:mt-1 text-white drop-shadow-lg">
          {product.like_count + (liked ? 1 : 0) - (product.is_liked ? 1 : 0)}
        </span>
      </div>

      {/* Comment Activation Trigger */}
      <div className="flex flex-col items-center">
        <button
          onClick={() => handleAction(onOpenComment)}
          className={glassBtn}
        >
          <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>
        <span className="text-[9px] sm:text-[10px] font-bold mt-0.5 sm:mt-1 text-white drop-shadow-lg">{product.comment_count}</span>
      </div>

      {/* Save Button */}
      <button
        onClick={() => handleAction(() => toggleBookmark(product.id))}
        className={`${glassBtn} active:scale-95`}
      >
        <Bookmark
          className={`h-4 w-4 sm:h-5 sm:w-5 ${
            saved ? "text-purple-500 stroke-purple-500 fill-[#a21caf]" : "text-white"
          }`}
        />
      </button>

      {/* Share Button */}
      <div className="relative flex flex-col items-center">
        <button onClick={onShare} className={glassBtn}>
          {copied ? <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-400" /> : <Share2 className="h-4 w-4 sm:h-5 sm:w-5" />}
        </button>
        {copied && (
          <span className="absolute right-10 sm:right-12 top-1/2 -translate-y-1/2 bg-black/90 text-white text-[9px] sm:text-[10px] font-medium tracking-tight whitespace-nowrap px-2 py-0.5 rounded shadow-xl border border-white/10 z-50">
            Link copied!
          </span>
        )}
      </div>
    </div>
  );
};

export default EngagementBar;