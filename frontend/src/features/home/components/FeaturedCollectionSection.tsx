import { useEffect, useRef, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { productApi } from "../../products/api/productApi";
import { Product } from "../../products/types";

// ==========================================
// TYPES & INTERFACES
// ==========================================
interface DisplayItem {
  product: Product;
  mediaUrl: string;
  mediaType: string;
  uniqueKey: string;
}

interface FeaturedCardProps {
  item: DisplayItem;
  onClick: () => void;
}

// Smart Category Extractor to prevent TypeScript errors
const getCategoryName = (product: Product): string => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p = product as any;
  
  if (p.category?.name) return p.category.name;
  if (typeof p.category === 'string') return p.category;
  
  const name = product.name.toLowerCase();
  if (name.includes('kemis')) return 'Kemis';
  if (name.includes('shemiz')) return 'Shemiz';
  if (name.includes('netela')) return 'Netela';
  if (name.includes('scarf')) return 'Scarf';
  if (name.includes('suri')) return 'Suri';
  if (name.includes('gabi')) return 'Gabi';
  if (name.includes('wedding')) return 'Wedding';
  
  return 'Premium Tilet';
};

// ==========================================
// 1. INDIVIDUAL HIGH-PERFORMANCE CARD
// ==========================================
const FeaturedCard = ({ item, onClick }: FeaturedCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // LAZY LOADING STATE: Prevents stacking and lagging
  const [hasEntered, setHasEntered] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      // Look ahead by 1000px so it loads *just* before the user sees it
      if (entry.isIntersecting) {
        setHasEntered(true); 
        if (videoRef.current) {
          videoRef.current.play().catch(() => {});
        }
      } else {
        // Automatically pause videos when they leave the screen to save GPU
        if (videoRef.current) {
          videoRef.current.pause();
        }
      }
    }, {
      root: null,
      rootMargin: '1000px', 
      threshold: 0
    });

    if (cardRef.current) observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, []);

  const isVideo = item.mediaType === 'video';
  const categoryLabel = getCategoryName(item.product);

  return (
    <div
      ref={cardRef}
      onClick={onClick}
      className="group relative w-[260px] md:w-[360px] h-[380px] md:h-[520px] rounded-[24px] md:rounded-[32px] overflow-hidden border border-white/[0.05] bg-neutral-950 will-change-transform shrink-0 cursor-pointer"
    >
      <div className="absolute inset-0 z-0 bg-neutral-900">
        {isVideo ? (
          <video
            ref={videoRef}
            // ONLY LOAD SRC IF IT IS CLOSE TO THE SCREEN (Fixes lag)
            src={hasEntered ? item.mediaUrl : undefined}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            // FORCE IMMEDIATE PLAYBACK ONCE LOADED
            onCanPlay={(e) => e.currentTarget.play()}
            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
          />
        ) : (
          <img
            // LAZY LOAD IMAGES TOO FOR MAXIMUM SPEED
            src={hasEntered ? item.mediaUrl : undefined}
            alt={item.product.name}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
          />
        )}
      </div>

      <div className="absolute inset-0 z-10 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80" />
        <div className="smoke-layer absolute inset-0 bg-[radial-gradient(circle,rgba(147,51,234,0.05)_0%,transparent_70%)]" />
      </div>

      <div className="absolute inset-x-0 bottom-0 p-6 md:p-8 z-20">
        <span className="text-[8px] md:text-[9px] font-mono tracking-widest text-plum-400 uppercase block mb-1">
          {categoryLabel}
        </span>
        <h3 className="text-lg md:text-xl text-neutral-100 font-light drop-shadow-md">
          {item.product.name}
        </h3>
        <div className="mt-2 md:mt-4 flex items-center gap-2 text-[10px] text-neutral-500 opacity-0 group-hover:opacity-100 transition-opacity">
          <span>View Details</span>
          <span className="text-plum-400">→</span>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 2. MAIN SECTION COMPONENT
// ==========================================
const FeaturedCollectionSection = () => {
  const navigate = useNavigate();
  const trackRef = useRef<HTMLDivElement | null>(null);
  
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const isHovering = useRef(false);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const data = await productApi.getProducts();
        const featured = data.filter(p => p.is_featured);
        setProducts(featured);
      } catch (error) {
        console.error("Failed to fetch featured products", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  // MAGIC SHUFFLER V3: Fully Typed Category Round-Robin + Interleaving
  const displayItems = useMemo(() => {
    if (products.length === 0) return [];
    
    const videosByCategory: Record<string, DisplayItem[]> = {};
    const imagesByCategory: Record<string, DisplayItem[]> = {};

    products.forEach(p => {
      const catName = getCategoryName(p);
      p.media.forEach((m, idx) => {
        const item: DisplayItem = { 
          product: p, 
          mediaUrl: m.file, 
          mediaType: m.media_type, 
          uniqueKey: `${p.id}-${idx}` 
        };
        
        if (m.media_type === 'video') {
          if (!videosByCategory[catName]) videosByCategory[catName] = [];
          videosByCategory[catName].push(item);
        } else {
          if (!imagesByCategory[catName]) imagesByCategory[catName] = [];
          imagesByCategory[catName].push(item);
        }
      });
    });

    const mixCategories = (grouped: Record<string, DisplayItem[]>) => {
      const result: DisplayItem[] = [];
      const keys = Object.keys(grouped);
      let hasMore = true;
      let depthIndex = 0;
      
      while (hasMore) {
        hasMore = false;
        for (const key of keys) {
          if (depthIndex < grouped[key].length) {
            result.push(grouped[key][depthIndex]);
            hasMore = true; 
          }
        }
        depthIndex++;
      }
      return result;
    };

    const mixedVideos = mixCategories(videosByCategory);
    const mixedImages = mixCategories(imagesByCategory);

    const interleaved: DisplayItem[] = [];
    const maxLen = Math.max(mixedVideos.length, mixedImages.length);
    
    for (let i = 0; i < maxLen; i++) {
      if (i < mixedVideos.length) interleaved.push(mixedVideos[i]);
      if (i < mixedImages.length) interleaved.push(mixedImages[i]);
    }

    return [...interleaved, ...interleaved, ...interleaved]; 
  }, [products]);

  // NATIVE SCROLL ENGINE
  useEffect(() => {
    const track = trackRef.current;
    if (!track || displayItems.length === 0) return;

    let animationFrameId: number;
    let isDown = false;
    let startX: number;
    let scrollLeft: number;
    
    // SMOOTH SPEED: 3.5 moving right to left
    const speed = 6; 

    const autoScroll = () => {
      if (!isDown && !isHovering.current) {
        track.scrollLeft += speed;
        const singleSetWidth = track.scrollWidth / 3;
        
        if (track.scrollLeft >= singleSetWidth) {
          track.scrollLeft -= singleSetWidth;
        }
      }
      animationFrameId = requestAnimationFrame(autoScroll);
    };

    const onMouseDown = (e: MouseEvent) => {
      isDown = true;
      track.style.cursor = 'grabbing';
      startX = e.pageX - track.offsetLeft;
      scrollLeft = track.scrollLeft;
    };
    const onMouseLeave = () => { 
      isDown = false; 
      track.style.cursor = 'grab';
    };
    const onMouseUp = () => { 
      isDown = false; 
      track.style.cursor = 'grab';
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - track.offsetLeft;
      const walk = (x - startX) * 1.5;
      track.scrollLeft = scrollLeft - walk;
    };

    const onScroll = () => {
      const singleSetWidth = track.scrollWidth / 3;
      if (track.scrollLeft >= singleSetWidth) {
        track.scrollLeft -= singleSetWidth;
      } else if (track.scrollLeft <= 0) {
        track.scrollLeft += singleSetWidth;
      }
    };

    track.addEventListener('mousedown', onMouseDown);
    track.addEventListener('mouseleave', onMouseLeave);
    track.addEventListener('mouseup', onMouseUp);
    track.addEventListener('mousemove', onMouseMove);
    track.addEventListener('scroll', onScroll, { passive: true });

    animationFrameId = requestAnimationFrame(autoScroll);

    return () => {
      cancelAnimationFrame(animationFrameId);
      track.removeEventListener('mousedown', onMouseDown);
      track.removeEventListener('mouseleave', onMouseLeave);
      track.removeEventListener('mouseup', onMouseUp);
      track.removeEventListener('mousemove', onMouseMove);
      track.removeEventListener('scroll', onScroll);
    };
  }, [displayItems]);

  const handleManualScroll = (direction: "left" | "right") => {
    if (trackRef.current) {
      const isMobile = window.innerWidth < 768;
      const scrollAmount = isMobile ? (260 + 32) : (360 + 48); 
      const move = direction === "left" ? -scrollAmount : scrollAmount;
      trackRef.current.scrollBy({ left: move, behavior: "smooth" });
    }
  };

  return (
    <section 
      className="relative bg-black text-white h-[85vh] min-h-[650px] w-full flex flex-col justify-center overflow-hidden"
      onMouseEnter={() => (isHovering.current = true)}
      onMouseLeave={() => (isHovering.current = false)}
    >
      <style>{`
        @keyframes subtleDrift {
          0% { transform: translate(0,0); }
          50% { transform: translate(-10px, 5px); }
          100% { transform: translate(0,0); }
        }
        @keyframes skeletonShimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .smoke-layer {
          animation: subtleDrift 15s infinite ease-in-out;
          will-change: transform;
        }
        .smooth-scroll-container {
          -webkit-overflow-scrolling: touch;
          scroll-behavior: auto;
          scrollbar-width: none;
          overscroll-behavior-x: contain; 
        }
        .smooth-scroll-container::-webkit-scrollbar {
          display: none;
        }
        .shimmer-effect {
          animation: skeletonShimmer 2s infinite linear;
        }
      `}</style>

      {/* Header */}
      <div className="absolute top-12 md:top-16 left-0 w-full px-8 md:px-16 flex justify-between items-end z-20">
        <div>
          <span className="text-[10px] font-mono tracking-[0.4em] text-plum-400 block mb-2">TILET3D ATELIER</span>
          <h2 className="text-3xl md:text-5xl font-light tracking-tight">Featured Collection</h2>
        </div>
        <p className="text-neutral-500 font-normal text-xl hidden md:block">የተኛውን መረጡ?</p>
      </div>

      {isLoading ? (
        <div className="w-full overflow-hidden pb-8 pt-8 opacity-60">
          <div className="flex gap-8 md:gap-12 px-8 md:px-[15vw] w-max">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="relative w-[260px] md:w-[360px] h-[380px] md:h-[520px] rounded-[24px] md:rounded-[32px] overflow-hidden bg-neutral-900 shrink-0"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.05] to-transparent shimmer-effect z-10" />
                <div className="absolute inset-x-0 bottom-0 p-6 md:p-8 z-20 flex flex-col gap-3">
                  <div className="w-16 h-2 bg-neutral-800 rounded-full" />
                  <div className="w-3/4 h-5 bg-neutral-800 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Luxury Navigation Buttons */}
          <div className="absolute top-1/2 -translate-y-1/2 left-4 md:left-8 z-30 opacity-0 md:opacity-100 transition-opacity duration-500 hover:opacity-100">
            <button 
              onClick={() => handleManualScroll("left")}
              className="w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 hover:scale-105 transition-all duration-300 group shadow-2xl"
            >
              <ChevronLeft strokeWidth={1} className="text-white/70 group-hover:text-white" size={28} />
            </button>
          </div>

          <div className="absolute top-1/2 -translate-y-1/2 right-4 md:right-8 z-30 opacity-0 md:opacity-100 transition-opacity duration-500 hover:opacity-100">
            <button 
              onClick={() => handleManualScroll("right")}
              className="w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 hover:scale-105 transition-all duration-300 group shadow-2xl"
            >
              <ChevronRight strokeWidth={1} className="text-white/70 group-hover:text-white" size={28} />
            </button>
          </div>

          {/* Track Viewport */}
          <div 
            ref={trackRef} 
            className="w-full overflow-x-auto smooth-scroll-container cursor-grab active:cursor-grabbing pb-8 pt-8"
          >
            <div className="flex gap-8 md:gap-12 px-8 md:px-[15vw] w-max">
              {displayItems.map((item, index) => (
                <FeaturedCard 
                  key={`${item.uniqueKey}-${index}`}
                  item={item}
                  onClick={() => navigate(`/products/${item.product.id}`)}
                />
              ))}
            </div>
          </div>
        </>
      )}

      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[60vw] h-[100px] bg-plum-900/10 blur-[100px] rounded-full pointer-events-none" />
    </section>
  );
};

export default FeaturedCollectionSection;