// frontend/src/features/products/components/CategoryBlock.tsx
import React, { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ProductCard, { Product } from './ProductCard';
import RevealOnScroll from '@/shared/components/RevealOnScroll';
import { ArrowRight } from 'lucide-react';

interface Props {
  categoryName: string;
  products?: Product[];
}

const CategoryBlock: React.FC<Props> = ({
  categoryName,
  products = [],
}) => {
  const navigate = useNavigate();
  const row1Ref = useRef<HTMLDivElement>(null);
  const row2Ref = useRef<HTMLDivElement>(null);
  const row3Ref = useRef<HTMLDivElement>(null);

  // Split products safely into dynamic row arrays
  const row1Products = products.slice(0, 10);
  const row2Products = products.slice(10, 20);
  const row3Products = products.slice(20, 30);
  
  const hasRow2 = row2Products.length > 0;
  const hasRow3 = row3Products.length > 0;
  const hasMoreThan30 = products.length > 30;

  // 1. Row 1: Smooth Auto-Scroll with Manual Drag Overrides
  useEffect(() => {
    const r1 = row1Ref.current;
    if (!r1 || row1Products.length === 0) return;

    let animationFrameId: number;
    let isUserInteracting = false;
    let autoScrollSpeed = 1;

    const autoScroll = () => {
      if (!isUserInteracting) {
        r1.scrollLeft += autoScrollSpeed;
        const halfWidth = r1.scrollWidth / 2;
        if (r1.scrollLeft >= halfWidth) {
          r1.scrollLeft -= halfWidth;
        }
      }
      animationFrameId = requestAnimationFrame(autoScroll);
    };

    const handlePointerDown = () => { isUserInteracting = true; };
    const handlePointerUp = () => { isUserInteracting = false; };
    
    const handleScroll = () => {
      if (!isUserInteracting) return;
      const halfWidth = r1.scrollWidth / 2;
      if (r1.scrollLeft >= halfWidth) {
        r1.scrollLeft -= halfWidth;
      } else if (r1.scrollLeft <= 0) {
        r1.scrollLeft += halfWidth;
      }
    };

    r1.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointerup', handlePointerUp);
    r1.addEventListener('scroll', handleScroll, { passive: true });

    animationFrameId = requestAnimationFrame(autoScroll);

    return () => {
      cancelAnimationFrame(animationFrameId);
      r1.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointerup', handlePointerUp);
      r1.removeEventListener('scroll', handleScroll);
    };
  }, [row1Products]);

  // 2. Row 2 & Row 3: Instant Sync (Only links if BOTH exist)
  useEffect(() => {
    const r2 = row2Ref.current;
    const r3 = row3Ref.current;
    if (!r2 || !r3) return;

    let dynamicLock = false;

    const syncRows = (activeSource: HTMLDivElement, passiveTarget: HTMLDivElement) => {
      if (dynamicLock) return;
      dynamicLock = true;

      const sourceMax = activeSource.scrollWidth - activeSource.clientWidth;
      const targetMax = passiveTarget.scrollWidth - passiveTarget.clientWidth;

      if (sourceMax > 0 && targetMax > 0) {
        const ratio = activeSource.scrollLeft / sourceMax;
        passiveTarget.scrollLeft = targetMax - (ratio * targetMax);
      }
      
      dynamicLock = false;
    };

    const onRow2Scroll = () => syncRows(r2, r3);
    const onRow3Scroll = () => syncRows(r3, r2);

    r2.addEventListener('scroll', onRow2Scroll, { passive: true });
    r3.addEventListener('scroll', onRow3Scroll, { passive: true });

    return () => {
      r2.removeEventListener('scroll', onRow2Scroll);
      r3.removeEventListener('scroll', onRow3Scroll);
    };
  }, [hasRow2, hasRow3]);

  const hasVideoAsset = (p: Product) => {
    const media = p.media || [];
    return media.some(m => 
      m.media_type === 'video' || 
      m.file?.toLowerCase().endsWith('.mp4') || 
      m.url?.toLowerCase().endsWith('.mp4') ||
      p.video_url
    );
  };

  // If there are zero items in this whole category block, render nothing to avoid empty whitespace
  if (products.length === 0) return null;

  return (
    <section 
      id={`category-${categoryName}`} 
      className="w-full bg-white py-6 select-none overflow-hidden"
      style={{
        contain: 'layout paint',
        transform: 'translateZ(0)',
        willChange: 'transform'
      }}
    >
      <style>{`
        .smooth-scroll-container {
          -webkit-overflow-scrolling: touch;
          scroll-behavior: auto;
          scrollbar-width: none;
          overscroll-behavior-x: contain; 
        }
        .smooth-scroll-container::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      {/* ROW 1 */}
      {row1Products.length > 0 && (
        <div 
          ref={row1Ref}
          className="w-full flex overflow-x-auto smooth-scroll-container border-b border-zinc-100 cursor-grab active:cursor-grabbing"
        >
          <div className="flex w-max shrink-0 will-change-transform">
            {row1Products.map((p, i) => (
              <RevealOnScroll
                key={`${p.id}-row1-set1-${i}`}
                delayMs={(i % 10) * 15}
                className="min-w-[400px] shrink-0"
              >
                <ProductCard product={p} index={i} preferVideo={hasVideoAsset(p)} />
              </RevealOnScroll>
            ))}
            {row1Products.map((p, i) => (
              <RevealOnScroll
                key={`${p.id}-row1-set2-${i}`}
                delayMs={(i % 10) * 15}
                className="min-w-[400px] shrink-0"
              >
                <ProductCard product={p} index={i} preferVideo={hasVideoAsset(p)} />
              </RevealOnScroll>
            ))}
          </div>
        </div>
      )}

      {/* ROW 2 & 3 CONTAINER */}
      <div className="grid grid-cols-1 gap-0">
        {/* ROW 2 - Only renders if items exist */}
        {hasRow2 && (
          <div 
            ref={row2Ref}
            className="flex overflow-x-auto smooth-scroll-container gap-0 border-b border-zinc-100"
          >
            {row2Products.map((p, i) => (
              <RevealOnScroll
                key={`${p.id}-row2-${i}`}
                delayMs={i * 15}
                className="min-w-[300px] shrink-0"
              >
                <ProductCard product={p} index={i + 1} preferVideo={hasVideoAsset(p)} />
              </RevealOnScroll>
            ))}
          </div>
        )}
        
        {/* ROW 3 WRAPPER - Explicit height completely removed to prevent static blank spaces */}
        {hasRow3 && (
          <div className="relative w-full border-b border-zinc-100">
            <div 
              ref={row3Ref}
              className="flex overflow-x-auto smooth-scroll-container gap-0 w-full"
            >
              {row3Products.map((p, i) => (
                <RevealOnScroll
                  key={`${p.id}-row3-${i}`}
                  delayMs={i * 15}
                  className="min-w-[300px] shrink-0"
                >
                  <ProductCard product={p} index={i + 2} preferVideo={hasVideoAsset(p)} />
                </RevealOnScroll>
              ))}
              {hasMoreThan30 && <div className="min-w-[320px] shrink-0" />}
            </div>

            {/* WATERCOLOR OVERLAY PANEL */}
            {hasMoreThan30 && (
              <div className="absolute top-0 right-24 h-full w-[260px] bg-gradient-to-l from-white via-white/95 to-transparent flex items-center justify-end pr-6 z-40 pointer-events-none">
                <button
                  onClick={() => navigate(`/products/category/${categoryName.toLowerCase()}`)}
                  className="pointer-events-auto h-14 px-6 bg-black/5 hover:bg-black/10 text-black border border-black/10 backdrop-blur-md rounded-full flex items-center justify-center gap-3 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 group"
                >
                  <span className="text-[11px] font-black uppercase tracking-[0.2em] whitespace-nowrap pl-1">
                    More
                  </span>
                  <div className="w-7 h-7 bg-black text-white rounded-full flex items-center justify-center transition-transform duration-300 group-hover:translate-x-1">
                    <ArrowRight size={12} />
                  </div>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default CategoryBlock;