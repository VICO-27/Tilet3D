// src/components/sections/FeaturedCollectionSection.tsx
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Observer } from "gsap/Observer";
import { useNavigate } from "react-router-dom";

// Both ScrollTrigger and Observer must be registered together
gsap.registerPlugin(ScrollTrigger, Observer);

// Comprehensive Array Matrix supporting all 22 cinematic clips
const collectionItems = [
  { id: 1, title: "Royal Habesha Kemis", tag: "Exquisite Hand-Woven Tilet", bgGradient: "from-purple-950/40 via-purple-900/10 to-black" },
  { id: 2, title: "Modern Axumite Gown", tag: "Contemporary Silhouette", bgGradient: "from-indigo-950/40 via-indigo-900/10 to-black" },
  { id: 3, title: "Empress Silk Ensemble", tag: "Pure Heritage Threading", bgGradient: "from-neutral-900 via-neutral-950 to-black" },
  { id: 4, title: "Golden Sheba Drape", tag: "Metallo-Textile Innovation", bgGradient: "from-amber-950/30 via-zinc-900/10 to-black" },
  { id: 5, title: "Contemporary Kaba", tag: "Structured Velvet Luxury", bgGradient: "from-neutral-950 via-purple-950/20 to-black" },
  { id: 6, title: "Lalibela Geometric Knit", tag: "Architectural Patterns", bgGradient: "from-stone-900 via-stone-950 to-black" },
  { id: 7, title: "Imperial Netela Cape", tag: "Gossamer Fine Cotton", bgGradient: "from-purple-950/30 via-stone-900/10 to-black" },
  { id: 8, title: "Saba Gilded Silhouette", tag: "Traditional Royalty Grid", bgGradient: "from-amber-950/40 via-neutral-900/20 to-black" },
  { id: 9, title: "Highland Wool Wrap", tag: "Handspun Thermal Textures", bgGradient: "from-orange-950/20 via-zinc-900/10 to-black" },
  { id: 10, title: "Gondar Majestic Vestment", tag: "Intricate Collar Embroidery", bgGradient: "from-yellow-950/20 via-neutral-950 to-black" },
  { id: 11, title: "Rift Valley Linen Suite", tag: "Breathable Eco-Weaves", bgGradient: "from-emerald-950/20 via-stone-900/10 to-black" },
  { id: 12, title: "Adwa Avant-Garde Shield", tag: "Structured Tech-Couture", bgGradient: "from-red-950/20 via-neutral-950 to-black" },
  { id: 13, title: "Entoto Mist Shroud", tag: "Monochromatic Sheer Silk", bgGradient: "from-slate-900 via-slate-950 to-black" },
  { id: 14, title: "Oromo Velvet Chiffon", tag: "Classic Festive Trim", bgGradient: "from-red-950/30 via-purple-950/10 to-black" },
  { id: 15, title: "Tigrayan Pleated Helix", tag: "Dynamic Lineal Formations", bgGradient: "from-amber-950/20 via-orange-950/15 to-black" },
  { id: 16, title: "Harari Luxury Brocade", tag: "Vibrant Heritage Palette", bgGradient: "from-indigo-950/30 via-purple-950/10 to-black" },
  { id: 17, title: "Sidama Bamboo Weave", tag: "Organic Filament Mesh", bgGradient: "from-teal-950/20 via-neutral-900 to-black" },
  { id: 18, title: "Afar Nomadic Drape", tag: "Fluid Crimson Borders", bgGradient: "from-rose-950/30 via-stone-950 to-black" },
  { id: 19, title: "Modernist Ge'ez Print", tag: "Typography Motif Canvas", bgGradient: "from-neutral-900 via-zinc-900 to-black" },
  { id: 20, title: "Atelier Platinum Kemis", tag: "Metallic Weave Matrix", bgGradient: "from-slate-800/20 via-neutral-950 to-black" },
  { id: 21, title: "Crimson Tilet Gown", tag: "High-Contrast Edge-Work", bgGradient: "from-red-950/40 via-stone-900/10 to-black" },
  { id: 22, title: "Grand Axum Monolith", tag: "Premium Finale Showcase", bgGradient: "from-purple-950/50 via-zinc-950 to-black" },
];

const FeaturedCollectionSection = () => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  
  const mainProxyRef = useRef<{ x: number }>({ x: 0 });
  const autoplayTweenRef = useRef<gsap.core.Tween | null>(null);
  const inertiaTweenRef = useRef<gsap.core.Tween | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dragTrackerRef = useRef<{ startX: number; startY: number; isDragging: boolean }>({
    startX: 0,
    startY: 0,
    isDragging: false,
  });

  const duplicatedItems = [...collectionItems, ...collectionItems, ...collectionItems];

  useEffect(() => {
    const track = trackRef.current;
    const viewport = viewportRef.current;
    if (!track || !viewport) return;

    const cards = cardsRef.current.filter((card): card is HTMLDivElement => card !== null);
    const totalMove = track.scrollWidth / 3;

    // --- Master 3D Transform Render Engine ---
    const renderTransforms = () => {
      let currentX = mainProxyRef.current.x;
      
      if (currentX > 0) {
        mainProxyRef.current.x = -totalMove;
      } else if (currentX < -totalMove) {
        mainProxyRef.current.x = currentX + totalMove;
      }

      gsap.set(track, { x: mainProxyRef.current.x });

      const viewportRect = viewport.getBoundingClientRect();
      const viewportCenter = viewportRect.left + viewportRect.width / 2;

      cards.forEach((card) => {
        const cardRect = card.getBoundingClientRect();
        const cardCenter = cardRect.left + cardRect.width / 2;
        
        const distanceFromCenter = (cardCenter - viewportCenter) / (viewportRect.width / 2);
        const absDistance = Math.min(Math.abs(distanceFromCenter), 1.5);

        const scale = 1.05 - (absDistance * 0.28);
        const opacity = 1 - (absDistance * 0.7);
        const rotateY = distanceFromCenter * -18;
        const z = absDistance * -120;

        gsap.set(card, {
          scale,
          opacity: Math.max(opacity, 0.25),
          transformPerspective: 1200,
          rotateY,
          z,
          force3D: true, 
        });
      });
    };

    // --- Autoplay Mechanics ---
    const startAutoplay = () => {
      if (autoplayTweenRef.current) autoplayTweenRef.current.kill();
      if (inertiaTweenRef.current) inertiaTweenRef.current.kill();

      const currentX = mainProxyRef.current.x;
      const remainingDistance = totalMove + currentX;
      
      const baseDuration = 85; 
      const duration = (remainingDistance / totalMove) * baseDuration;

      autoplayTweenRef.current = gsap.to(mainProxyRef.current, {
        x: -totalMove,
        duration: Math.max(duration, 0.5),
        ease: "none",
        repeat: -1,
        onUpdate: renderTransforms,
      });
    };

    renderTransforms();
    startAutoplay();

    // --- Smart Virtualized Video Playback for Chrome Performance ---
    const observerOptions = {
      root: viewport,
      threshold: 0.1,
    };

    const videoObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const video = entry.target as HTMLVideoElement;
        if (entry.isIntersecting) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      });
    }, observerOptions);

    videoRefs.current.forEach((video) => {
      if (video) videoObserver.observe(video);
    });

    // --- GSAP Observer Setup ---
    const observer = Observer.create({
      target: viewport,
      type: "wheel,touch,pointer",
      wheelSpeed: 0.8,
      tolerance: 4,
      preventDefault: true, 
      onChange: (self) => {
        if (autoplayTweenRef.current) autoplayTweenRef.current.kill();
        if (inertiaTweenRef.current) inertiaTweenRef.current.kill();
        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        const combinedDelta = Math.abs(self.deltaX) > Math.abs(self.deltaY) ? self.deltaX : self.deltaY;
        
        mainProxyRef.current.x += combinedDelta * -0.65;
        renderTransforms();

        const velocity = Math.abs(self.deltaX) > Math.abs(self.deltaY) ? self.velocityX : self.velocityY;
        const boundedVelocity = Math.min(Math.max(velocity, -2500), 2500);

        inertiaTweenRef.current = gsap.to(mainProxyRef.current, {
          x: `+=${boundedVelocity * -0.15}`,
          duration: 1.4,
          ease: "power3.out",
          onUpdate: renderTransforms,
          onComplete: () => {
            timeoutRef.current = setTimeout(startAutoplay, 800);
          }
        });
      }
    });

    window.addEventListener("resize", renderTransforms);
    const initialTimeout = setTimeout(renderTransforms, 100);

    return () => {
      observer.kill();
      videoObserver.disconnect();
      clearTimeout(initialTimeout);
      if (autoplayTweenRef.current) autoplayTweenRef.current.kill();
      if (inertiaTweenRef.current) inertiaTweenRef.current.kill();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      window.removeEventListener("resize", renderTransforms);
    };
  }, []);

  // --- Click vs. Drag Intent Handlers ---
  const handleCardPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    dragTrackerRef.current.startX = e.clientX;
    dragTrackerRef.current.startY = e.clientY;
    dragTrackerRef.current.isDragging = false;
  };

  const handleCardPointerUp = (e: React.PointerEvent<HTMLDivElement>, itemId: number) => {
    const deltaX = Math.abs(e.clientX - dragTrackerRef.current.startX);
    const deltaY = Math.abs(e.clientY - dragTrackerRef.current.startY);

    if (deltaX > 6 || deltaY > 6) {
      dragTrackerRef.current.isDragging = true;
    }

    if (!dragTrackerRef.current.isDragging) {
      navigate(`/avatar?id=habesha-kemis&item=${itemId}&variant=1`);
    }
  };

  return (
    <section
      ref={containerRef}
      className="relative bg-black text-white h-screen w-full flex flex-col justify-center overflow-hidden antialiased select-none"
    >
      {/* Global CSS Injector for Smoke Morphing and Animation Cycles */}
      <style>{`
        @keyframes smokeDrift {
          0% { transform: scale(1) translate(0px, 0px) rotate(0deg); }
          33% { transform: scale(1.15) translate(-15px, 8px) rotate(3deg); }
          66% { transform: scale(1.08) translate(10px, -12px) rotate(-2deg); }
          100% { transform: scale(1) translate(0px, 0px) rotate(0deg); }
        }
        .animate-smoke-layer {
          animation: smokeDrift 22s infinite ease-in-out;
        }
        .smoke-mask-mix {
          filter: url(#organic-smoke-filter);
        }
      `}</style>

      {/* SVG Turbulence Engine Definition for Procedural Smoke Boundaries */}
      <svg className="absolute w-0 h-0 invisible pointer-events-none">
        <defs>
          <filter id="organic-smoke-filter">
            <feTurbulence type="fractalNoise" baseFrequency="0.015" numOctaves="4" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="35" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>

      {/* Editorial Header Frame */}
      <div className="absolute top-16 left-0 w-full px-8 md:px-16 flex flex-col md:flex-row justify-between items-baseline z-20 gap-4">
        <div>
          <span className="text-[11px] font-mono tracking-[0.4em] text-purple-400 block mb-2 font-medium">
            TILET3D ATELIER
          </span>
          <h2 className="text-4xl md:text-5xl font-light tracking-tight text-neutral-100">
            Featured Collection
          </h2>
        </div>
        <p className="text-neutral-400 font-normal text-xl md:text-2xl tracking-wide max-w-xs text-right md:text-left">
          የተኛውን መረጡ?
        </p>
      </div>

      {/* The Unified Viewport Track Window */}
      <div 
        ref={viewportRef}
        className="w-full overflow-visible py-12 touch-none select-none"
        style={{ cursor: "grab" }}
      >
        <div
          ref={trackRef}
          className="flex gap-12 px-[38vw] w-max will-change-transform"
          style={{ transformStyle: "preserve-3d" }}
        >
          {duplicatedItems.map((item, index) => {
            const videoSourcePath = `/products/featured/featured${item.id}.mp4`;

            return (
              <div
                key={`${item.id}-${index}`}
                ref={(el) => { cardsRef.current[index] = el; }}
                onPointerDown={handleCardPointerDown}
                onPointerUp={(e) => handleCardPointerUp(e, item.id)}
                className="group relative w-[280px] md:w-[360px] h-[420px] md:h-[500px] rounded-[32px] overflow-hidden border border-white/[0.06] bg-neutral-950/40 backdrop-blur-2xl transition-shadow duration-700 hover:shadow-[0_0_50px_rgba(147,51,234,0.15)] will-change-transform block cursor-pointer"
              >
                {/* Embedded Cinematic Video Core Layer */}
                <div className="absolute inset-0 w-full h-full z-0 overflow-hidden">
                  <video
                    ref={(el) => { videoRefs.current[index] = el; }}
                    src={videoSourcePath}
                    loop
                    muted
                    playsInline
                    preload="metadata"
                    className="w-full h-full object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-[1.05]"
                  />
                </div>

                {/* --- Organic Smoke & Volumetric Mist System Layers --- */}
                <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden mix-blend-screen opacity-75 group-hover:opacity-60 transition-opacity duration-1000">
                  {/* Outer Billowing Smoke Layer */}
                  <div 
                    className="absolute inset-[-40px] bg-radial from-neutral-800/25 via-black/40 to-black/90 smoke-mask-mix animate-smoke-layer" 
                    style={{ animationDelay: `${index * -0.4}s` }}
                  />
                  {/* Colored Fog Glow Core */}
                  <div 
                    className={`absolute inset-[-20px] bg-gradient-to-tr ${item.bgGradient} opacity-40 blur-xl scale-110 animate-smoke-layer`}
                    style={{ animationDelay: `${index * -0.9}s`, animationDuration: '28s' }}
                  />
                </div>

                {/* Solid Bottom Mist Wash for Legibility */}
                <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black via-black/80 to-transparent z-10 pointer-events-none" />

                {/* Text Meta Descriptions Block */}
                <div className="absolute inset-x-0 bottom-0 p-8 z-20 text-left">
                  <span className="text-[10px] font-mono tracking-widest text-purple-400 uppercase block mb-2 font-medium">
                    {item.tag}
                  </span>
                  <h3 className="text-xl md:text-2xl text-neutral-100 font-light tracking-tight">
                    {item.title}
                  </h3>
                  <div className="mt-4 flex items-center gap-2 text-xs font-light text-neutral-500 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-500">
                    <span>Configure Avatar & Order</span>
                    <span className="text-purple-400">→</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Atmospheric Ambient Lighting Ring */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[80vw] h-[150px] bg-purple-900/10 blur-[130px] rounded-full pointer-events-none z-0" />
    </section>
  );
};

export default FeaturedCollectionSection;