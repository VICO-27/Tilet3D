import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
  memo,
} from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Sparkles,
  ArrowDown,
  Layers,
  Shirt,
  Check,
  ArrowRight,
  ShoppingBag,
} from "lucide-react";
import { useCartStore } from "../../../app/store/useCartStore";
import { useToastStore } from "../../../app/store/useToastStore";
import { Product } from "../../products/types";
import { productApi } from "../../products/api/productApi";
import {
  optimizeCloudinaryUrl,
  optimizeCloudinaryVideoUrl,
} from "../../../shared/utils/cloudinary";
import {
  getCategoryName,
  getProductViews,
  computeGeometry,
  SidebarItem,
  ShowcaseGeometry,
} from "../utils/showcaseHelpers";

// ─────────────────────────────────────────────────────────────────────────────
// Types & Constants
// ─────────────────────────────────────────────────────────────────────────────

interface FashionDiscoveryShowcaseProps {
  onSelectForFitting: (product: Product) => void;
  onScrollToFittingRoom: () => void;
  initialProductId?: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Subcomponent: Orbit Showcase Card
// ─────────────────────────────────────────────────────────────────────────────

interface OrbitCardProps {
  product: Product;
  index: number;
  isActive: boolean;
  activeMediaUrl?: string | null;
  geometry: ShowcaseGeometry;
  registerEl: (index: number, el: HTMLDivElement | null) => void;
  onSelect: (index: number) => void;
}

const OrbitCard = memo(
  ({
    product,
    index,
    isActive,
    activeMediaUrl,
    geometry,
    registerEl,
    onSelect,
  }: OrbitCardProps) => {
    const { t } = useTranslation();
    const [imgLoaded, setImgLoaded] = useState(false);
    const videoRef = useRef<HTMLVideoElement | null>(null);

    const primaryMedia =
      product.media?.find((m) => m.is_primary) || product.media?.[0];
    const displayUrl = activeMediaUrl || primaryMedia?.file || null;
    const isVideo =
      displayUrl?.includes(".mp4") ||
      product.media?.some((m) => m.file === displayUrl && m.media_type === "video");

    const categoryName = getCategoryName(product);
    const price = product.variants?.[0]?.price;
    const formattedPrice = price
      ? `${Number(price).toLocaleString()} ETB`
      : t("products.bespokeCouture", "Bespoke Couture");

    useEffect(() => {
      if (videoRef.current) {
        if (isActive) {
          videoRef.current.play().catch(() => {});
        } else {
          videoRef.current.pause();
        }
      }
    }, [isActive]);

    return (
      <div
        ref={(el) => registerEl(index, el)}
        role="button"
        tabIndex={isActive ? 0 : -1}
        aria-label={`${product.name} - ${categoryName}`}
        aria-current={isActive ? "true" : undefined}
        onClick={() => onSelect(index)}
        className="absolute left-0 top-0 cursor-pointer select-none outline-none group"
        style={{
          width: geometry.cardW,
          height: geometry.cardH,
          opacity: 0,
          willChange: "transform, opacity, filter",
          transformOrigin: "center center",
          backfaceVisibility: "hidden",
        }}
      >
        <div
          className={`relative w-full h-full rounded-[24px] md:rounded-[30px] overflow-hidden transition-all duration-300 bg-white border ${
            isActive
              ? "border-plum-500 shadow-[0_24px_60px_-15px_rgba(162,28,175,0.25)] ring-2 ring-plum-400/30"
              : "border-stone-200/90 shadow-[0_14px_35px_-15px_rgba(0,0,0,0.08)] hover:border-stone-300"
          }`}
        >
          {/* Pure clean studio white background */}
          <div className="absolute inset-0 bg-white" />

          {/* Skeleton placeholder while loading */}
          {!imgLoaded && !isVideo && (
            <div className="absolute inset-0 bg-stone-50 animate-pulse flex items-center justify-center">
              <Shirt className="w-8 h-8 text-stone-200 animate-pulse" />
            </div>
          )}

          {/* Media Presentation */}
          {displayUrl && isVideo ? (
            <video
              ref={videoRef}
              src={optimizeCloudinaryVideoUrl(displayUrl)}
              loop
              muted
              playsInline
              preload="metadata"
              className="absolute inset-0 w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
            />
          ) : displayUrl ? (
            <img
              src={optimizeCloudinaryUrl(
                displayUrl,
                "c_fill,w_600,h_900,q_auto,f_auto"
              )}
              alt={product.name}
              loading="lazy"
              decoding="async"
              draggable={false}
              onLoad={() => setImgLoaded(true)}
              className={`absolute inset-0 w-full h-full object-cover object-top transition-[opacity,transform] duration-700 group-hover:scale-105 ${
                imgLoaded ? "opacity-100" : "opacity-0"
              }`}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-stone-300 text-xs font-mono">
              {t("products.noImage", "No Preview")}
            </div>
          )}

          {/* Clean contrast vignette gradient */}
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          {/* Active Center Card Glow Badge */}
          {isActive && (
            <div className="absolute top-3.5 left-3.5 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/95 backdrop-blur-md shadow-xs border border-stone-200/60">
              <span className="w-1.5 h-1.5 rounded-full bg-plum-600 animate-ping" />
              <span className="text-[9px] font-mono font-semibold tracking-wider uppercase text-plum-900">
                {t("featured.selectedLook", "Active Look")}
              </span>
            </div>
          )}

          {/* Product Info Overlay */}
          <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4 md:p-5 z-20 flex flex-col justify-end text-white">
            <span className="text-[8px] md:text-[9.5px] font-mono tracking-[0.25em] uppercase text-plum-200 block drop-shadow-xs">
              {categoryName}
            </span>
            <h3 className="font-serif text-sm md:text-base font-medium tracking-tight text-white line-clamp-1 mt-0.5 drop-shadow-xs">
              {product.name}
            </h3>
            <div className="mt-1 flex items-center justify-between gap-1.5 text-[10px] sm:text-[11px] md:text-xs min-w-0">
              <span className="font-medium text-white font-mono tracking-tight truncate">
                {formattedPrice}
              </span>
              <span
                className={`text-[9px] sm:text-[10px] uppercase tracking-wider text-plum-300 font-medium shrink-0 whitespace-nowrap transition-opacity duration-300 ${
                  isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                }`}
              >
                {t("common.details", "Details")} →
              </span>
            </div>
          </div>
        </div>

        {/* Soft studio ground shadow */}
        {isActive && (
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-[85%] h-5 bg-stone-900/10 blur-xl rounded-full pointer-events-none" />
        )}
      </div>
    );
  }
);
OrbitCard.displayName = "OrbitCard";

// ─────────────────────────────────────────────────────────────────────────────
// Subcomponent: Right-Side Panel (STRICTLY MAXIMUM 3 ITEMS)
// ─────────────────────────────────────────────────────────────────────────────

interface SidebarPanelProps {
  activeProduct: Product;
  sidebarItems: SidebarItem[];
  selectedViewUrl: string | null;
  onSelectView: (url: string) => void;
  onSelectProduct: (product: Product) => void;
  onTryOn: (product: Product) => void;
}

const SidebarPanel: React.FC<SidebarPanelProps> = ({
  activeProduct,
  sidebarItems,
  selectedViewUrl,
  onSelectView,
  onSelectProduct,
  onTryOn,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const addToCart = useCartStore((s) => s.addToCart);
  const isAdded = useCartStore((s) => s.isAdded);
  const showToast = useToastStore((s) => s.show);

  const primaryVariant = activeProduct.variants?.[0];
  const price = primaryVariant?.price
    ? `${Number(primaryVariant.price).toLocaleString()} ETB`
    : t("products.bespokeCouture", "Bespoke");

  // Calculate bundle total price
  const totalBundlePrice = useMemo(() => {
    let sum = 0;
    const base = Number(activeProduct.variants?.[0]?.price) || 0;
    sum += base;
    sidebarItems.forEach((it) => {
      if (it.type === "alternative") {
        sum += Number(it.product.variants?.[0]?.price) || 0;
      }
    });
    return sum > 0 ? `${sum.toLocaleString()} ETB` : price;
  }, [activeProduct, sidebarItems, price]);

  const handleBuy = async (e: React.MouseEvent, item: SidebarItem) => {
    e.stopPropagation();
    const prod = item.type === "view" ? activeProduct : item.product;
    const variantId =
      prod.default_variant_id || prod.variants?.[0]?.id || prod.id;

    if (!variantId) {
      showToast(t("products.unavailable", "Item currently unavailable"), "error");
      return;
    }

    if (!localStorage.getItem("tilet3d_access_token")) {
      showToast(t("auth.signInRequired", "Please sign in to add to bag"), "error");
      navigate("/account");
      return;
    }

    if (isAdded(variantId)) {
      showToast(t("cart.alreadyInCart", "Already in your bag"), "success");
      return;
    }

    const success = await addToCart(variantId, 1);
    if (success) {
      showToast(t("cart.addedSuccess", `Added ${prod.name} to bag`), "success");
    } else {
      showToast(t("cart.addFailed", "Could not add to bag"), "error");
    }
  };

  return (
    <aside
      aria-label={t("featured.inThisLook", "In this look")}
      className="flex flex-col h-full bg-white border-l border-stone-200/80 p-4 xl:p-6 justify-between overflow-hidden select-none"
    >
      {/* Panel Top Header — aligned horizontally with 'Try the Look.' */}
      <div className="shrink-0 pb-2.5 border-b border-stone-100">
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-lg xl:text-xl font-light tracking-tight text-stone-900">
            {t("featured.inThisLook", "In this look")}
          </h3>
          <span className="text-[11px] font-mono tracking-widest text-stone-400 uppercase font-medium">
            {sidebarItems.length} {sidebarItems.length === 1 ? "Item" : "Items"}
          </span>
        </div>
        <p className="text-[11px] text-stone-400 font-light mt-1 truncate">
          {t("featured.piecesDetail", "Calibrated Ethiopian couture pieces in this look.")}
        </p>
      </div>

      {/* The 3-Item List: Fixed height layout with zero overflow */}
      <div className="flex-1 my-2 flex flex-col justify-evenly divide-y divide-stone-100 min-h-0 overflow-hidden">
        {sidebarItems.length === 0 ? (
          <div className="py-6 text-center text-xs text-stone-400 font-light">
            {t("featured.noItems", "No additional views or pieces available.")}
          </div>
        ) : (
          sidebarItems.slice(0, 3).map((item, idx) => {
            if (item.type === "view") {
              const isSelected = selectedViewUrl === item.url;
              const prod = activeProduct;
              const variantId =
                prod.default_variant_id || prod.variants?.[0]?.id || prod.id;
              const inBag = variantId ? isAdded(variantId) : false;

              return (
                <button
                  key={`view-${item.id}-${idx}`}
                  type="button"
                  onClick={() => onSelectView(item.url)}
                  className={`w-full group py-2 xl:py-2.5 flex items-center gap-3 text-left transition-all ${
                    isSelected ? "bg-plum-50/40 -mx-1.5 px-1.5 rounded-xl" : ""
                  }`}
                >
                  {/* Thumbnail */}
                  <div className="relative w-20 h-24 xl:w-24 xl:h-28 rounded-2xl overflow-hidden bg-stone-50 border border-stone-200/70 shrink-0 shadow-2xs">
                    {item.mediaType === "video" ? (
                      <video
                        src={optimizeCloudinaryVideoUrl(item.url)}
                        muted
                        playsInline
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <img
                        src={optimizeCloudinaryUrl(
                          item.url,
                          "c_fill,w_240,h_280,q_auto,f_auto"
                        )}
                        alt={item.label}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    )}
                  </div>

                  {/* Meta */}
                  <div className="min-w-0 flex-1">
                    <span className="text-[8.5px] font-mono tracking-widest uppercase text-stone-400 font-semibold block">
                      {idx === 0 ? "ANGLE 1" : `PERSPECTIVE ${idx + 1}`}
                    </span>
                    <h4 className="text-xs xl:text-sm font-medium text-stone-900 truncate mt-0.5 group-hover:text-plum-700 transition-colors">
                      {item.label}
                    </h4>
                    <p className="text-[11px] font-mono text-stone-500 mt-0.5">
                      {t("featured.includedAngle", "Look Angle")}
                    </p>
                  </div>

                  {/* Buy Button */}
                  <button
                    type="button"
                    onClick={(e) => handleBuy(e, item)}
                    className={`px-3 py-1.5 rounded-full text-[11px] font-semibold uppercase tracking-wider transition-all duration-200 shrink-0 flex items-center gap-1.5 shadow-2xs ${
                      inBag
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-300"
                        : "bg-purple-600 hover:bg-purple-700 text-white hover:shadow-xs active:scale-95"
                    }`}
                    title={inBag ? "In your bag" : `Add ${prod.name} to bag`}
                  >
                    {inBag ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span>{t("cart.inBag", "In Bag")}</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-3 h-3 text-white" />
                        <span>{t("products.buy", "Buy")}</span>
                      </>
                    )}
                  </button>
                </button>
              );
            }

            // Category Alternative item
            const prod = item.product;
            const variantId =
              prod.default_variant_id || prod.variants?.[0]?.id || prod.id;
            const inBag = variantId ? isAdded(variantId) : false;

            return (
              <button
                key={`alt-${item.product.id}-${idx}`}
                type="button"
                onClick={() => onSelectProduct(item.product)}
                className="w-full group py-2 xl:py-2.5 flex items-center gap-3 text-left transition-all hover:bg-stone-50/60 -mx-1.5 px-1.5 rounded-xl"
              >
                {/* Thumbnail */}
                <div className="relative w-20 h-24 xl:w-24 xl:h-28 rounded-2xl overflow-hidden bg-stone-50 border border-stone-200/70 shrink-0 shadow-2xs">
                  <img
                    src={optimizeCloudinaryUrl(
                      item.url,
                      "c_fill,w_240,h_280,q_auto,f_auto"
                    )}
                    alt={item.product.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>

                {/* Meta */}
                <div className="min-w-0 flex-1">
                  <span className="text-[8.5px] font-mono tracking-widest uppercase text-stone-400 font-semibold block">
                    {idx === 0 ? "MATCHING 1" : `PIECE ${idx + 1}`}
                  </span>
                  <h4 className="text-xs xl:text-sm font-medium text-stone-900 truncate mt-0.5 group-hover:text-amber-800 transition-colors">
                    {item.product.name}
                  </h4>
                  <p className="text-[11px] font-mono text-stone-600 mt-0.5 font-medium">
                    {item.product.variants?.[0]?.price
                      ? `${Number(item.product.variants[0].price).toLocaleString()} ETB`
                      : "Bespoke"}
                  </p>
                </div>

                {/* Buy Button */}
                <button
                  type="button"
                  onClick={(e) => handleBuy(e, item)}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-semibold uppercase tracking-wider transition-all duration-200 shrink-0 flex items-center gap-1.5 shadow-2xs ${
                    inBag
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-300"
                      : "bg-purple-600 hover:bg-purple-700 text-white hover:shadow-xs active:scale-95"
                  }`}
                  title={inBag ? "In your bag" : `Add ${prod.name} to bag`}
                >
                  {inBag ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span>{t("cart.inBag", "In Bag")}</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-3 h-3 text-white" />
                      <span>{t("products.buy", "Buy")}</span>
                    </>
                  )}
                </button>
              </button>
            );
          })
        )}
      </div>

      {/* Panel Bottom: Complete the look & Primary CTA */}
      <div className="pt-2.5 border-t border-stone-100 shrink-0">
        <div className="mb-2.5">
          <div className="flex items-baseline justify-between">
            <span className="font-serif text-sm font-light text-stone-800">
              {t("featured.completeLook", "Complete the look")}
            </span>
            <span className="font-mono text-xs font-semibold text-stone-900">
              {totalBundlePrice}
            </span>
          </div>
          <p className="text-[10.5px] text-stone-400 font-light mt-0.5 truncate">
            {t("featured.bundleNotice", "Calibrated for bespoke 3D fitting on your avatar.")}
          </p>
        </div>

        <button
          type="button"
          onClick={() => onTryOn(activeProduct)}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-medium text-xs tracking-wider uppercase shadow-md shadow-purple-600/20 active:scale-98 transition-all"
        >
          <Sparkles className="w-3.5 h-3.5 text-white/90" />
          <span>{t("featured.tryOnAvatar", "Fit on 3D Avatar")}</span>
          <ArrowRight className="w-4 h-4 text-white" />
        </button>
      </div>
    </aside>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Component: FashionDiscoveryShowcase
// ─────────────────────────────────────────────────────────────────────────────

export const FashionDiscoveryShowcase: React.FC<
  FashionDiscoveryShowcaseProps
> = ({
  onSelectForFitting,
  onScrollToFittingRoom,
  initialProductId,
}) => {
  const { t } = useTranslation();

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [activeMediaOverride, setActiveMediaOverride] = useState<
    Record<string, string>
  >({});

  const stageRef = useRef<HTMLDivElement | null>(null);
  const cardEls = useRef<Map<number, HTMLDivElement>>(new Map());
  const [geometry, setGeometry] = useState<ShowcaseGeometry | null>(null);
  const geoRef = useRef<ShowcaseGeometry | null>(null);

  // Carousel physics and continuous auto-scroll state
  const posRef = useRef(0);
  const targetPosRef = useRef<number | null>(null);
  const activeIndexRef = useRef(0);
  const isHoveredRef = useRef(false);
  const isDraggingRef = useRef(false);
  const pointerStartX = useRef<number | null>(null);
  const dragStartPos = useRef(0);
  const hasDraggedRef = useRef(false);

  const rafRef = useRef(0);
  const lastTimeRef = useRef(0);
  const tickRef = useRef<(now: number) => void>(() => {});

  // Synchronize ref state in effects
  useEffect(() => {
    geoRef.current = geometry;
  }, [geometry]);

  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  // 1. Fetch initial products from API
  useEffect(() => {
    let isMounted = true;

    const loadProducts = async () => {
      try {
        setIsLoading(true);
        const [featuredRes, catalogRes] = await Promise.all([
          productApi.getFeaturedProducts().catch(() => ({ results: [] })),
          productApi.getProducts(undefined, 1, 40).catch(() => ({ results: [] })),
        ]);

        const rawList = [
          ...(featuredRes.results || []),
          ...(catalogRes.results || []),
        ];

        const seenIds = new Set<string>();
        const validList: Product[] = [];

        rawList.forEach((p) => {
          if (!p?.id || seenIds.has(p.id)) return;
          if (!p.media || p.media.length === 0) return;
          seenIds.add(p.id);
          validList.push(p);
        });

        if (isMounted) {
          setProducts(validList);

          if (initialProductId && validList.length > 0) {
            const foundIdx = validList.findIndex((p) => p.id === initialProductId);
            if (foundIdx !== -1) {
              setActiveIndex(foundIdx);
              posRef.current = foundIdx;
              targetPosRef.current = foundIdx;
            }
          }
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Failed to load products for discovery showcase", err);
        if (isMounted) setIsLoading(false);
      }
    };

    loadProducts();
    return () => {
      isMounted = false;
    };
  }, [initialProductId]);

  // Measure stage dimensions and derive 3D orbit geometry
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;

    const update = () => {
      const W = el.clientWidth;
      const H = el.clientHeight || 560;
      if (W > 0) {
        setGeometry(computeGeometry(W, H));
      }
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [isLoading]);

  // ─────────────────────────────────────────────────────────────────────────
  // Imperative 3D Circular Orbit Layout
  // - Vertically STRAIGHT: All cards aligned on horizontal midline (centerY).
  // - Symmetrical scaling: Cards shrink from BOTH top and bottom.
  // - Real 3D depth: Cards genuinely circle in and out with translate3d and rotateY.
  // ─────────────────────────────────────────────────────────────────────────
  const apply3DCircleLayout = useCallback(
    (pos: number) => {
      const g = geoRef.current;
      const N = products.length;
      if (!g || N === 0) return;

      cardEls.current.forEach((el, index) => {
        // Calculate shortest angular distance along periodic circle
        let diff = index - pos;
        while (diff < -N / 2) diff += N;
        while (diff > N / 2) diff -= N;

        const absDiff = Math.abs(diff);

        // STRICTLY ONLY 5 CARDS VISIBLE:
        // 1st: main center (absDiff <= 0.5)
        // 2nd & 3rd: flanking left/right (absDiff ~ 1)
        // 4th & 5th: far left/right with blur (absDiff ~ 2)
        // Beyond 2.45: completely hidden
        if (absDiff >= 2.45) {
          el.style.opacity = "0";
          el.style.visibility = "hidden";
          el.style.pointerEvents = "none";
          return;
        }

        el.style.visibility = "visible";

        // Angular position along circular orbit
        const theta = diff * g.stepAngle;
        const sinTheta = Math.sin(theta);

        // X coordinate: centered, spaced with clear gaps across the stage
        const x = g.W / 2 + g.rx * sinTheta - g.cardW / 2;

        // Strictly straight horizontal baseline/centerline: zero pyramid droop!
        const y = g.centerY;

        // Z depth: 1st at 0, 2nd & 3rd farther, 4th & 5th much farther
        const z = -Math.pow(absDiff, 1.35) * 185;

        // Symmetrical scale: shrinks inward from BOTH top and bottom equally around center
        // 1st: scale = 1.0 | 2nd & 3rd: scale ~ 0.78 | 4th & 5th: scale ~ 0.58
        const scale = Math.max(0.55, 1.0 - 0.21 * absDiff);

        // Inward yaw rotation along circle
        const rotateY = -diff * g.stepAngle * (180 / Math.PI) * 0.42;

        // Opacity:
        // Center: 1.0 | 2nd & 3rd: ~0.90 | 4th & 5th: ~0.45
        // Smoothly dissolves to 0 between 2.1 and 2.45 so rotating cards enter/exit gracefully
        let opacity: number;
        if (absDiff <= 0.6) {
          opacity = 1.0;
        } else if (absDiff <= 1.4) {
          opacity = 0.95 - (absDiff - 0.6) * 0.12;
        } else if (absDiff <= 2.1) {
          opacity = 0.85 - (absDiff - 1.4) * 0.52;
        } else {
          opacity = Math.max(0, 0.48 * (1 - (absDiff - 2.1) / 0.35));
        }

        // Blur:
        // 1st (center): 0 (sharp)
        // 2nd & 3rd: minimal (0 to 0.5px)
        // 4th & 5th: "almost blur visibility" (3.8px to 4.8px)
        let blur = 0;
        if (absDiff > 0.8) {
          blur = Math.min(5.2, Math.pow(absDiff - 0.8, 1.5) * 2.9);
        }

        const zIndex = Math.round(1000 - absDiff * 200);

        el.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(
          2
        )}px, ${z.toFixed(2)}px) rotateY(${rotateY.toFixed(
          2
        )}deg) scale(${scale.toFixed(4)})`;
        el.style.opacity = opacity.toFixed(3);
        el.style.filter = blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : "none";
        el.style.zIndex = String(zIndex);
        el.style.pointerEvents = opacity < 0.2 ? "none" : "auto";
      });
    },
    [products.length]
  );

  // ─────────────────────────────────────────────────────────────────────────
  // Continuous Auto-Scroll Engine + Smooth Spring to Target
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    tickRef.current = (now: number) => {
      const dt = Math.min(0.05, Math.max(0.001, (now - lastTimeRef.current) / 1000));
      lastTimeRef.current = now;

      const N = products.length;
      if (N > 0) {
        if (!isDraggingRef.current) {
          if (targetPosRef.current !== null) {
            // Easing smoothly to user-requested target (next/prev or card click)
            let diff = targetPosRef.current - posRef.current;
            while (diff < -N / 2) diff += N;
            while (diff > N / 2) diff -= N;

            if (Math.abs(diff) < 0.002) {
              posRef.current = targetPosRef.current;
              targetPosRef.current = null;
            } else {
              posRef.current += diff * (1 - Math.exp(-dt * 6.5));
            }
          } else if (isPlaying) {
            // Continuous auto-scroll along the 3D circle:
            // Slows gently when user hovers so items are easy to inspect/click
            const speed = isHoveredRef.current ? 0.0006 : 0.0032;
            posRef.current += speed;
          }
        }

        // Normalize pos within [0, N)
        posRef.current = ((posRef.current % N) + N) % N;

        apply3DCircleLayout(posRef.current);

        // Synchronize active front card with right-hand panel
        const newActive = Math.round(posRef.current) % N;
        if (newActive !== activeIndexRef.current) {
          activeIndexRef.current = newActive;
          setActiveIndex(newActive);
        }
      }

      rafRef.current = requestAnimationFrame((n) => tickRef.current(n));
    };
  }, [products.length, isPlaying, apply3DCircleLayout]);

  // Launch RAF loop
  useEffect(() => {
    lastTimeRef.current = performance.now();
    rafRef.current = requestAnimationFrame((n) => tickRef.current(n));

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Jump to specific card smoothly
  const goTo = useCallback((index: number) => {
    targetPosRef.current = index;
  }, []);

  const goNext = useCallback(() => {
    const N = products.length;
    if (N === 0) return;
    const next = (Math.round(posRef.current) + 1) % N;
    targetPosRef.current = next;
  }, [products.length]);

  const goPrev = useCallback(() => {
    const N = products.length;
    if (N === 0) return;
    const prev = (Math.round(posRef.current) - 1 + N) % N;
    targetPosRef.current = prev;
  }, [products.length]);

  // Card element reference registration
  const registerEl = useCallback((index: number, el: HTMLDivElement | null) => {
    if (el) cardEls.current.set(index, el);
    else cardEls.current.delete(index);
  }, []);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      goNext();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      goPrev();
    } else if (e.key === "Home") {
      e.preventDefault();
      goTo(0);
    } else if (e.key === "End") {
      e.preventDefault();
      goTo(products.length - 1);
    } else if (e.key === "Enter" || e.key === " ") {
      const activeProd = products[activeIndexRef.current];
      if (activeProd) {
        onSelectForFitting(activeProd);
      }
    }
  };

  // Pointer drag interaction (direct manipulation of 3D circle)
  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    hasDraggedRef.current = false;
    pointerStartX.current = e.clientX;
    dragStartPos.current = posRef.current;
    targetPosRef.current = null;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current || pointerStartX.current === null) return;
    const dx = e.clientX - pointerStartX.current;
    if (Math.abs(dx) > 6) {
      hasDraggedRef.current = true;
    }
    const sensitivity = 0.0035;
    posRef.current = dragStartPos.current - dx * sensitivity;
  };

  const handlePointerUp = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    pointerStartX.current = null;
    // Snap gently to nearest integer on drag release
    targetPosRef.current = Math.round(posRef.current);
  };

  const handleCardClick = useCallback(
    (index: number) => {
      if (hasDraggedRef.current) return;
      if (index === activeIndexRef.current) {
        const prod = products[index];
        if (prod) onSelectForFitting(prod);
      } else {
        goTo(index);
      }
    },
    [goTo, products, onSelectForFitting]
  );

  // Active product & Right Sidebar Computation
  const activeProduct = products[activeIndex] || null;

  // Compute Sidebar Items (STRICTLY MAXIMUM 3 ITEMS)
  const sidebarItems = useMemo<SidebarItem[]>(() => {
    if (!activeProduct) return [];

    const result: SidebarItem[] = [];

    // Priority A: Genuine views of the active product
    const views = getProductViews(activeProduct);
    if (views.length > 1) {
      views.slice(0, 3).forEach((v) => result.push(v));
    } else if (views.length === 1) {
      result.push(views[0]);
    }

    // Priority B: Fill remaining slots up to 3 with category alternatives
    const needed = 3 - result.length;
    if (needed > 0 && products.length > 0) {
      const activeCat = getCategoryName(activeProduct);
      const categoryMatches = products.filter(
        (p) => p.id !== activeProduct.id && getCategoryName(p) === activeCat
      );

      const fallbackPool =
        categoryMatches.length > 0
          ? categoryMatches
          : products.filter((p) => p.id !== activeProduct.id);

      fallbackPool.slice(0, needed).forEach((p) => {
        const primaryImg =
          p.media?.find((m) => m.media_type === "image") || p.media?.[0];
        if (primaryImg?.file) {
          result.push({
            type: "alternative",
            product: p,
            url: primaryImg.file,
            mediaType: primaryImg.media_type,
            label: p.name,
            categoryName: getCategoryName(p),
          });
        }
      });
    }

    return result.slice(0, 3);
  }, [activeProduct, products]);

  // Selected view override for active product
  const activeMediaUrl = activeProduct
    ? activeMediaOverride[activeProduct.id] || null
    : null;

  const handleSelectView = (url: string) => {
    if (!activeProduct) return;
    setActiveMediaOverride((prev) => ({
      ...prev,
      [activeProduct.id]: url,
    }));
  };

  const handleSelectCategoryAlternative = (prod: Product) => {
    const idx = products.findIndex((p) => p.id === prod.id);
    if (idx !== -1) {
      goTo(idx);
    }
  };

  const handleTryOnActive = (prod: Product) => {
    onSelectForFitting(prod);
    onScrollToFittingRoom();
  };

  return (
    <section
      aria-label={t("featured.discoveryTitle", "Fashion Discovery Experience")}
      className="relative w-full h-[calc(100vh-48px)] min-h-[640px] flex flex-col lg:flex-row overflow-hidden bg-white text-stone-900 select-none"
      onMouseEnter={() => (isHoveredRef.current = true)}
      onMouseLeave={() => (isHoveredRef.current = false)}
    >
      {/* Left ~70%: Runway Stage, Header & Controls */}
      <div className="relative flex-1 flex flex-col justify-between h-full p-4 sm:p-6 lg:p-7 min-w-0 overflow-hidden">
        {/* Top Header Row — Moved up, NO 'TILET3D...' line, only single-line subtitle */}
        <header className="relative z-20 shrink-0 pt-0 pb-1">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-light tracking-tight text-stone-900 leading-none">
                {t("featured.tryTheLook", "Try the Look.")}
              </h1>
              <p className="text-xs sm:text-sm text-stone-400 font-light mt-1.5 truncate max-w-xl">
                {t(
                  "featured.shortSubtitle",
                  "For more information, tap a look to view pieces or fit on avatar."
                )}
              </p>
            </div>

            <button
              type="button"
              onClick={onScrollToFittingRoom}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium tracking-wider uppercase border border-stone-200 bg-white hover:bg-stone-50 shadow-xs active:scale-95 transition-all shrink-0"
            >
              <Shirt className="w-3.5 h-3.5 text-purple-600" />
              <span>{t("featured.toFittingRoom", "Avatar")}</span>
              <ArrowDown className="w-3 h-3 text-stone-400" />
            </button>
          </div>
        </header>

        {/* Middle Stage: 3D Runway with exactly 5 spaced-out visible cards */}
        <div className="relative flex-1 w-full flex items-center justify-center min-h-[360px] sm:min-h-[420px] overflow-hidden my-auto">
          {isLoading ? (
            <div className="w-full h-full flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-purple-200 border-t-purple-600 animate-spin" />
              <span className="font-mono text-xs uppercase tracking-widest text-stone-400">
                {t("featured.curatingLooks", "Curating Runway Looks...")}
              </span>
            </div>
          ) : products.length === 0 ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-center p-8">
              <Layers className="w-10 h-10 text-stone-300 mb-2" />
              <p className="text-sm text-stone-500 font-light">
                {t(
                  "featured.emptyCollection",
                  "No couture looks available in the discovery collection."
                )}
              </p>
            </div>
          ) : (
            <div
              ref={stageRef}
              tabIndex={0}
              role="region"
              aria-label={t(
                "featured.orbitLabel",
                "3D circular fashion runway carousel"
              )}
              onKeyDown={handleKeyDown}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              className="relative w-full h-full outline-none select-none rounded-3xl cursor-grab active:cursor-grabbing"
              style={{
                perspective: 1200,
                transformStyle: "preserve-3d",
                touchAction: "pan-y",
              }}
            >
              {geometry &&
                products.map((prod, index) => (
                  <OrbitCard
                    key={`orbit-card-${prod.id}`}
                    product={prod}
                    index={index}
                    isActive={index === activeIndex}
                    activeMediaUrl={activeMediaOverride[prod.id]}
                    geometry={geometry}
                    registerEl={registerEl}
                    onSelect={handleCardClick}
                  />
                ))}
            </div>
          )}
        </div>

        {/* Mobile/Tablet Fallback: Compact In This Look Drawer */}
        {activeProduct && (
          <div className="lg:hidden relative z-20 shrink-0 pt-2 pb-1 border-t border-stone-200">
            <div className="flex items-center justify-between mb-2 gap-2 min-w-0">
              <span className="text-[10px] font-mono tracking-widest uppercase text-purple-600 font-medium truncate">
                {t("featured.inThisLook", "In This Look")} ({sidebarItems.length})
              </span>
              <button
                type="button"
                onClick={() => handleTryOnActive(activeProduct)}
                className="text-[10px] font-semibold text-purple-700 uppercase tracking-wider underline underline-offset-2 shrink-0 whitespace-nowrap"
              >
                {t("featured.fitOnAvatar", "Fit on Avatar ↓")}
              </button>
            </div>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {sidebarItems.slice(0, 3).map((item, i) => (
                <button
                  key={`mobile-item-${i}`}
                  type="button"
                  onClick={() =>
                    item.type === "view"
                      ? handleSelectView(item.url)
                      : handleSelectCategoryAlternative(item.product)
                  }
                  className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-white border border-stone-200 shrink-0 text-left text-xs font-medium shadow-2xs whitespace-nowrap"
                >
                  <div className="w-8 h-8 rounded-lg overflow-hidden bg-stone-100 shrink-0">
                    <img
                      src={optimizeCloudinaryUrl(
                        item.url,
                        "c_fill,w_80,h_80,q_auto,f_auto"
                      )}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="truncate max-w-[110px] sm:max-w-[120px] text-[11px] text-stone-800">
                    {item.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Bottom Timeline Bar */}
        {products.length > 0 && (
          <footer className="relative z-20 flex items-center justify-between pt-2 border-t border-stone-100 shrink-0 text-stone-600 bg-white gap-2 min-w-0">
            {/* Controls: Prev / Numbers / Active Category / Next */}
            <div className="flex items-center gap-1 sm:gap-3 shrink-0">
              <button
                type="button"
                onClick={goPrev}
                aria-label={t("featured.prevLook", "Previous look")}
                className="p-1 sm:p-2 rounded-full hover:bg-stone-100 text-stone-700 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Look Number Indicator */}
              <div className="flex items-center gap-1.5 sm:gap-2 font-mono text-[11px] sm:text-xs">
                <span className="font-semibold text-stone-900">
                  {String(activeIndex + 1).padStart(2, "0")}
                </span>
                <span className="text-stone-300">/</span>
                <span>{String(products.length).padStart(2, "0")}</span>
              </div>

              {/* Active Runway Category Tag */}
              <span className="hidden sm:inline-block font-mono text-[10px] uppercase tracking-widest text-purple-700 px-2 py-0.5 rounded-full bg-purple-50 border border-purple-200/80">
                {activeProduct ? getCategoryName(activeProduct) : "Couture"}
              </span>

              <button
                type="button"
                onClick={goNext}
                aria-label={t("featured.nextLook", "Next look")}
                className="p-1 sm:p-2 rounded-full hover:bg-stone-100 text-stone-700 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Autoplay Toggle & Scroll Down Cue */}
            <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setIsPlaying((p) => !p)}
                className="inline-flex items-center gap-1 sm:gap-1.5 p-1 sm:px-2.5 sm:py-1 rounded-full text-[10px] font-mono uppercase tracking-wider text-stone-600 hover:text-stone-900 transition-colors shrink-0"
                title={isPlaying ? "Pause auto-rotation" : "Resume auto-rotation"}
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                    <span className="hidden sm:inline">Auto-Scroll ON</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                    <span className="hidden sm:inline">Auto-Scroll Paused</span>
                  </>
                )}
              </button>

              <div className="w-px h-3 bg-stone-200 hidden sm:block shrink-0" />

              <button
                type="button"
                onClick={onScrollToFittingRoom}
                className="inline-flex items-center gap-1 sm:gap-1.5 text-xs text-stone-600 hover:text-purple-700 transition-colors cursor-pointer group shrink-0"
              >
                <span className="text-[11px] font-light hidden sm:inline">
                  {t("featured.scrollDownPrompt", "Scroll down to 3D Avatar")}
                </span>
                <span className="text-[11px] font-medium text-purple-700 sm:hidden">
                  {t("featured.avatarShort", "Avatar")}
                </span>
                <ArrowDown className="w-3.5 h-3.5 text-purple-600 group-hover:translate-y-0.5 transition-transform shrink-0" />
              </button>
            </div>
          </footer>
        )}
      </div>

      {/* Right ~30%: Full-Height Product Panel aligned straight with "Try the Look." at top */}
      <div className="hidden lg:block w-[350px] xl:w-[400px] shrink-0 h-full overflow-hidden">
        {activeProduct && (
          <SidebarPanel
            activeProduct={activeProduct}
            sidebarItems={sidebarItems}
            selectedViewUrl={activeMediaUrl}
            onSelectView={handleSelectView}
            onSelectProduct={handleSelectCategoryAlternative}
            onTryOn={handleTryOnActive}
          />
        )}
      </div>
    </section>
  );
};
