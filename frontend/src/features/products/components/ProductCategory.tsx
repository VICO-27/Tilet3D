// src/components/products/ProductCategory.tsx
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { ClothingItem } from "../../avatar/types/avatar.types";

type ProductCategoryProps = {
  id: string;
  title: string;
  itemCount?: number;
  autoScroll?: "left" | "right" | "none";
  videoPattern?: "odd-videos" | "even-videos";
  scrollRef?: React.RefObject<HTMLDivElement | null>;
  onScrollAction?: (e: React.UIEvent<HTMLDivElement>) => void;
};

const ProductCategory = ({
  id,
  title,
  itemCount = 6,
  autoScroll = "none",
  videoPattern = "odd-videos",
  scrollRef,
  onScrollAction,
}: ProductCategoryProps) => {
  const navigate = useNavigate();
  const localRef = useRef<HTMLDivElement>(null);
  const finalRef = scrollRef || localRef;
  const [likedItems, setLikedItems] = useState<{ [key: number]: boolean }>({});
  const [hoveredIndices, setHoveredIndices] = useState<{ [key: number]: number }>({});
  const accurateScrollPos = useRef(0);
  const [videoErrors, setVideoErrors] = useState<{ [key: number]: boolean }>({});

  useEffect(() => {
    if (autoScroll === "none" || !finalRef.current) return;

    const scrollContainer = finalRef.current;
    let animationId: number;

    if (autoScroll === "right") {
      accurateScrollPos.current = scrollContainer.scrollWidth - scrollContainer.clientWidth;
      scrollContainer.scrollLeft = accurateScrollPos.current;
    } else {
      accurateScrollPos.current = scrollContainer.scrollLeft;
    }

    const executeScroll = () => {
      if (!scrollContainer) return;
      const maxScrollableWidth = scrollContainer.scrollWidth - scrollContainer.clientWidth;
      if (maxScrollableWidth <= 0) {
        animationId = requestAnimationFrame(executeScroll);
        return;
      }

      const cinematicSpeedRate = 0.18;

      if (autoScroll === "left") {
        accurateScrollPos.current += cinematicSpeedRate;
        if (accurateScrollPos.current >= maxScrollableWidth) accurateScrollPos.current = 0;
      } else if (autoScroll === "right") {
        accurateScrollPos.current -= cinematicSpeedRate;
        if (accurateScrollPos.current <= 0) accurateScrollPos.current = maxScrollableWidth;
      }

      scrollContainer.scrollLeft = accurateScrollPos.current;
      animationId = requestAnimationFrame(executeScroll);
    };

    animationId = requestAnimationFrame(executeScroll);

    const freezeScroll = () => cancelAnimationFrame(animationId);
    const unfreezeScroll = () => {
      cancelAnimationFrame(animationId);
      accurateScrollPos.current = scrollContainer.scrollLeft;
      animationId = requestAnimationFrame(executeScroll);
    };

    scrollContainer.addEventListener("mouseenter", freezeScroll);
    scrollContainer.addEventListener("mouseleave", unfreezeScroll);

    return () => {
      cancelAnimationFrame(animationId);
      scrollContainer.removeEventListener("mouseenter", freezeScroll);
      scrollContainer.removeEventListener("mouseleave", unfreezeScroll);
    };
  }, [autoScroll, finalRef]);

  const handleLikeToggle = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    setLikedItems((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const assignCardWidth = (cardIndex: number) => {
    if (cardIndex % 3 === 0) return "w-[300px] md:w-[360px]";
    if (cardIndex % 3 === 1) return "w-[360px] md:w-[440px]";
    return "w-[260px] md:w-[310px]";
  };

  // Build all 3 variants of a product item as ClothingItem[]
  // so the avatar panel shows all 3 variants vertically
  const buildClothingVariants = (itemNum: number): ClothingItem[] =>
    [1, 2, 3].map((v) => ({
      id: `${id}-${itemNum}-${v}`,
      name: `${title} Design #${itemNum}`,
      brand: "Tilet3D Atelier",
      image: `/products/images/${id}/${id}${itemNum}-${v}.jpg`,
      variantGroup: `${id}-${itemNum}`,
      variantIndex: v,
      category: title,
      price: 3400,
    }));

  const handleTryOn = (
    e: React.MouseEvent,
    itemNum: number,
    activeVariant: number
  ) => {
    e.stopPropagation();
    const allVariants = buildClothingVariants(itemNum);
    // Put the currently hovered variant first so it's pre-selected
    const reordered = [
      allVariants[activeVariant - 1],
      ...allVariants.filter((_, i) => i !== activeVariant - 1),
    ];
    navigate("/avatar", { state: { clothing: reordered } });
  };

  const itemsArray = Array.from({ length: itemCount }, (_, i) => i + 1);

  return (
    <section id={id} className="py-0 my-0 bg-white block w-full overflow-hidden select-none">
      <div
        ref={finalRef}
        onScroll={(e) => {
          if (autoScroll !== "none") {
            accurateScrollPos.current = e.currentTarget.scrollLeft;
          }
          if (onScrollAction) onScrollAction(e);
        }}
        className="flex overflow-x-auto gap-0 p-0 m-0 scrollbar-hide w-full transform-gpu"
        style={{
          WebkitOverflowScrolling: "touch",
          willChange: "scroll-position, transform",
        }}
      >
        {itemsArray.map((itemNum, index) => {
          const isLiked = !!likedItems[index];
          const activeVariant = hoveredIndices[index] || 1;

          const imagePath = `/products/images/${id}/${id}${itemNum}-${activeVariant}.jpg`;
          const videoPath = `/products/videos/${id}/${id}-loop${itemNum}-${activeVariant}.mp4`;

          const isOdd = itemNum % 2 !== 0;
          const targetVideoSlot = videoPattern === "odd-videos" ? isOdd : !isOdd;
          const shouldPlayVideo = targetVideoSlot && !videoErrors[index];

          return (
            <div
              key={itemNum}
              className={`flex-shrink-0 relative group overflow-hidden bg-neutral-100 border-none p-0 m-0 cursor-pointer ${assignCardWidth(index)}`}
              onMouseEnter={() =>
                setHoveredIndices((prev) => ({ ...prev, [index]: 2 }))
              }
              onMouseLeave={() =>
                setHoveredIndices((prev) => ({ ...prev, [index]: 1 }))
              }
              onClick={(e) => handleTryOn(e, itemNum, activeVariant)}
            >
              {/* Media Container */}
              <div className="w-full h-[520px] relative p-0 m-0 overflow-hidden">
                {shouldPlayVideo ? (
                  <video
                    key={videoPath}
                    src={videoPath}
                    loop
                    muted
                    playsInline
                    autoPlay
                    className="w-full h-full object-cover p-0 m-0 transition-transform duration-[1200ms] ease-out group-hover:scale-[1.04]"
                    onError={() =>
                      setVideoErrors((prev) => ({ ...prev, [index]: true }))
                    }
                  />
                ) : (
                  <img
                    src={imagePath}
                    alt={`${title} view`}
                    className="w-full h-full object-cover p-0 m-0 transition-transform duration-[1200ms] ease-out group-hover:scale-[1.04]"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "https://images.unsplash.com/photo-1544441893-675973e31985?q=80&w=600";
                    }}
                  />
                )}

                {/* Variant dots */}
                <div className="absolute bottom-28 left-6 z-20 flex space-x-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  {[1, 2, 3].map((v) => (
                    <span
                      key={v}
                      onMouseEnter={(e) => {
                        e.stopPropagation();
                        setHoveredIndices((prev) => ({ ...prev, [index]: v }));
                      }}
                      className={`w-2 h-2 rounded-full cursor-pointer transition-all ${
                        activeVariant === v
                          ? "bg-purple-500 scale-125"
                          : "bg-white/60 hover:bg-white"
                      }`}
                    />
                  ))}
                </div>

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-black/15 opacity-0 group-hover:opacity-100 transition-opacity duration-700 z-10" />
              </div>

              {/* Heart button */}
              <div className="absolute top-4 right-4 z-20">
                <button
                  type="button"
                  onClick={(e) => handleLikeToggle(e, index)}
                  className={`p-3 rounded-full backdrop-blur-md transition-all transform active:scale-90 ${
                    isLiked
                      ? "bg-purple-600 text-white"
                      : "bg-black/15 text-white/90 hover:bg-black/40 hover:text-white"
                  }`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    strokeWidth="2.5"
                    stroke="currentColor"
                    className={`w-4 h-4 transition-transform duration-300 ${
                      isLiked ? "scale-110 fill-white" : "fill-none"
                    }`}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
                    />
                  </svg>
                </button>
              </div>

              {/* Product info + Try On button */}
              <div className="absolute inset-x-0 bottom-0 p-6 flex flex-col justify-end opacity-0 group-hover:opacity-100 group-hover:translate-y-0 translate-y-6 transition-all duration-700 ease-out z-20">
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.25em] text-purple-400 font-extrabold mb-0.5">
                      Premium Fabric
                    </p>
                    <h3 className="text-base font-black text-white tracking-wide">
                      {title} Design #{itemNum}
                    </h3>
                    <p className="text-xs font-bold text-neutral-300 mt-0.5">
                      ETB 3,400.00
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => handleTryOn(e, itemNum, activeVariant)}
                    className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-[11px] uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-colors"
                  >
                    Try On Avatar
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default ProductCategory;
