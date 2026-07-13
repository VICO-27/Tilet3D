import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { Observer } from "gsap/Observer";
import { useNavigate } from "react-router-dom";

gsap.registerPlugin(Observer);

const TOTAL_VIDEOS = 22;
// Data for the 10 display slots
const DISPLAY_COUNT = 10;
const collectionItems = Array.from({ length: DISPLAY_COUNT }).map((_, i) => ({
  id: i + 1,
  title: [
    "Royal Habesha", "Axumite Gown", "Empress Silk", "Golden Sheba", "Modern Kaba",
    "Lalibela Knit", "Netela Cape", "Saba Gilded", "Highland Wrap", "Gondar Vestment"
  ][i],
  tag: "Premium Tilet"
}));

const FeaturedCollectionSection = () => {
  const navigate = useNavigate();
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  
  const [videoIndices, setVideoIndices] = useState(collectionItems.map(item => item.id));
  const xProxy = useRef({ x: 0 });

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const cardWidth = 360 + 48; // width + gap
    const maxMove = (DISPLAY_COUNT - 1) * cardWidth;

    // 1. Smooth Render Engine
    const render = () => {
      gsap.set(track, { x: xProxy.current.x, force3D: true });
    };

    // 2. Yoyo Autoplay (1 -> 10 -> 1)
    const tl = gsap.to(xProxy.current, {
      x: -maxMove,
      duration: 40,
      ease: "sine.inOut",
      repeat: -1,
      yoyo: true,
      onUpdate: render,
      onRepeat: () => {
        // Rotate video pool on every full cycle to show "next available"
        setVideoIndices(prev => prev.map(idx => (idx % TOTAL_VIDEOS) + 1));
      }
    });

    // 3. Fixed Scroll Logic (Doesn't trap vertical scroll)
    const obs = Observer.create({
      target: window,
      type: "wheel,touch,pointer",
      onChange: (self) => {
        // If the user is scrolling mostly vertically, don't move cards
        if (Math.abs(self.deltaY) > Math.abs(self.deltaX) && Math.abs(self.deltaY) > 5) {
          return; 
        }

        if (self.deltaX !== 0) {
          tl.pause();
          const targetX = xProxy.current.x + (self.deltaX * -0.8);
          // Clamp boundaries
          const clampedX = Math.max(Math.min(targetX, 0), -maxMove);
          
          gsap.to(xProxy.current, {
            x: clampedX,
            duration: 0.5,
            ease: "power2.out",
            onUpdate: render,
            onComplete: () => tl.resume()
          });
        }
      }
    });

    return () => {
      tl.kill();
      obs.kill();
    };
  }, []);

  return (
    <section className="relative bg-black text-white h-screen w-full flex flex-col justify-center overflow-hidden">
      {/* Optimized Style - Simplified Smoke for performance */}
      <style>{`
        @keyframes subtleDrift {
          0% { transform: translate(0,0); }
          50% { transform: translate(-10px, 5px); }
          100% { transform: translate(0,0); }
        }
        .smoke-layer {
          animation: subtleDrift 15s infinite ease-in-out;
          will-change: transform;
        }
      `}</style>

      {/* Header */}
      <div className="absolute top-16 left-0 w-full px-8 md:px-16 flex justify-between items-end z-20">
        <div>
          <span className="text-[10px] font-mono tracking-[0.4em] text-plum-400 block mb-2">TILET3D ATELIER</span>
          <h2 className="text-4xl md:text-5xl font-light tracking-tight">Featured Collection</h2>
        </div>
        <p className="text-neutral-500 font-normal text-xl hidden md:block">የተኛውን መረጡ?</p>
      </div>

      {/* Track Viewport */}
      <div 
        ref={viewportRef}
        className="w-full overflow-visible touch-pan-y"
        style={{ cursor: "grab" }}
      >
        <div
          ref={trackRef}
          className="flex gap-12 px-[10vw] md:px-[35vw] w-max will-change-transform"
        >
          {collectionItems.map((item, index) => (
            <div
              key={index}
              ref={(el) => { cardsRef.current[index] = el; }}
              onClick={() => navigate(`/products`)}
              className="group relative w-[300px] md:w-[360px] h-[450px] md:h-[520px] rounded-[32px] overflow-hidden border border-white/[0.05] bg-neutral-950 will-change-transform"
            >
              {/* Video Layer */}
              <div className="absolute inset-0 z-0">
                <video
                  ref={(el) => { videoRefs.current[index] = el; }}
                  src={`/products/featured/featured${videoIndices[index]}.mp4`}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                />
              </div>

              {/* Atmospheric Overlay */}
              <div className="absolute inset-0 z-10 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80" />
                <div className="smoke-layer absolute inset-0 bg-radial-gradient(circle, rgba(147,51,234,0.05) 0%, transparent 70%)" />
              </div>

              {/* Text */}
              <div className="absolute inset-x-0 bottom-0 p-8 z-20">
                <span className="text-[9px] font-mono tracking-widest text-plum-400 uppercase block mb-1">
                  {item.tag}
                </span>
                <h3 className="text-xl text-neutral-100 font-light">{item.title}</h3>
                <div className="mt-4 flex items-center gap-2 text-[10px] text-neutral-500 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span>View Details</span>
                  <span className="text-plum-400">→</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[60vw] h-[100px] bg-plum-900/10 blur-[100px] rounded-full pointer-events-none" />
    </section>
  );
};

export default FeaturedCollectionSection;