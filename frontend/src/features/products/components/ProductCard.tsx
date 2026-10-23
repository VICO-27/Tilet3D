import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import EngagementBar from './EngagementBar';
import { useEngagementStore } from '@/app/store/useEngagementStore';
import { useCartStore } from '@/app/store/useCartStore';
import { ShoppingBag, Check, Sparkles } from 'lucide-react';
import PremiumPlanModal from './PremiumPlanModal';
import RentalBookingModal from '@/features/rentals/components/RentalBookingModal';

import { optimizeCloudinaryUrl, optimizeCloudinaryVideoUrl } from '../../../shared/utils/cloudinary';

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
  slug?: string;
  category_name?: string;
  display_order?: number;
  media: ProductMedia[];
  variants?: ProductVariant[];
  price?: string | number;
  default_variant_id?: string;
  like_count: number;
  comment_count: number;
  is_liked: boolean;
  is_saved?: boolean;
  created_at?: string;
}

interface ProductCardProps {
  product: Product;
  index: number;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, index }) => {
  const { t } = useTranslation();
  const [isHovered, setIsHovered] = useState(false);
  const [isMobileCentered, setIsMobileCentered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null);
  const [showCommentInput, setShowCommentInput] = useState(false);
  
  const [showPremium, setShowPremium] = useState(false); 
  const [showRentalModal, setShowRentalModal] = useState(false); 
  
  const [localCommentCount, setLocalCommentCount] = useState(product.comment_count);
  const navigate = useNavigate();

  // On mobile phone viewports, automatically show action buttons and engagement bar when card is in the horizontal center
  useEffect(() => {
    const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
    if (!isMobile || !cardRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsMobileCentered(entry.isIntersecting);
      },
      {
        rootMargin: "0px -25% 0px -25%",
        threshold: 0.1,
      }
    );

    observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, []);

  const showActions = isHovered || isMobileCentered;

  const variantId = product.default_variant_id || product.variants?.[0]?.id || product.id;
  const addToCart = useCartStore((s) => s.addToCart);
  const alreadyAdded = useCartStore((s) => variantId ? s.addedVariantIds.includes(variantId) : false);

  const isWide = index % 5 === 0;
  const images = product.media.filter((m) => m.media_type === 'image');
  const primary = product.media.find((m) => m.is_primary) || product.media[0];
  const hoverMedia = product.media.length > 1 ? product.media.find((m) => !m.is_primary) : null;
  const displayedImage = (activeImageIndex !== null && images[activeImageIndex]) ? images[activeImageIndex] : null;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!variantId) {
      console.error("Product variants missing:", product);
      return;
    }

    if (!localStorage.getItem("tilet3d_access_token")) {
      navigate("/account");
      return;
    }

    await addToCart(variantId, 1);
  };

  const handleTryOnAvatar = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowPremium(true);
  };

  return (
    <>
      <div
        ref={cardRef}
        className={`relative h-[550px] overflow-hidden group transition-all duration-700 cursor-pointer ${isWide ? 'col-span-2' : 'col-span-1'}`}
        onMouseEnter={() => {
          setIsHovered(true);
          import('../pages/ProductDetailPage');
          import('../api/productApi').then(m => m.productApi.getProductById(product.id).catch(()=>{}));
        }}
        onMouseLeave={() => {
          setIsHovered(false);
          setActiveImageIndex(null);
          setShowCommentInput(false);
        }}
        onClick={() => navigate(`/products/${product.id}`)}
      >
        <div className="absolute inset-0 w-full h-full bg-stone-100">
          {/* Primary Media - Always visible (z-0) so it never flashes white if the hover media is slow! */}
          {primary?.media_type === 'video' ? (
            <video 
              src={optimizeCloudinaryVideoUrl(primary.file)} 
              autoPlay 
              muted 
              loop 
              playsInline
              className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out opacity-100 z-0" 
            />
          ) : (
            <img
              src={optimizeCloudinaryUrl(primary?.file, isWide ? 'c_fill,w_650,q_auto,f_auto' : 'c_fill,w_500,q_auto,f_auto')}
              alt={product.name}
              loading={index < 4 ? 'eager' : 'lazy'}
              decoding="async"
              fetchPriority={index < 4 ? 'high' : 'auto'}
              className="absolute inset-0 w-full h-full object-cover transition-all duration-1000 ease-in-out opacity-100 scale-100 group-hover:scale-105 z-0"
            />
          )}

          {/* Explicit Selected Image (e.g. Front, Back, Top) or Default Hover Media */}
          {displayedImage ? (
            <img
              src={optimizeCloudinaryUrl(displayedImage.file, isWide ? 'c_fill,w_650,q_auto,f_auto' : 'c_fill,w_500,q_auto,f_auto')}
              alt={`${product.name} view`}
              decoding="async"
              className="absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-in-out opacity-100 scale-105 z-10"
            />
          ) : hoverMedia ? (
            hoverMedia.media_type === 'video' ? (
              <video 
                src={isHovered ? optimizeCloudinaryVideoUrl(hoverMedia.file) : undefined} 
                muted 
                loop 
                playsInline
                preload="none"
                ref={(el) => {
                  if (el) {
                    if (isHovered) {
                      el.play().catch(()=>{});
                    } else {
                      el.pause();
                      el.currentTime = 0;
                    }
                  }
                }}
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out ${isHovered ? 'opacity-100 z-10' : 'opacity-0 z-0'}`} 
              />
            ) : (
              <img
                src={isHovered ? optimizeCloudinaryUrl(hoverMedia.file, isWide ? 'c_fill,w_650,q_auto,f_auto' : 'c_fill,w_500,q_auto,f_auto') : undefined}
                alt={`${product.name} hover`}
                loading="lazy"
                decoding="async"
                className={`absolute inset-0 w-full h-full object-cover transition-all duration-1000 ease-in-out ${isHovered ? 'opacity-100 scale-105 z-10' : 'opacity-0 scale-100 z-0'}`}
              />
            )
          ) : null}
        </div>

        <div className={`absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent transition-opacity duration-500 ease-out z-10 ${showActions ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} />

        <div
          className={`absolute right-2.5 sm:right-4 bottom-28 sm:bottom-32 transition-all duration-500 ease-out z-30 ${showActions ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4 group-hover:opacity-100 group-hover:translate-x-0'}`}
          onClick={e => e.stopPropagation()}
        >
          <EngagementBar
            product={{ ...product, comment_count: localCommentCount }}
            onOpenComment={() => setShowCommentInput(!showCommentInput)}
          />
        </div>

        <div className={`absolute bottom-3.5 sm:bottom-6 left-3 sm:left-5 right-14 sm:right-16 transition-all duration-500 ease-out z-20 flex flex-col space-y-2 sm:space-y-3 text-left ${showActions ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0'}`}>

          {/* Multi-angle view selector pills (Front, Back, Top) */}
          {images.length > 1 && (
            <div 
              className={`flex items-center gap-1.5 transition-opacity duration-300 z-30 ${showActions ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
              onClick={(e) => e.stopPropagation()}
            >
              {images.map((img, idx) => {
                const label = idx === 0 ? t("products.card.front", "Front") : idx === 1 ? t("products.card.back", "Back") : idx === 2 ? t("products.card.top", "Top") : `${t("products.card.view", "View")} ${idx + 1}`;
                const isCurrent = activeImageIndex === idx || (activeImageIndex === null && (idx === 1 ? isHovered : !isHovered));
                return (
                  <button
                    key={img.id || idx}
                    type="button"
                    onMouseEnter={(e) => {
                      e.stopPropagation();
                      setActiveImageIndex(idx);
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveImageIndex(idx);
                    }}
                    className={`px-2 py-0.5 text-[8px] sm:text-[9px] uppercase tracking-widest font-mono rounded-full backdrop-blur-md transition-all duration-300 ${
                      isCurrent 
                        ? 'bg-white text-black font-bold shadow-md scale-105' 
                        : 'bg-black/60 text-white/80 hover:bg-black/80 hover:text-white border border-white/20'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          )}

          <div className="grid grid-cols-2 gap-1.5 sm:gap-2 w-full">
            <button
              type="button"
              onClick={handleTryOnAvatar}
              className="min-w-0 py-2 sm:py-2.5 px-1.5 sm:px-3 bg-white text-black text-[9px] sm:text-[10px] font-bold uppercase tracking-wider rounded-full shadow-lg hover:bg-purple-600 hover:text-white transition-colors duration-300 text-center truncate cursor-pointer active:scale-95"
            >
              {t("products.tryOn", "Try-on Avatar")}
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowRentalModal(true);
              }}
              className="min-w-0 py-2 sm:py-2.5 px-1.5 sm:px-3 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider rounded-full shadow-lg transition-all duration-300 flex items-center justify-center gap-1 sm:gap-1.5 bg-gradient-to-r from-purple-600 via-fuchsia-600 to-purple-600 hover:from-purple-500 hover:to-purple-700 text-white border border-purple-400/40 hover:shadow-purple-600/30 active:scale-95 truncate cursor-pointer"
            >
              <Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-white shrink-0" />
              <span className="truncate">{t("products.rent", "Rent")}</span>
            </button>
          </div>

          <div className="text-white pl-0.5">
            <h3 className="text-sm sm:text-lg font-serif leading-tight drop-shadow-md line-clamp-1">
              {product.name}
            </h3>
            <p className="text-[10px] sm:text-xs font-bold tracking-widest uppercase text-white/70 mt-0.5 sm:mt-1 drop-shadow-sm">
              {(product.price || product.variants?.[0]?.price) ? `${product.price || product.variants?.[0]?.price} ETB` : t("products.bespoke", "Bespoke Order")}
            </p>
          </div>

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

      <PremiumPlanModal 
        isOpen={showPremium} 
        onClose={() => setShowPremium(false)} 
        productName={product.name}
      />

      <RentalBookingModal
        isOpen={showRentalModal}
        onClose={() => setShowRentalModal(false)}
        product={product}
      />
    </>
  );
};

const CommentInputTray: React.FC<{
  productId: string;
  onComplete: () => void;
  onPosted: () => void;
}> = ({ productId, onComplete, onPosted }) => {
  const { t } = useTranslation();
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
        placeholder={t("products.addNote", "Add note on couture...")}
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
        {posting ? '...' : t("products.post", "Post")}
      </button>
    </div>
  );
};

export default React.memo(ProductCard);