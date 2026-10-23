// frontend/src/features/products/components/CategoryBlock.tsx
import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ProductCard, { Product } from './ProductCard';
import RevealOnScroll from '@/shared/components/RevealOnScroll';
import { ArrowRight, ChevronRight, ChevronLeft } from 'lucide-react';

interface LiquidGlassScrollButtonProps {
  direction: 'right' | 'left';
  onClick: (e: React.MouseEvent) => void;
  label?: string;
}

const LiquidGlassScrollButton: React.FC<LiquidGlassScrollButtonProps> = ({ direction, onClick, label }) => {
  const isRight = direction === 'right';

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick(e);
      }}
      aria-label={label || (isRight ? "Scroll row right" : "Scroll row left")}
      title={isRight ? "Scroll forward" : "Scroll backward"}
      className="group/glass relative w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center cursor-pointer transition-all duration-500 ease-out hover:scale-110 active:scale-95 select-none focus:outline-none"
      style={{
        background: 'radial-gradient(135% 135% at 25% 20%, rgba(255, 255, 255, 0.7) 0%, rgba(255, 255, 255, 0.3) 50%, rgba(245, 240, 255, 0.2) 100%)',
        backdropFilter: 'blur(24px) saturate(200%)',
        WebkitBackdropFilter: 'blur(24px) saturate(200%)',
        boxShadow: '0 10px 32px 0 rgba(124, 58, 237, 0.15), inset 0 1.5px 2px 0 rgba(255, 255, 255, 0.95), inset 0 -2px 3px 0 rgba(124, 58, 237, 0.12)',
        border: '1px solid rgba(255, 255, 255, 0.7)',
      }}
    >
      {/* Liquid specular curved highlight */}
      <span 
        className="absolute top-1 left-2 right-2 h-1/2 rounded-t-full opacity-70 group-hover/glass:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0) 100%)',
        }}
      />

      {/* Subtle iridescent refraction pulse in brand purple on hover */}
      <span className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-plum-500/30 via-purple-400/25 to-plum-600/25 opacity-0 group-hover/glass:opacity-100 blur-sm transition-opacity duration-500 pointer-events-none" />

      {/* Icon: > for right, < for left (single arrow, brand purple) */}
      <span className="relative z-10 flex items-center justify-center text-plum-600 group-hover/glass:text-plum-700 transition-transform duration-300">
        {isRight ? (
          <ChevronRight 
            className="w-6 h-6 md:w-7 md:h-7 stroke-[3] drop-shadow-[0_1px_2px_rgba(124,58,237,0.3)] transition-transform duration-300 group-hover/glass:translate-x-0.5" 
          />
        ) : (
          <ChevronLeft 
            className="w-6 h-6 md:w-7 md:h-7 stroke-[3] drop-shadow-[0_1px_2px_rgba(124,58,237,0.3)] transition-transform duration-300 group-hover/glass:-translate-x-0.5" 
          />
        )}
      </span>
    </button>
  );
};

interface Props {
  categoryName: string;
  products?: Product[];
}

const CategoryBlock: React.FC<Props> = ({
  categoryName,
  products = [],
}) => {
  const navigate = useNavigate();
  const sectionRef = useRef<HTMLElement>(null);
  const row1Ref = useRef<HTMLDivElement>(null);
  const row2Ref = useRef<HTMLDivElement>(null);
  const row3Ref = useRef<HTMLDivElement>(null);

  const r1WasDraggedRef = useRef(false);
  const r2WasDraggedRef = useRef(false);
  const r3WasDraggedRef = useRef(false);
  const [isSectionVisible, setIsSectionVisible] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsSectionVisible(entry.isIntersecting);
      },
      { rootMargin: '250px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Split products safely into dynamic row arrays
  const row1Products = products.slice(0, 10);
  const row2Products = products.slice(10, 20);
  const row3Products = products.slice(20, 30);
  
  const hasRow2 = row2Products.length > 0;
  const hasRow3 = row3Products.length > 0;
  const hasMoreThan30 = products.length > 30;

  // 1. Row 1: Smooth Auto-Scroll with Mouse Click-and-Drag Horizontal Scroll
  useEffect(() => {
    const r1 = row1Ref.current;
    if (!r1 || row1Products.length === 0 || !isSectionVisible) return;

    let animationFrameId: number;
    let isUserInteracting = false;
    let isDragging = false;
    let startX = 0;
    let scrollLeftStart = 0;
    let hasDragged = false;
    let resumeTimeout: ReturnType<typeof setTimeout> | null = null;
    const autoScrollSpeed = 1;

    const wrapRow1 = () => {
      const halfWidth = r1.scrollWidth / 2;
      if (r1.scrollLeft >= halfWidth) {
        r1.scrollLeft -= halfWidth;
        scrollLeftStart -= halfWidth;
      } else if (r1.scrollLeft <= 0) {
        r1.scrollLeft += halfWidth;
        scrollLeftStart += halfWidth;
      }
    };

    const autoScroll = () => {
      if (!isUserInteracting && !isDragging) {
        r1.scrollLeft += autoScrollSpeed;
        const halfWidth = r1.scrollWidth / 2;
        if (r1.scrollLeft >= halfWidth) {
          r1.scrollLeft -= halfWidth;
        }
      }
      animationFrameId = requestAnimationFrame(autoScroll);
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 5) {
        hasDragged = true;
        r1WasDraggedRef.current = true;
      }
      r1.scrollLeft = scrollLeftStart - dx * 1.2;
      wrapRow1();
    };

    const onMouseUp = () => {
      if (!isDragging) return;
      isDragging = false;
      r1.style.cursor = 'grab';
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);

      if (hasDragged) {
        setTimeout(() => {
          r1WasDraggedRef.current = false;
        }, 120);
      } else {
        r1WasDraggedRef.current = false;
      }

      if (resumeTimeout) clearTimeout(resumeTimeout);
      resumeTimeout = setTimeout(() => {
        isUserInteracting = false;
      }, 1200);
    };

    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      if ((e.target as HTMLElement).closest('button, input, textarea, a')) return;

      isDragging = true;
      hasDragged = false;
      r1WasDraggedRef.current = false;
      isUserInteracting = true;
      if (resumeTimeout) clearTimeout(resumeTimeout);

      startX = e.clientX;
      scrollLeftStart = r1.scrollLeft;
      r1.style.cursor = 'grabbing';

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    };

    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        isUserInteracting = true;
        wrapRow1();
        if (resumeTimeout) clearTimeout(resumeTimeout);
        resumeTimeout = setTimeout(() => {
          isUserInteracting = false;
        }, 1200);
      }
    };

    r1.addEventListener('mousedown', onMouseDown);
    r1.addEventListener('wheel', onWheel, { passive: true });
    animationFrameId = requestAnimationFrame(autoScroll);

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (resumeTimeout) clearTimeout(resumeTimeout);
      r1.removeEventListener('mousedown', onMouseDown);
      r1.removeEventListener('wheel', onWheel);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [row1Products]);

  // 2. Row 2 & Row 3: Bi-Directional Opposite Counter-Scroll Sync & Mouse/Touch Drag
  const activeDriverRef = useRef<2 | 3 | null>(null);
  const driverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const r2 = row2Ref.current;
    const r3 = row3Ref.current;
    if (!r2 || !r3) return;

    const setDriver = (driver: 2 | 3) => {
      activeDriverRef.current = driver;
      if (driverTimeoutRef.current) clearTimeout(driverTimeoutRef.current);
      driverTimeoutRef.current = setTimeout(() => {
        activeDriverRef.current = null;
      }, 200);
    };

    // Sync helper: mirrors progress in exact opposite direction
    const syncRow3FromRow2 = () => {
      const sMax = r2.scrollWidth - r2.clientWidth;
      const tMax = r3.scrollWidth - r3.clientWidth;
      if (sMax > 0 && tMax > 0) {
        const ratio = Math.min(1, Math.max(0, r2.scrollLeft / sMax));
        r3.scrollLeft = tMax * (1 - ratio);
      }
    };

    const syncRow2FromRow3 = () => {
      const sMax = r3.scrollWidth - r3.clientWidth;
      const tMax = r2.scrollWidth - r2.clientWidth;
      if (sMax > 0 && tMax > 0) {
        const ratio = Math.min(1, Math.max(0, r3.scrollLeft / sMax));
        r2.scrollLeft = tMax * (1 - ratio);
      }
    };

    const onRow2Scroll = () => {
      if (activeDriverRef.current === 3) return; // Ignore echo when row 3 is driving
      setDriver(2);
      syncRow3FromRow2();
    };

    const onRow3Scroll = () => {
      if (activeDriverRef.current === 2) return; // Ignore echo when row 2 is driving
      setDriver(3);
      syncRow2FromRow3();
    };

    r2.addEventListener('scroll', onRow2Scroll, { passive: true });
    r3.addEventListener('scroll', onRow3Scroll, { passive: true });

    // Initial setup: Row 2 sits at left (0), Row 3 sits at right (maxScroll)
    const initTimer = setTimeout(() => {
      if (r3 && r3.scrollWidth > r3.clientWidth) {
        activeDriverRef.current = 2; // prevent triggering r2 back
        r3.scrollLeft = r3.scrollWidth - r3.clientWidth;
        setTimeout(() => {
          activeDriverRef.current = null;
        }, 80);
      }
    }, 60);

    // Row 2 Drag & Touch Handlers
    let isDragging2 = false;
    let startX2 = 0;
    let scrollLeftStart2 = 0;

    const onMouseMove2 = (e: MouseEvent) => {
      if (!isDragging2) return;
      const dx = e.clientX - startX2;
      if (Math.abs(dx) > 5) {
        r2WasDraggedRef.current = true;
      }
      setDriver(2);
      r2.scrollLeft = scrollLeftStart2 - dx * 1.2;
      syncRow3FromRow2();
    };

    const onMouseUp2 = () => {
      if (!isDragging2) return;
      isDragging2 = false;
      r2.style.cursor = 'grab';
      window.removeEventListener('mousemove', onMouseMove2);
      window.removeEventListener('mouseup', onMouseUp2);
      setTimeout(() => {
        r2WasDraggedRef.current = false;
      }, 120);
    };

    const onMouseDown2 = (e: MouseEvent) => {
      if (e.button !== 0) return;
      if ((e.target as HTMLElement).closest('button, input, textarea, a')) return;

      isDragging2 = true;
      r2WasDraggedRef.current = false;
      setDriver(2);
      startX2 = e.clientX;
      scrollLeftStart2 = r2.scrollLeft;
      r2.style.cursor = 'grabbing';

      window.addEventListener('mousemove', onMouseMove2);
      window.addEventListener('mouseup', onMouseUp2);
    };

    const onWheel2 = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        setDriver(2);
      }
    };

    // Touch support for Row 2
    let touchStartX2 = 0;
    let touchScrollStart2 = 0;
    const onTouchStart2 = (e: TouchEvent) => {
      setDriver(2);
      touchStartX2 = e.touches[0].clientX;
      touchScrollStart2 = r2.scrollLeft;
    };
    const onTouchMove2 = (e: TouchEvent) => {
      const dx = e.touches[0].clientX - touchStartX2;
      setDriver(2);
      r2.scrollLeft = touchScrollStart2 - dx;
      syncRow3FromRow2();
    };

    r2.addEventListener('mousedown', onMouseDown2);
    r2.addEventListener('wheel', onWheel2, { passive: true });
    r2.addEventListener('touchstart', onTouchStart2, { passive: true });
    r2.addEventListener('touchmove', onTouchMove2, { passive: true });

    // Row 3 Drag & Touch Handlers
    let isDragging3 = false;
    let startX3 = 0;
    let scrollLeftStart3 = 0;

    const onMouseMove3 = (e: MouseEvent) => {
      if (!isDragging3) return;
      const dx = e.clientX - startX3;
      if (Math.abs(dx) > 5) {
        r3WasDraggedRef.current = true;
      }
      setDriver(3);
      r3.scrollLeft = scrollLeftStart3 - dx * 1.2;
      syncRow2FromRow3();
    };

    const onMouseUp3 = () => {
      if (!isDragging3) return;
      isDragging3 = false;
      r3.style.cursor = 'grab';
      window.removeEventListener('mousemove', onMouseMove3);
      window.removeEventListener('mouseup', onMouseUp3);
      setTimeout(() => {
        r3WasDraggedRef.current = false;
      }, 120);
    };

    const onMouseDown3 = (e: MouseEvent) => {
      if (e.button !== 0) return;
      if ((e.target as HTMLElement).closest('button, input, textarea, a')) return;

      isDragging3 = true;
      r3WasDraggedRef.current = false;
      setDriver(3);
      startX3 = e.clientX;
      scrollLeftStart3 = r3.scrollLeft;
      r3.style.cursor = 'grabbing';

      window.addEventListener('mousemove', onMouseMove3);
      window.addEventListener('mouseup', onMouseUp3);
    };

    const onWheel3 = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        setDriver(3);
      }
    };

    // Touch support for Row 3
    let touchStartX3 = 0;
    let touchScrollStart3 = 0;
    const onTouchStart3 = (e: TouchEvent) => {
      setDriver(3);
      touchStartX3 = e.touches[0].clientX;
      touchScrollStart3 = r3.scrollLeft;
    };
    const onTouchMove3 = (e: TouchEvent) => {
      const dx = e.touches[0].clientX - touchStartX3;
      setDriver(3);
      r3.scrollLeft = touchScrollStart3 - dx;
      syncRow2FromRow3();
    };

    r3.addEventListener('mousedown', onMouseDown3);
    r3.addEventListener('wheel', onWheel3, { passive: true });
    r3.addEventListener('touchstart', onTouchStart3, { passive: true });
    r3.addEventListener('touchmove', onTouchMove3, { passive: true });

    return () => {
      clearTimeout(initTimer);
      if (driverTimeoutRef.current) clearTimeout(driverTimeoutRef.current);
      r2.removeEventListener('scroll', onRow2Scroll);
      r3.removeEventListener('scroll', onRow3Scroll);
      r2.removeEventListener('mousedown', onMouseDown2);
      r2.removeEventListener('wheel', onWheel2);
      r2.removeEventListener('touchstart', onTouchStart2);
      r2.removeEventListener('touchmove', onTouchMove2);
      r3.removeEventListener('mousedown', onMouseDown3);
      r3.removeEventListener('wheel', onWheel3);
      r3.removeEventListener('touchstart', onTouchStart3);
      r3.removeEventListener('touchmove', onTouchMove3);
      window.removeEventListener('mousemove', onMouseMove2);
      window.removeEventListener('mouseup', onMouseUp2);
      window.removeEventListener('mousemove', onMouseMove3);
      window.removeEventListener('mouseup', onMouseUp3);
    };
  }, [hasRow2, hasRow3]);




  const handleScrollRow2 = (e: React.MouseEvent) => {
    e.stopPropagation();
    const r2 = row2Ref.current;
    if (!r2) return;
    activeDriverRef.current = 2;
    if (driverTimeoutRef.current) clearTimeout(driverTimeoutRef.current);
    driverTimeoutRef.current = setTimeout(() => {
      activeDriverRef.current = null;
    }, 800);

    const maxScroll = r2.scrollWidth - r2.clientWidth;
    const distance = Math.max(300, r2.clientWidth * 0.7);
    if (r2.scrollLeft >= maxScroll - 20) {
      r2.scrollTo({ left: 0, behavior: 'smooth' });
    } else {
      r2.scrollBy({ left: distance, behavior: 'smooth' });
    }
  };

  const handleScrollRow3 = (e: React.MouseEvent) => {
    e.stopPropagation();
    const r3 = row3Ref.current;
    if (!r3) return;
    activeDriverRef.current = 3;
    if (driverTimeoutRef.current) clearTimeout(driverTimeoutRef.current);
    driverTimeoutRef.current = setTimeout(() => {
      activeDriverRef.current = null;
    }, 800);

    const maxScroll = r3.scrollWidth - r3.clientWidth;
    const distance = Math.max(300, r3.clientWidth * 0.7);
    if (r3.scrollLeft <= 20) {
      r3.scrollTo({ left: maxScroll, behavior: 'smooth' });
    } else {
      r3.scrollBy({ left: -distance, behavior: 'smooth' });
    }
  };

  // If there are zero items in this whole category block, render nothing to avoid empty whitespace
  if (products.length === 0) return null;

  return (
    <section 
      ref={sectionRef}
      id={`category-${categoryName}`} 
      className="w-full bg-white pt-1 sm:pt-2 pb-6 select-none overflow-hidden"
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
          user-select: none;
          -webkit-user-select: none;
        }
        .smooth-scroll-container img,
        .smooth-scroll-container video {
          -webkit-user-drag: none;
          user-drag: none;
        }
        .smooth-scroll-container::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      {/* ROW 1 */}
      {row1Products.length > 0 && (
        <div className="relative w-full group/row1">
          <div 
            ref={row1Ref}
            onClickCapture={(e) => {
              if (r1WasDraggedRef.current) {
                e.preventDefault();
                e.stopPropagation();
              }
            }}
            className="w-full flex overflow-x-auto smooth-scroll-container border-b border-zinc-100 cursor-grab active:cursor-grabbing"
          >
            <div className="flex w-max shrink-0 will-change-transform">
              {row1Products.map((p, i) => (
                <RevealOnScroll
                  key={`${p.id}-row1-set1-${i}`}
                  delayMs={(i % 10) * 15}
                  className="min-w-[400px] shrink-0"
                >
                  <ProductCard product={p} index={i} />
                </RevealOnScroll>
              ))}
              {row1Products.map((p, i) => (
                <RevealOnScroll
                  key={`${p.id}-row1-set2-${i}`}
                  delayMs={(i % 10) * 15}
                  className="min-w-[400px] shrink-0"
                >
                  <ProductCard product={p} index={i} />
                </RevealOnScroll>
              ))}
            </div>
          </div>


        </div>
      )}

      {/* ROW 2 & 3 CONTAINER */}
      <div className="grid grid-cols-1 gap-0">
        {/* ROW 2 - Only renders if items exist */}
        {hasRow2 && (
          <div className="relative w-full group/row2">
            <div 
              ref={row2Ref}
              onClickCapture={(e) => {
                if (r2WasDraggedRef.current) {
                  e.preventDefault();
                  e.stopPropagation();
                }
              }}
              className="flex overflow-x-auto smooth-scroll-container gap-0 border-b border-zinc-100 cursor-grab active:cursor-grabbing"
            >
              {row2Products.map((p, i) => (
                <RevealOnScroll
                  key={`${p.id}-row2-${i}`}
                  delayMs={i * 15}
                  className="min-w-[300px] shrink-0"
                >
                  <ProductCard product={p} index={i + 1} />
                </RevealOnScroll>
              ))}
            </div>

            {/* Liquid Glass Scroll Button (>>) */}
            <div className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-30 pointer-events-auto">
              <LiquidGlassScrollButton 
                direction="right" 
                onClick={handleScrollRow2} 
                label="Scroll row forward" 
              />
            </div>
          </div>
        )}
        
        {/* ROW 3 WRAPPER */}
        {hasRow3 && (
          <div className="relative w-full border-b border-zinc-100 group/row3">
            <div 
              ref={row3Ref}
              onClickCapture={(e) => {
                if (r3WasDraggedRef.current) {
                  e.preventDefault();
                  e.stopPropagation();
                }
              }}
              className="flex overflow-x-auto smooth-scroll-container gap-0 w-full cursor-grab active:cursor-grabbing"
            >
              {row3Products.map((p, i) => (
                <RevealOnScroll
                  key={`${p.id}-row3-${i}`}
                  delayMs={i * 15}
                  className="min-w-[300px] shrink-0"
                >
                  <ProductCard product={p} index={i + 2} />
                </RevealOnScroll>
              ))}
              {hasMoreThan30 && <div className="hidden md:block min-w-[320px] shrink-0" />}
            </div>

            {/* WATERCOLOR OVERLAY PANEL - Desktop only, hidden on phone mode */}
            {hasMoreThan30 && (
              <div className="hidden md:flex absolute top-0 right-28 h-full w-[260px] bg-gradient-to-l from-white via-white/95 to-transparent items-center justify-end pr-6 z-40 pointer-events-none">
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

            {/* Liquid Glass Scroll Button (<<) */}
            <div className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-50 pointer-events-auto">
              <LiquidGlassScrollButton 
                direction="left" 
                onClick={handleScrollRow3} 
                label="Scroll row backward" 
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default CategoryBlock;