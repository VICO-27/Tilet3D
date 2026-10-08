import React, { useEffect, useState, useRef } from "react";
import { aiApi } from "../api/aiApi";
import ProductCard from "../../products/components/ProductCard";
import { Product } from "../../products/types";

interface AiRecommendationsProps {
  productId: string;
}

export const AiRecommendations: React.FC<AiRecommendationsProps> = ({ productId }) => {
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;
    aiApi
      .getRecommendations(productId)
      .then((data) => {
        if (isMounted) setRecommendations(data);
      })
      .catch((err) => console.error("Failed to load recommendations", err))
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [productId]);

  // Infinite Scroll Marquee Engine
  useEffect(() => {
    const track = scrollRef.current;
    if (!track || recommendations.length === 0) return;

    let animationFrameId: number;
    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;

    const speed = 0.5; // Very slow tortoise speed as requested previously for cultural items

    const autoScroll = () => {
      if (!isDown) {
        track.scrollLeft += speed;
        const third = track.scrollWidth / 3;

        // Seamless wrap around
        if (track.scrollLeft >= third * 2) {
          track.scrollLeft -= third;
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
      const walk = (x - startX) * 2;
      track.scrollLeft = scrollLeft - walk;
    };

    const onScroll = () => {
      const third = track.scrollWidth / 3;
      if (track.scrollLeft >= third * 2) {
        track.scrollLeft -= third;
      } else if (track.scrollLeft <= 0) {
        track.scrollLeft += third;
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
  }, [recommendations.length]);

  if (loading || recommendations.length === 0) return null;

  const displayItems = [...recommendations, ...recommendations, ...recommendations];

  return (
    <section className="my-16">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-white">
            Curated For Your Taste
          </h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            AI-powered similarity matches based on your aesthetic style profile.
          </p>
        </div>
      </div>
      
      {/* Container must mask overflow */}
      <div className="relative -mx-6 px-6 md:-mx-8 md:px-8">
        <div
          ref={scrollRef}
          className="flex gap-6 overflow-x-auto hide-scrollbar cursor-grab active:cursor-grabbing"
          style={{ 
            scrollbarWidth: "none", 
            msOverflowStyle: "none"
          }}
        >
          {displayItems.map((product, idx) => (
            <div 
              key={`${product.id}-${idx}`}
              className="w-[280px] sm:w-[320px] shrink-0"
            >
              <ProductCard product={product} index={idx} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};