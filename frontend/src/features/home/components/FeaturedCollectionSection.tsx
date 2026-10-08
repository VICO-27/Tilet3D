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

// Smart Category Extractor
const getCategoryName = (product: Product): string => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p = product as any;
  if (p.category_name) return p.category_name;
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
// 1. INDIVIDUAL CARD — starts visible, fades in media
// ==========================================
const FeaturedCard = ({ item, onClick }: FeaturedCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Track whether the card is in viewport (for lazy video load)
  const [inView, setInView] = useState(false);
  // Track whether media has loaded — skeleton shows until this is true
  const [mediaLoaded, setMediaLoaded] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          videoRef.current?.play().catch(() => {});
        } else {
          videoRef.current?.pause();
        }
      },
      { rootMargin: '800px', threshold: 0 }
    );
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
      {/* Background layer */}
      <div className="absolute inset-0 z-0 bg-neutral-900">

        {/* Skeleton — always visible until media loads */}
        <div
          className={`absolute inset-0 z-10 bg-neutral-800 overflow-hidden transition-opacity duration-700 ${mediaLoaded ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
        >
          <div className="shimmer-sweep absolute inset-0 w-[200%] h-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
        </div>

        {/* Media — lazy loaded, fades in when ready */}
        {isVideo ? (
          <video
            ref={videoRef}
            src={inView ? item.mediaUrl : undefined}
            autoPlay
            loop
            muted
            playsInline
            preload="none"
            onCanPlay={(e) => { e.currentTarget.play(); setMediaLoaded(true); }}
            className={`w-full h-full object-cover transition-opacity duration-700 group-hover:scale-105 transition-transform ${mediaLoaded ? 'opacity-100' : 'opacity-0'}`}
          />
        ) : (
          <img
            src={inView ? item.mediaUrl : undefined}
            alt={item.product.name}
            loading="lazy"
            onLoad={() => setMediaLoaded(true)}
            className={`w-full h-full object-cover transition-opacity duration-700 group-hover:scale-105 transition-transform ${mediaLoaded ? 'opacity-100' : 'opacity-0'}`}
          />
        )}
      </div>

      {/* Overlay gradient */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80" />
        <div className="smoke-layer absolute inset-0 bg-[radial-gradient(circle,rgba(147,51,234,0.05)_0%,transparent_70%)]" />
      </div>

      {/* Text info */}
      <div className="absolute inset-x-0 bottom-0 p-6 md:p-8 z-20 flex flex-col justify-end">
        <span className="text-[8px] md:text-[9px] font-mono tracking-widest text-plum-400 uppercase block">
          {categoryLabel}
        </span>
        <div className="mt-2 flex items-center gap-2 text-[10px] text-neutral-500 opacity-0 group-hover:opacity-100 transition-opacity">
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
        const data = await productApi.getFeaturedProducts();
        setProducts(data.results);
      } catch (error) {
        console.error("Failed to fetch featured products", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  // ==========================================
  // INTERLEAVING: strict video (odd) → image (even), no same-category neighbours
  // When a type is exhausted, fall back gracefully but still enforce category rule.
  // ==========================================
  const displayItems = useMemo(() => {
    if (products.length === 0) return [];

    const productsByCategory: Record<string, Product[]> = {};

    products.forEach(p => {
      const catName = getCategoryName(p);
      if (!productsByCategory[catName]) productsByCategory[catName] = [];
      productsByCategory[catName].push(p);
    });

    const interleaved: DisplayItem[] = [];
    let wantVideo = true;

    // To ensure fair round-robin, we will just loop through the categories in order
    // until all products are exhausted.
    let catNames = Object.keys(productsByCategory);

    while (true) {
      catNames = catNames.filter(c => productsByCategory[c].length > 0);
      if (catNames.length === 0) break;

      for (const catName of catNames) {
        if (productsByCategory[catName].length === 0) continue;

        const product = productsByCategory[catName].shift();
        if (!product) continue;

        // Extract one media. Try to match wantVideo
        let media = product.media.find(m => m.media_type === (wantVideo ? 'video' : 'image'));
        if (!media) media = product.media[0]; // fallback

        if (media) {
          interleaved.push({
            product,
            mediaUrl: media.file,
            mediaType: media.media_type,
            uniqueKey: product.id,
          });
        }

        wantVideo = !wantVideo; // alternate video/image
      }
    }

    // Triplicate for seamless infinite scroll
    return [...interleaved, ...interleaved, ...interleaved];
  }, [products]);

  // ==========================================
  // AUTO-SCROLL ENGINE
  // Speed: 2.0px/frame (faster) — cinematic
  // Hover: slows to 0.3x but never stops
  // ==========================================
  useEffect(() => {
    const track = trackRef.current;
    if (!track || displayItems.length === 0) return;

    let rafId: number;
    let isDragging = false;
    let startX = 0;
    let scrollLeftStart = 0;
    const BASE_SPEED = 2.0;

    const tick = () => {
      if (!isDragging) {
        const speed = isHovering.current ? BASE_SPEED * 0.3 : BASE_SPEED;
        track.scrollLeft += speed;
        const third = track.scrollWidth / 3;
        if (track.scrollLeft >= third * 2) track.scrollLeft -= third;
        if (track.scrollLeft <= 0) track.scrollLeft += third;
      }
      rafId = requestAnimationFrame(tick);
    };

    const onDown = (e: MouseEvent) => {
      isDragging = true;
      track.style.cursor = 'grabbing';
      startX = e.pageX - track.offsetLeft;
      scrollLeftStart = track.scrollLeft;
    };
    const onUp = () => { isDragging = false; track.style.cursor = 'grab'; };
    const onMove = (e: MouseEvent) => {
      if (!isDragging) return;
      e.preventDefault();
      track.scrollLeft = scrollLeftStart - (e.pageX - track.offsetLeft - startX) * 1.5;
    };

    // Touch support
    let touchStartX = 0;
    let touchScrollStart = 0;
    const onTouchStart = (e: TouchEvent) => {
      isDragging = true;
      touchStartX = e.touches[0].pageX;
      touchScrollStart = track.scrollLeft;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;
      track.scrollLeft = touchScrollStart - (e.touches[0].pageX - touchStartX);
    };
    const onTouchEnd = () => { isDragging = false; };

    track.addEventListener('mousedown', onDown);
    track.addEventListener('mouseup', onUp);
    track.addEventListener('mouseleave', onUp);
    track.addEventListener('mousemove', onMove);
    track.addEventListener('touchstart', onTouchStart, { passive: true });
    track.addEventListener('touchmove', onTouchMove, { passive: true });
    track.addEventListener('touchend', onTouchEnd);

    // Start offset at the middle third so backward dragging doesn't break
    track.scrollLeft = track.scrollWidth / 3;
    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      track.removeEventListener('mousedown', onDown);
      track.removeEventListener('mouseup', onUp);
      track.removeEventListener('mouseleave', onUp);
      track.removeEventListener('mousemove', onMove);
      track.removeEventListener('touchstart', onTouchStart);
      track.removeEventListener('touchmove', onTouchMove);
      track.removeEventListener('touchend', onTouchEnd);
    };
  }, [displayItems]);

  const handleManualScroll = (direction: "left" | "right") => {
    if (trackRef.current) {
      const cardW = window.innerWidth < 768 ? 260 + 32 : 360 + 48;
      trackRef.current.scrollBy({ left: direction === "left" ? -cardW : cardW, behavior: "smooth" });
    }
  };

  return (
    // NO bottom-to-top pop-in: section starts fully visible, no y translation.
    // The section just fades in cleanly as the user scrolls to it.
    <section
      className="relative bg-black text-white h-[85vh] min-h-[650px] w-full flex flex-col justify-center overflow-hidden"
      onMouseEnter={() => (isHovering.current = true)}
      onMouseLeave={() => (isHovering.current = false)}
    >
      <style>{`
        @keyframes subtleDrift {
          0%,100% { transform: translate(0,0); }
          50%      { transform: translate(-10px,5px); }
        }
        @keyframes shimmerSweep {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .smoke-layer { animation: subtleDrift 15s infinite ease-in-out; will-change: transform; }
        .shimmer-sweep { animation: shimmerSweep 1.8s infinite linear; }
        .featured-track {
          -webkit-overflow-scrolling: touch;
          scroll-behavior: auto;
          scrollbar-width: none;
          overscroll-behavior-x: contain;
        }
        .featured-track::-webkit-scrollbar { display: none; }
      `}</style>

      {/* Header — always visible, no animation */}
      <div className="absolute top-12 md:top-16 left-0 w-full px-8 md:px-16 flex justify-between items-end z-20">
        <div>
          <span className="text-[10px] font-mono tracking-[0.4em] text-plum-400 block mb-2">TILET3D ATELIER</span>
          <h2 className="text-3xl md:text-5xl font-light tracking-tight">Featured Collection</h2>
        </div>
        <p className="text-neutral-500 font-normal text-xl hidden md:block">የተኛውን መረጡ?</p>
      </div>

      {/* Skeleton cards — shown while fetching products from API */}
      {isLoading && (
        <div className="w-full overflow-hidden pb-8 pt-8">
          <div className="flex gap-8 md:gap-12 px-8 md:px-[15vw] w-max">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="relative w-[260px] md:w-[360px] h-[380px] md:h-[520px] rounded-[24px] md:rounded-[32px] overflow-hidden bg-neutral-900 shrink-0"
              >
                <div className="shimmer-sweep absolute inset-0 w-[200%] h-full bg-gradient-to-r from-transparent via-white/[0.05] to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-6 md:p-8 flex flex-col gap-3">
                  <div className="w-16 h-2 bg-neutral-800 rounded-full" />
                  <div className="w-3/4 h-5 bg-neutral-800 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actual scrolling track */}
      {!isLoading && (
        <>
          {/* Nav buttons */}
          <div className="absolute top-1/2 -translate-y-1/2 left-4 md:left-8 z-30 opacity-0 hover:opacity-100 transition-opacity duration-300">
            <button
              onClick={() => handleManualScroll("left")}
              className="w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 hover:scale-105 transition-all duration-300 group shadow-2xl"
            >
              <ChevronLeft strokeWidth={1} className="text-white/70 group-hover:text-white" size={28} />
            </button>
          </div>
          <div className="absolute top-1/2 -translate-y-1/2 right-4 md:right-8 z-30 opacity-0 hover:opacity-100 transition-opacity duration-300">
            <button
              onClick={() => handleManualScroll("right")}
              className="w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 hover:scale-105 transition-all duration-300 group shadow-2xl"
            >
              <ChevronRight strokeWidth={1} className="text-white/70 group-hover:text-white" size={28} />
            </button>
          </div>

          <div
            ref={trackRef}
            className="w-full overflow-x-auto featured-track cursor-grab active:cursor-grabbing pb-8 pt-8"
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