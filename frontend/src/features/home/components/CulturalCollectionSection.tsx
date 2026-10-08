import { useEffect, useRef, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { productApi } from "../../products/api/productApi";
import { Product } from "../../products/types";
import { optimizeCloudinaryUrl } from "../../../shared/utils/cloudinary";

// ==========================================
// 1. INDIVIDUAL LAZY-LOADED ROW COMPONENT
// ==========================================
interface CulturalRowProps {
  dbCategory: string;
  displayTitle: string;
  topText?: string;
  direction: "left" | "right";
}

const CulturalRow = ({ dbCategory, displayTitle, topText, direction }: CulturalRowProps) => {
  const navigate = useNavigate();
  const trackRef = useRef<HTMLDivElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  
  const [products, setProducts] = useState<Product[]>([]);
  const [hasFetched, setHasFetched] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // LAZY FETCHING: Only fetch this specific category when scrolling near it
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !hasFetched) {
        setHasFetched(true);
        productApi.getProducts(dbCategory).then(data => {
          setProducts(data.results);
          setIsLoading(false);
        }).catch(err => {
          console.error(`Failed to fetch ${dbCategory}`, err);
          setIsLoading(false);
        });
      }
    }, { rootMargin: "300px" });

    if (rowRef.current) observer.observe(rowRef.current);
    return () => observer.disconnect();
  }, [dbCategory, hasFetched]);

  // Duplicate the array to create identical halves for seamless infinite scrolling
  const displayItems = useMemo(() => {
    if (products.length === 0) return [];
    const allMedia = products.map(p => {
      const m = p.media.find(m => m.media_type === 'image') || p.media[0];
      return {
        product: p,
        mediaUrl: m?.file,
        mediaType: m?.media_type,
        uniqueKey: p.id
      };
    }).filter(i => i.mediaUrl);
    // Duplicate the array multiple times to ensure enough length for infinite scroll
    return [...allMedia, ...allMedia, ...allMedia]; 
  }, [products]);

  // NATIVE SCROLL + DRAG + AUTO-SCROLL LOGIC
  useEffect(() => {
    const track = trackRef.current;
    if (!track || displayItems.length === 0) return;

    let animationFrameId: number;
    let isDown = false;
    
    let startX: number;
    let scrollLeft: number;
    
    // Auto-scroll speed
    const speed = direction === "left" ? 1.0 : -1.0;

    // If moving right (negative speed), start the scrollbar in the middle so it doesn't get stuck at 0 immediately
    if (speed < 0 && track.scrollLeft === 0) {
      track.scrollLeft = track.scrollWidth / 3;
    }

    // 1. Auto Scrolling Engine
    const autoScroll = () => {
      if (!isDown) {
        track.scrollLeft += speed;
        const third = track.scrollWidth / 3;

        // Seamless wrap around
        if (speed > 0 && track.scrollLeft >= third * 2) {
          track.scrollLeft -= third;
        } else if (speed < 0 && track.scrollLeft <= 0) {
          track.scrollLeft += third;
        }
      }
      animationFrameId = requestAnimationFrame(autoScroll);
    };

    // 2. Mouse Drag Engine
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
      const walk = (x - startX) * 1.5; // Drag speed multiplier
      track.scrollLeft = scrollLeft - walk;
    };

    // 3. Trackpad/Wheel Seamless Wrap Engine
    const onScroll = () => {
      const third = track.scrollWidth / 3;
      if (track.scrollLeft >= third * 2) {
        track.scrollLeft -= third;
      } else if (track.scrollLeft <= 0) {
        track.scrollLeft += third;
      }
    };

    // Attach listeners
    track.addEventListener('mousedown', onMouseDown);
    track.addEventListener('mouseleave', onMouseLeave);
    
    track.addEventListener('mouseup', onMouseUp);
    track.addEventListener('mousemove', onMouseMove);
    track.addEventListener('scroll', onScroll, { passive: true });

    // Start auto-scroll
    animationFrameId = requestAnimationFrame(autoScroll);

    return () => {
      cancelAnimationFrame(animationFrameId);
      track.removeEventListener('mousedown', onMouseDown);
      track.removeEventListener('mouseleave', onMouseLeave);
      
      track.removeEventListener('mouseup', onMouseUp);
      track.removeEventListener('mousemove', onMouseMove);
      track.removeEventListener('scroll', onScroll);
    };
  }, [displayItems, direction]);

  return (
    <div ref={rowRef} className="w-full flex flex-col mb-16 md:mb-32 relative">
      
      {topText && (
        <div className="w-full px-8 md:px-[20vw] mb-16 md:mb-24 text-center z-20">
          <p className="text-xl md:text-3xl font-light text-gray-500 leading-relaxed italic">
            "{topText}"
          </p>
        </div>
      )}

      <div className="w-full px-8 md:px-16 mb-8 flex justify-between items-end z-20">
        <h3 className="text-3xl md:text-5xl font-semibold tracking-tight text-gray-900">
          {displayTitle}
        </h3>
        <button 
          onClick={() => navigate(`/products/category/${dbCategory.toLowerCase()}`)}
          className="text-xs md:text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors uppercase tracking-widest whitespace-nowrap ml-4"
        >
          <span className="hidden md:inline">Explore All →</span>
          <span className="md:hidden">Explore →</span>
        </button>
      </div>

      {isLoading ? (
        <div className="w-full overflow-hidden pb-4">
          <div className="flex gap-8 px-8 md:px-16 w-max">
            {[...Array(6)].map((_, i) => (
              <div 
                key={i} 
                className="w-[240px] md:w-[280px] h-[340px] md:h-[400px] rounded-3xl bg-gray-200 animate-pulse shrink-0" 
              />
            ))}
          </div>
        </div>
      ) : displayItems.length === 0 ? (
        <div className="w-full h-[100px] flex items-center justify-center text-gray-400">
          No products found for {displayTitle}.
        </div>
      ) : (
        /* FIXED STRUCTURE: overflow-x-auto is on the bounded w-full wrapper! */
        <div 
          ref={trackRef} 
          className="w-full overflow-x-auto smooth-scroll-container cursor-grab pb-4"
        >
          {/* Inner track expands to fit content using w-max */}
          <div className="flex gap-8 px-8 md:px-16 w-max">
            {displayItems.map((item, idx) => {
              const isVideo = item.mediaType === 'video';

              return (
                <div
                  key={`${item.uniqueKey}-${idx}`}
                  onClick={() => navigate(`/products/category/${dbCategory.toLowerCase()}`)}
                  className="group relative w-[240px] md:w-[280px] h-[340px] md:h-[400px] rounded-3xl overflow-hidden bg-gray-100 shadow-sm hover:shadow-2xl transition-shadow duration-500 will-change-transform shrink-0 cursor-pointer"
                >
                  <div className="absolute inset-0 z-0 bg-gray-200">
                    {isVideo ? (
                      <video src={item.mediaUrl} autoPlay loop muted playsInline className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    ) : (
                      <img src={optimizeCloudinaryUrl(item.mediaUrl, 'c_fill,w_400,q_auto,f_auto')} alt={item.product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    )}
                  </div>
                  <div className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />
                  <div className="absolute inset-x-0 bottom-0 p-6 z-20 text-left flex flex-col justify-end">
                    <span className="text-sm font-light text-white/80 block mt-1">
                      ETB {item.product.price || item.product.variants?.[0]?.price}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// 2. MAIN SECTION COMPONENT
// ==========================================
const CulturalCollectionSection = () => {
  return (
    <motion.section 
      initial={{ opacity: 0, y: 30, scale: 0.98 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ type: "spring", stiffness: 180, damping: 22 }}
      className="relative bg-[#F5F5F7] text-gray-900 pt-32 pb-16 w-full flex flex-col justify-center overflow-hidden"
    >
      
      <style>{`
        .smooth-scroll-container {
          -webkit-overflow-scrolling: touch;
          scroll-behavior: auto;
          scrollbar-width: none;
          overscroll-behavior-x: contain; /* Stops Chrome swipe back */
        }
        .smooth-scroll-container::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      <div className="w-full px-8 md:px-16 mb-24 text-center z-20">
        <h2 className="text-5xl md:text-7xl font-semibold tracking-tight text-gray-900 mb-6">
          Cultural Heritage.
        </h2>
        <div className="flex flex-wrap justify-center gap-4 text-lg md:text-2xl font-normal text-gray-400">
          <span className="text-gray-900">Wedding.</span>
          <span className="text-gray-900">Oromo.</span>
          <span className="text-gray-900">Tigray.</span>
          <span className="text-gray-900">Amhara.</span>
        </div>
      </div>

      <CulturalRow 
        dbCategory="Wedding"
        displayTitle="Wedding Collection" 
        direction="left"
      />
      
      <CulturalRow 
        dbCategory="Oromo"
        displayTitle="Oromo" 
        direction="right"
        topText="A tapestry of tradition. Each thread tells a story of generations past, woven into the fabric of modern elegance."
      />

      <CulturalRow 
        dbCategory="Tigray"
        displayTitle="Tigray" 
        direction="left"
        topText="Rooted in history. The vibrant patterns and meticulous craftsmanship reflect a rich, diverse heritage spanning centuries."
      />

      <CulturalRow 
        dbCategory="Amhara"
        displayTitle="Amhara" 
        direction="right"
        topText="Timeless grace. Celebrating the distinct beauty and enduring spirit of Ethiopian artistry in every stitch."
      />
    </motion.section>
  );
};

export default CulturalCollectionSection;