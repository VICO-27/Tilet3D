import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import EngagementBar from './EngagementBar';
import { useEngagementStore } from '@/app/store/useEngagementStore';

interface ProductMedia {
  id: string;
  file: string;
  media_type: 'image' | 'video';
  is_primary: boolean;
}

interface ProductVariant {
  id: string;
  price: number | string;
}

export interface Product {
  id: string;
  name: string;
  media: ProductMedia[];
  variants: ProductVariant[];
  like_count: number;
  comment_count: number;
  is_liked: boolean;
}

interface ProductCardProps {
  product: Product;
  index: number;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, index }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [localCommentCount, setLocalCommentCount] = useState(product.comment_count);
  const navigate = useNavigate();

  useEngagementStore();

  const isWide = index % 5 === 0;
  const primary = product.media.find((m) => m.is_primary) || product.media[0];
  const hoverMedia = product.media.length > 1 ? product.media.find((m) => !m.is_primary) : null;
  const activeMedia = (isHovered && hoverMedia) ? hoverMedia : primary;

  return (
    <div
      className={`relative h-[550px] overflow-hidden group transition-all duration-700 cursor-pointer ${isWide ? 'col-span-2' : 'col-span-1'}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setShowCommentInput(false);
      }}
      onClick={() => navigate(`/products/${product.id}`)}
    >
      {/* Media Layer */}
      <div className="absolute inset-0 w-full h-full">
        {activeMedia?.media_type === 'video' ? (
          <video src={activeMedia.file} autoPlay muted loop className="w-full h-full object-cover" />
        ) : (
          <img
            src={activeMedia?.file}
            alt={product.name}
            loading={index < 5 ? 'eager' : 'lazy'}
            fetchPriority={index < 5 ? 'high' : 'auto'}
            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
          />
        )}
      </div>

      {/* Shadow Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-out z-10" />

      {/* Engagement Sidebar Wrapper */}
      <div
        className="absolute right-4 bottom-32 opacity-0 translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500 ease-out z-30"
        onClick={e => e.stopPropagation()}
      >
        <EngagementBar
          product={{ ...product, comment_count: localCommentCount }}
          onOpenComment={() => setShowCommentInput(!showCommentInput)}
        />
      </div>

      {/* Combined Lower Control Interface */}
      <div className="absolute bottom-6 left-6 right-6 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 ease-out z-20 flex flex-col space-y-4 text-left">

        {/* Try-on Action — now turns purple on hover */}
        <div className="w-full">
          <button
            onClick={(e) => { e.stopPropagation(); navigate('/avatar'); }}
            className="w-full py-3 bg-white text-black text-[11px] font-black uppercase tracking-[0.2em] rounded-full shadow-2xl hover:bg-purple-600 hover:text-white transition-colors duration-300 text-center"
          >
            Try-on Avatar
          </button>
        </div>

        {/* Identity & Price (Left Aligned) */}
        <div className="text-white pl-1">
          <h3 className="text-lg font-serif leading-tight drop-shadow-md">
            {product.name}
          </h3>
          <p className="text-xs font-bold tracking-widest uppercase text-white/70 mt-1 drop-shadow-sm">
            {product.variants[0]?.price ? `${product.variants[0].price} ETB` : 'Bespoke Order'}
          </p>
        </div>

        {/* Luxury Micro-Input Comment Tray */}
        {showCommentInput && (
          <div
            className="w-full animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <CommentInputTray
              productId={product.id}
              onComplete={() => setShowCommentInput(false)}
              onPosted={() => setLocalCommentCount((c) => c + 1)}
            />
          </div>
        )}

      </div>
    </div>
  );
};

/* Mini Helper Component for a Premium Minimalist Input Feeling */
const CommentInputTray: React.FC<{
  productId: string;
  onComplete: () => void;
  onPosted: () => void;
}> = ({ productId, onComplete, onPosted }) => {
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);
  const { addComment } = useEngagementStore();

  const handlePost = async () => {
    if (!text.trim() || posting) return;
    setPosting(true);
    const result = await addComment(productId, text);
    setPosting(false);
    if (result) {
      setText("");
      onPosted();
      onComplete();
    }
  };

  return (
    <div className="flex items-center space-x-2 bg-black/60 backdrop-blur-md border border-white/10 rounded-full px-3 py-1.5 w-full">
      <input
        type="text"
        placeholder="Add note on couture..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handlePost()}
        className="flex-1 bg-transparent text-white placeholder-white/40 text-xs focus:outline-none px-2"
        autoFocus
        disabled={posting}
      />
      <button
        onClick={handlePost}
        disabled={posting}
        className="text-[10px] font-bold text-white uppercase tracking-wider bg-white/20 hover:bg-white px-3 py-1 rounded-full hover:text-black transition-colors disabled:opacity-50"
      >
        {posting ? '...' : 'Post'}
      </button>
    </div>
  );
};

export default ProductCard;