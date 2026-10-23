import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { productApi } from "../../products/api/productApi";
import { Product } from "../../products/types";
import { optimizeCloudinaryUrl, optimizeCloudinaryVideoUrl } from "../../../shared/utils/cloudinary";

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
  const { t } = useTranslation();
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
            src={inView ? optimizeCloudinaryVideoUrl(item.mediaUrl) : undefined}
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
            src={inView ? optimizeCloudinaryUrl(item.mediaUrl, 'c_fill,w_450,q_auto,f_auto') : undefined}
            alt={item.product.name}
            loading="lazy"
            decoding="async"
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
          <span>{t("featured.viewDetails", "View Details")}</span>
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
  const { t } = useTranslation();
  const navigate = useNavigate();
  const trackRef = useRef<HTMLDivElement | null>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [page, setPage] = useState(1);
  const pageRef = useRef(1);
  const [hasMore, setHasMore] = useState(true);
  const hasMoreRef = useRef(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const isFetchingMoreRef = useRef(false);

  const isHovering = useRef(false);
  const wasDraggedRef = useRef(false);

  // 1. Initial Load: Fetch featured products + Page 1 of catalog
  useEffect(() => {
    let isMounted = true;
    const fetchInitial = async () => {
      setIsLoading(true);
      try {
        const [featuredRes, catalogRes] = await Promise.all([
          productApi.getFeaturedProducts().catch(() => ({ results: [] })),
          productApi.getProducts(undefined, 1, 24).catch(() => ({ results: [], next: null })),
        ]);

        const featList: Product[] = featuredRes.results || (Array.isArray(featuredRes) ? featuredRes : []);
        const catList: Product[] = catalogRes.results || (Array.isArray(catalogRes) ? catalogRes : []);

        const seen = new Set<string>();
        const merged: Product[] = [];
        for (const p of [...featList, ...catList]) {
          if (!seen.has(p.id)) {
            seen.add(p.id);
            merged.push(p);
          }
        }

        if (isMounted) {
          setProducts(merged);
          setPage(1);
          pageRef.current = 1;
          const moreAvailable = Boolean(catalogRes.next);
          setHasMore(moreAvailable);
          hasMoreRef.current = moreAvailable;
        }
      } catch (error) {
        console.error("Failed to load initial collection products", error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchInitial();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Fetch Next Page on Demand
  const fetchNextPage = useCallback(async () => {
    if (isFetchingMoreRef.current || !hasMoreRef.current) return;
    isFetchingMoreRef.current = true;
    setIsFetchingMore(true);

    try {
      const nextPage = pageRef.current + 1;
      const data = await productApi.getProducts(undefined, nextPage, 24);
      const newItems: Product[] = data.results || (Array.isArray(data) ? data : []);

      if (newItems.length === 0) {
        setHasMore(false);
        hasMoreRef.current = false;
      } else {
        setProducts((prev) => {
          const existingIds = new Set(prev.map((p) => p.id));
          const uniqueNew = newItems.filter((p) => !existingIds.has(p.id));
          if (uniqueNew.length === 0) return prev;
          return [...prev, ...uniqueNew];
        });
        pageRef.current = nextPage;
        setPage(nextPage);
        const moreAvailable = Boolean(data.next);
        setHasMore(moreAvailable);
        hasMoreRef.current = moreAvailable;
      }
    } catch (err) {
      console.error("Failed to fetch more products for featured collection", err);
    } finally {
      isFetchingMoreRef.current = false;
      setIsFetchingMore(false);
    }
  }, []);

  // ==========================================
  // INTERLEAVING & DYNAMIC EXPANSION:
  // 1. Odd numbers (1, 3, 5, ...) -> STRICTLY VIDEOS
  //    - Starts with all 14 new showcase videos
  //    - Appends all 11 working old loop videos
  // 2. Even numbers (2, 4, 6, ...) -> STRICTLY IMAGES
  //    - Alternating categories, strictly unique products
  //    - As user scrolls, new products fetched from catalog appear here!
  // 3. NO REPEATING: Never loops back through the same products!
  // ==========================================
  const displayItems = useMemo(() => {
    if (products.length === 0) return [];

    const videoItems: { product: Product; mediaUrl: string; mediaType: 'video'; category: string }[] = [];
    const imagesByCategory: Record<string, { product: Product; mediaUrl: string; mediaType: 'image'; category: string }[]> = {};
    const videoProductIds = new Set<string>();

    products.forEach((p) => {
      const cat = getCategoryName(p);
      let hasVideo = false;
      p.media.forEach((m) => {
        if (m.media_type === 'video') {
          hasVideo = true;
          videoItems.push({
            product: p,
            mediaUrl: m.file,
            mediaType: 'video',
            category: cat,
          });
        }
      });
      if (hasVideo) {
        videoProductIds.add(p.id);
      }

      const img = p.media.find((m) => m.media_type === 'image') || (p.media[0]?.media_type === 'image' ? p.media[0] : null);
      if (img) {
        if (!imagesByCategory[cat]) imagesByCategory[cat] = [];
        imagesByCategory[cat].push({
          product: p,
          mediaUrl: img.file,
          mediaType: 'image',
          category: cat,
        });
      }
    });

    if (videoItems.length === 0) return [];

    // 1. All 14 new showcase videos added to backend/media/videos
    const NEW_FEATURED_VIDEOS = [
      'blue-kemis',
      'fenan-kemis',
      'black-kemis',
      'white-green-kemis',
      'dardar-kemis',
      'lidiana-kemis',
      'nayo-kemis-',
      'enkutatash-kemis',
      'red-kemis',
      'short-kemis',
      'yellow-kemis',
      'oromo-kemis',
      'raya-kemis',
      'oromo-2-kemis',
    ];

    const newVideoItems = videoItems.filter((v) => {
      const url = v.mediaUrl.toLowerCase();
      return NEW_FEATURED_VIDEOS.some((name) => url.includes(name));
    });

    // 2. From the point where the new videos end, append the working old videos
    const oldVideoItems = videoItems.filter((v) => {
      const url = v.mediaUrl.toLowerCase();
      return !NEW_FEATURED_VIDEOS.some((name) => url.includes(name));
    });

    // Sequence: New videos first, followed immediately by old videos appended
    const finalVideoPool = [...newVideoItems, ...oldVideoItems];
    if (finalVideoPool.length === 0) return [];

    // Canonical category rotation order for even (image) cards
    const catRotation = [
      'Suri', 'Gabi', 'Oromo', 'Wedding', 'Tigray', 'Amhara', 
      'Netela', 'Scarf', 'Shash', 'Couple', 'Family', 'Accessories', 'Kemis', 'Shemiz'
    ];

    const interleaved: DisplayItem[] = [];
    const usedProductIds = new Set<string>();
    let videoIndex = 0;
    let lastImageCategory: string | null = null;
    let catRotationIndex = 0;

    // Filter images so we don't duplicate video products on image cards
    const availableImagesByCategory: Record<string, typeof imagesByCategory[string]> = {};
    let totalAvailableImages = 0;
    Object.keys(imagesByCategory).forEach((cat) => {
      const unusedInCat = imagesByCategory[cat].filter((item) => !videoProductIds.has(item.product.id));
      availableImagesByCategory[cat] = [...unusedInCat];
      totalAvailableImages += unusedInCat.length;
    });

    // Generate pairs to showcase all available image products and all video products
    const totalPairs = Math.max(finalVideoPool.length, totalAvailableImages);

    for (let pair = 0; pair < totalPairs; pair++) {
      // 1. ODD CARD: VIDEO (1, 3, 5, 7...)
      const vItem = finalVideoPool[videoIndex % finalVideoPool.length];
      videoIndex++;
      interleaved.push({
        product: vItem.product,
        mediaUrl: vItem.mediaUrl,
        mediaType: 'video',
        uniqueKey: `card-odd-${pair + 1}-${vItem.product.id}`,
      });

      // 2. EVEN CARD: IMAGE (2, 4, 6, 8...) -> Distinct, alternating category
      let chosenCategory: string | null = null;
      for (let step = 0; step < catRotation.length; step++) {
        const testCat = catRotation[(catRotationIndex + step) % catRotation.length];
        const itemsInCat = availableImagesByCategory[testCat];
        if (
          testCat !== lastImageCategory &&
          itemsInCat &&
          itemsInCat.length > 0 &&
          itemsInCat.some((item) => !usedProductIds.has(item.product.id))
        ) {
          chosenCategory = testCat;
          catRotationIndex = (catRotationIndex + step + 1) % catRotation.length;
          break;
        }
      }

      if (!chosenCategory) {
        const catWithItems = Object.keys(availableImagesByCategory).find(
          (c) => c !== lastImageCategory && availableImagesByCategory[c].some((item) => !usedProductIds.has(item.product.id))
        ) || Object.keys(availableImagesByCategory).find(
          (c) => availableImagesByCategory[c].some((item) => !usedProductIds.has(item.product.id))
        );
        if (catWithItems) chosenCategory = catWithItems;
      }

      if (chosenCategory && availableImagesByCategory[chosenCategory]?.length > 0) {
        const itemIndex = availableImagesByCategory[chosenCategory].findIndex((i) => !usedProductIds.has(i.product.id));
        if (itemIndex !== -1) {
          const imgItem = availableImagesByCategory[chosenCategory].splice(itemIndex, 1)[0];
          usedProductIds.add(imgItem.product.id);
          lastImageCategory = chosenCategory;

          interleaved.push({
            product: imgItem.product,
            mediaUrl: imgItem.mediaUrl,
            mediaType: 'image',
            uniqueKey: `card-even-${pair + 1}-${imgItem.product.id}`,
          });
        }
      }
    }

    // Return linear interleaved list — NEVER TRIPLICATE OR LOOP
    return interleaved;
  }, [products]);

  // ==========================================
  // AUTO-SCROLL ENGINE & MOUSE DRAG SCROLL
  // Speed: 2.5px/frame — cinematic
  // Hover: slows to 0.3x
  // Scroll threshold: triggers fetchNextPage() when within 1500px of the end
  // NO LOOPING: stops gracefully when the catalog end is reached
  // ==========================================
  useEffect(() => {
    const track = trackRef.current;
    if (!track || displayItems.length === 0) return;

    let rafId: number;
    let isDragging = false;
    let startX = 0;
    let scrollLeftStart = 0;
    let hasDragged = false;
    const BASE_SPEED = 2.5;

    const checkFetchThreshold = () => {
      if (track.scrollLeft + track.clientWidth >= track.scrollWidth - 1500) {
        fetchNextPage();
      }
    };

    const tick = () => {
      if (!isDragging) {
        const isNearEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 5;
        if (!isNearEnd || hasMoreRef.current) {
          const speed = isHovering.current ? BASE_SPEED * 0.3 : BASE_SPEED;
          track.scrollLeft += speed;
          checkFetchThreshold();
        }
      }
      rafId = requestAnimationFrame(tick);
    };

    const onMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 5) {
        hasDragged = true;
        wasDraggedRef.current = true;
      }
      track.scrollLeft = scrollLeftStart - dx * 1.2;
      checkFetchThreshold();
    };

    const onUp = () => {
      if (!isDragging) return;
      isDragging = false;
      track.style.cursor = 'grab';
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);

      if (hasDragged) {
        setTimeout(() => {
          wasDraggedRef.current = false;
        }, 120);
      } else {
        wasDraggedRef.current = false;
      }
    };

    const onDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      if ((e.target as HTMLElement).closest('button, input, textarea')) return;

      isDragging = true;
      hasDragged = false;
      wasDraggedRef.current = false;
      track.style.cursor = 'grabbing';
      startX = e.clientX;
      scrollLeftStart = track.scrollLeft;

      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    };

    // Touch support
    let touchStartX = 0;
    let touchScrollStart = 0;
    const onTouchStart = (e: TouchEvent) => {
      isDragging = true;
      touchStartX = e.touches[0].clientX;
      touchScrollStart = track.scrollLeft;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;
      const dx = e.touches[0].clientX - touchStartX;
      track.scrollLeft = touchScrollStart - dx;
      checkFetchThreshold();
    };
    const onTouchEnd = () => {
      isDragging = false;
    };

    const onScroll = () => {
      checkFetchThreshold();
    };

    track.addEventListener('scroll', onScroll, { passive: true });
    track.addEventListener('mousedown', onDown);
    track.addEventListener('touchstart', onTouchStart, { passive: true });
    track.addEventListener('touchmove', onTouchMove, { passive: true });
    track.addEventListener('touchend', onTouchEnd);

    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      track.removeEventListener('scroll', onScroll);
      track.removeEventListener('mousedown', onDown);
      track.removeEventListener('touchstart', onTouchStart);
      track.removeEventListener('touchmove', onTouchMove);
      track.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [displayItems, fetchNextPage]);



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
          user-select: none;
          -webkit-user-select: none;
        }
        .featured-track img,
        .featured-track video {
          -webkit-user-drag: none;
          user-drag: none;
        }
        .featured-track::-webkit-scrollbar { display: none; }
      `}</style>

      {/* Header — always visible, no animation */}
      <div className="absolute top-12 md:top-16 left-0 w-full px-8 md:px-16 flex justify-between items-end z-20">
        <div>
          <span className="text-[10px] font-mono tracking-[0.4em] text-plum-400 block mb-2">{t("featured.atelier", "TILET3D ATELIER")}</span>
          <h2 className="text-3xl md:text-5xl font-light tracking-tight">{t("featured.title", "Featured Collection")}</h2>
        </div>
        <p className="text-neutral-500 font-normal text-xl hidden md:block">{t("featured.tagline", "የተኛውን መረጡ?")}</p>
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


          <div
            ref={trackRef}
            onClickCapture={(e) => {
              if (wasDraggedRef.current) {
                e.preventDefault();
                e.stopPropagation();
              }
            }}
            className="w-full overflow-x-auto featured-track cursor-grab active:cursor-grabbing pb-8 pt-8 select-none"
          >
            <div className="flex gap-8 md:gap-12 px-8 md:px-[15vw] w-max">
              {displayItems.map((item, index) => (
                <FeaturedCard
                  key={`${item.uniqueKey}-${index}`}
                  item={item}
                  onClick={() => navigate(`/products/${item.product.id}`)}
                />
              ))}
              {isFetchingMore && (
                <div className="w-[260px] md:w-[360px] h-[380px] md:h-[520px] rounded-[24px] md:rounded-[32px] overflow-hidden border border-white/[0.08] bg-neutral-900/60 backdrop-blur-xl shrink-0 flex flex-col items-center justify-center gap-3">
                  <div className="w-8 h-8 rounded-full border-2 border-amber-400/30 border-t-amber-400 animate-spin" />
                  <span className="text-[10px] font-mono tracking-widest text-neutral-400 uppercase">
                    {t("featured.loadingMore", "Loading More...")}
                  </span>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[60vw] h-[100px] bg-plum-900/10 blur-[100px] rounded-full pointer-events-none" />
    </section>
  );
};

export default FeaturedCollectionSection;