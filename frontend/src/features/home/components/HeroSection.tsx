import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { useTranslation } from "react-i18next";
import HeroModel, { HERO_MODELS, preloadHeroModel, type PointerTracker } from "./HeroModel";
import HeroBrandAnimation from "./HeroBrandAnimation";

// Preload initial hero 3D model immediately
if (typeof window !== "undefined") {
  preloadHeroModel(HERO_MODELS[0].path);
}
import type { Variants } from "framer-motion";

// ─── Motion Language: Tumble & Fun ───────────────────────────────────────────
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05,
    },
  },
};

const tumbleVariants: Variants = {
  hidden: { opacity: 0, y: 30, scale: 0.98 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } // ultra smooth ease-out (Apple-like)
  }
};

const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1, y: 0,
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
  }
};

// ─── Living Aura ─────────────────────────────────────────────────────────────
const TiletAura = () => (
  <motion.div 
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 1.5, ease: "easeOut" }}
    className="absolute left-1/2 top-1/2 -z-10 h-full w-full -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-60 mix-blend-multiply dark:mix-blend-screen"
    style={{ willChange: "opacity" }}
  >
    {/* Use CSS-based infinite pulsing instead of heavy framer-motion recalculations for blurred layers */}
    <style>{`
      @keyframes smoothPulse {
        0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.35; }
        50% { transform: translate(-50%, -50%) scale(1.05); opacity: 0.5; }
      }
      .aura-layer-1 {
        animation: smoothPulse 8s ease-in-out infinite;
        will-change: transform, opacity;
      }
      @keyframes smoothPulse2 {
        0%, 100% { transform: translate(-50%, -50%) scale(0.95); opacity: 0.4; }
        50% { transform: translate(-50%, -50%) scale(1.02); opacity: 0.6; }
      }
      .aura-layer-2 {
        animation: smoothPulse2 6s ease-in-out infinite;
        will-change: transform, opacity;
      }
    `}</style>
    
    <div className="aura-layer-1 absolute left-1/2 top-1/2 h-[75%] w-[75%] rounded-full bg-purple-200/50 blur-[80px]" />
    <div className="aura-layer-2 absolute left-1/2 top-1/2 h-[45%] w-[45%] rounded-full bg-plum-300/60 blur-[60px]" />
    <div className="absolute left-[40%] top-[60%] h-[55%] w-[55%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-100/40 blur-[70px] opacity-30" />
  </motion.div>
);

// ─── Theatrical Runway Followspot streaming from Navbar ────────────────────────
const TheatricalNavbarLight: React.FC = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
    {/* 1. Luminous Fixture Glow at the Navbar — shines from top: 0, diffusing through frosted navbar glass */}
    <div 
      className="absolute -top-7 left-[35%] sm:left-[42%] lg:left-[46%] -translate-x-1/2 w-48 sm:w-72 lg:w-96 h-16 sm:h-20 rounded-full bg-purple-300/45 blur-2xl pointer-events-none animate-pulse"
      style={{ animationDuration: '6s' }}
    />
    <div 
      className="absolute -top-3 left-[35%] sm:left-[42%] lg:left-[46%] -translate-x-1/2 w-24 sm:w-36 lg:w-48 h-8 sm:h-10 rounded-full bg-purple-200/70 blur-md pointer-events-none" 
    />

    {/* 2. Seamless Diagonal Atmospheric Light Shaft: streams continuously from navbar down to the avatar stage */}
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      preserveAspectRatio="none"
      viewBox="0 0 1000 1000"
    >
      <defs>
        <linearGradient id="theatricalNavbarBeam" x1="0%" y1="0%" x2="65%" y2="100%">
          <stop offset="0%" stopColor="#c084fc" stopOpacity="0.42" />
          <stop offset="18%" stopColor="#d8b4fe" stopOpacity="0.28" />
          <stop offset="50%" stopColor="#e9d5ff" stopOpacity="0.13" />
          <stop offset="80%" stopColor="#f3e8ff" stopOpacity="0.03" />
          <stop offset="100%" stopColor="#faf5ff" stopOpacity="0.0" />
        </linearGradient>
        <filter id="theatricalBeamBlur" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="35" />
        </filter>
      </defs>

      {/* Desktop: emanates from top navbar (x: 420 to 500) and envelopes the right-column avatar stage */}
      <polygon
        points="420,0 500,0 940,900 540,900"
        className="hidden lg:block"
        fill="url(#theatricalNavbarBeam)"
        filter="url(#theatricalBeamBlur)"
      />
      {/* Mobile: emanates from top navbar (x: 260 to 380) and envelopes the centered avatar stage */}
      <polygon
        points="270,0 380,0 790,880 230,880"
        className="lg:hidden"
        fill="url(#theatricalNavbarBeam)"
        filter="url(#theatricalBeamBlur)"
      />
    </svg>
  </div>
);

const HeroSection = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [currentModelIndex, setCurrentModelIndex] = useState(0);
  const currentModel = HERO_MODELS[currentModelIndex] || HERO_MODELS[0];
  const [transitionDirection, setTransitionDirection] = useState<-1 | 1>(1);
  const interactingRef = useRef(false);
  const sectionRef = useRef<HTMLElement>(null);
  const [isInView, setIsInView] = useState(true);
  const [is3DReady, setIs3DReady] = useState(false);
  const [isUserInteracting, setIsUserInteracting] = useState(false);
  const prefersReducedMotion = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Mobile Directional Touch Controller:
  // - Immediate horizontal swipe detection (>7px) locks to smooth 360° avatar rotation with momentum inertia
  // - Vertical swipe allows 100% native browser vertical scrolling with zero friction
  const rotateRef = useRef(0);
  const mobileTouchRef = useRef<HTMLDivElement>(null);

  const interactingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const markInteracting = useCallback(() => { 
    if (interactingTimeoutRef.current) clearTimeout(interactingTimeoutRef.current);
    interactingRef.current = true; 
    setIsUserInteracting(true);
  }, []);

  const endInteracting = useCallback(() => { 
    if (interactingTimeoutRef.current) clearTimeout(interactingTimeoutRef.current);
    interactingTimeoutRef.current = setTimeout(() => {
      interactingRef.current = false;
      setIsUserInteracting(false);
    }, 2500); 
  }, []);

  useEffect(() => {
    const el = mobileTouchRef.current;
    if (!el) return;

    let touchStartX = 0;
    let touchStartY = 0;
    let lastTouchX = 0;
    let gestureLock: "none" | "horizontal" | "vertical" = "none";
    let velocityX = 0;
    let animFrameId: number | null = null;

    const stopInertia = () => {
      if (animFrameId !== null) {
        cancelAnimationFrame(animFrameId);
        animFrameId = null;
      }
    };

    const runInertia = () => {
      stopInertia();
      const step = () => {
        if (Math.abs(velocityX) > 0.0003) {
          rotateRef.current += velocityX;
          velocityX *= 0.92;
          animFrameId = requestAnimationFrame(step);
        } else {
          animFrameId = null;
        }
      };
      animFrameId = requestAnimationFrame(step);
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      stopInertia();
      const t = e.touches[0];
      touchStartX = t.clientX;
      touchStartY = t.clientY;
      lastTouchX = t.clientX;
      gestureLock = "none";
      velocityX = 0;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const t = e.touches[0];
      const dx = t.clientX - touchStartX;
      const dy = t.clientY - touchStartY;

      if (gestureLock === "none") {
        if (Math.hypot(dx, dy) > 7) {
          if (Math.abs(dx) > Math.abs(dy) * 0.9) {
            gestureLock = "horizontal";
            markInteracting();
          } else {
            gestureLock = "vertical";
          }
        }
      }

      if (gestureLock === "horizontal") {
        if (e.cancelable) {
          e.preventDefault();
        }
        const deltaX = t.clientX - lastTouchX;
        const radDelta = deltaX * ((Math.PI * 2) / 360) * 0.75;
        rotateRef.current += radDelta;
        velocityX = radDelta * 0.45;
        lastTouchX = t.clientX;
      }
    };

    const onTouchEnd = () => {
      if (gestureLock === "horizontal") {
        runInertia();
        endInteracting();
      }
      gestureLock = "none";
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    el.addEventListener("touchcancel", onTouchEnd, { passive: true });

    return () => {
      stopInertia();
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [markInteracting, endInteracting]);

  // Mutable ref for pointer tracking — prevents React re-renders on mousemove
  const pointerRef = useRef<PointerTracker>({ x: 0, y: 0, active: false });

  const handlePointerMove = (e: React.PointerEvent) => {
    // Touch interactions are handled via touch OrbitControls and scrolling; skip pointer-driven tracking
    if (e.pointerType === "touch") return;
    const section = sectionRef.current;
    if (!section) return;
    const rect = section.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    // Normalize coordinates relative to hero section interaction area into bounded [-1, 1] range
    const rawX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const rawY = -(((e.clientY - rect.top) / rect.height) * 2 - 1);

    pointerRef.current.x = Math.max(-1, Math.min(1, rawX));
    pointerRef.current.y = Math.max(-1, Math.min(1, rawY));
    pointerRef.current.active = true;
  };

  const handlePointerLeave = () => {
    pointerRef.current.x = 0;
    pointerRef.current.y = 0;
    pointerRef.current.active = false;
  };

  // Ensure avatar returns smoothly to neutral if window blurs or cursor exits the document
  useEffect(() => {
    const handleWindowBlur = () => {
      pointerRef.current.x = 0;
      pointerRef.current.y = 0;
      pointerRef.current.active = false;
    };
    window.addEventListener("blur", handleWindowBlur);
    document.addEventListener("mouseleave", handleWindowBlur);

    return () => {
      window.removeEventListener("blur", handleWindowBlur);
      document.removeEventListener("mouseleave", handleWindowBlur);
    };
  }, []);

  // Monitor viewport visibility of HeroSection to throttle 3D frameloop when scrolled away
  useEffect(() => {
    if (!sectionRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      { threshold: 0.05 }
    );
    observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  // Callback triggered when a model completes its single 360° rotation: advance to next model
  const handleAutoCycle = useCallback(() => {
    setTransitionDirection(1);
    setCurrentModelIndex((prev) => {
      const total = HERO_MODELS.length;
      const nextIdx = (prev + 1) % total;
      const upcomingIdx = (nextIdx + 1) % total;
      preloadHeroModel(HERO_MODELS[upcomingIdx].path);
      return nextIdx;
    });
  }, []);

  // Fallback timer strictly for reduced-motion users (where 3D auto-spin is paused)
  useEffect(() => {
    if (!is3DReady || !prefersReducedMotion) return;
    const id = setInterval(() => {
      if (!interactingRef.current) {
        handleAutoCycle();
      }
    }, 8500);
    return () => clearInterval(id);
  }, [is3DReady, prefersReducedMotion, handleAutoCycle]);

  const cycleModel = useCallback((dir: -1 | 1) => { 
    markInteracting(); 
    endInteracting(); 
    setTransitionDirection(dir);
    setCurrentModelIndex((prev) => {
      const total = HERO_MODELS.length;
      const nextIdx = (prev + dir + total) % total;
      const upcomingIdx = (nextIdx + dir + total) % total;
      preloadHeroModel(HERO_MODELS[upcomingIdx].path);
      return nextIdx;
    });
  }, [markInteracting, endInteracting]);

  const selectModel = useCallback((index: number) => {
    if (index === currentModelIndex) return;
    markInteracting();
    endInteracting();
    setTransitionDirection(index > currentModelIndex ? 1 : -1);
    setCurrentModelIndex(index);
  }, [currentModelIndex, markInteracting, endInteracting]);

  // Keyboard navigation for laptop/desktop: "<" (or ",") or ArrowLeft to switch left,
  // ">" (or ".") or ArrowRight to switch right.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === "INPUT" ||
          activeEl.tagName === "TEXTAREA" ||
          activeEl.tagName === "SELECT" ||
          (activeEl as HTMLElement).isContentEditable)
      ) {
        return;
      }

      // Avoid intercepting when a modal dialog is open
      if (document.querySelector('[role="dialog"]')) {
        return;
      }

      if (e.key === "<" || e.key === "," || e.key === "ArrowLeft") {
        e.preventDefault();
        cycleModel(-1);
      } else if (e.key === ">" || e.key === "." || e.key === "ArrowRight") {
        e.preventDefault();
        cycleModel(1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [cycleModel]);

  // Dynamic perimeter positions — calibrated to frame the newly elevated avatar with clean shoulder clearance
  // without encroaching on hair, face, or the bottom text panel.
  const BADGE_POSITIONS = useMemo(() => [
    // 0: Top-Left (upper negative space beside head & neckline)
    { positionClass: "top-[11%] xs:top-[12%] sm:top-[12%] lg:top-[13%] left-3 xs:left-4 sm:left-8 lg:left-[8%] xl:left-[10%]", initialX: -10 },
    // 1: Bottom-Right (well above bottom text panel)
    { positionClass: "bottom-[23%] xs:bottom-[24%] sm:bottom-[25%] lg:bottom-[26%] right-3 xs:right-4 sm:right-8 lg:right-[7%] xl:right-[9%]", initialX: 10 },
    // 2: Top-Right (upper negative space beside head & neckline)
    { positionClass: "top-[11%] xs:top-[12%] sm:top-[12%] lg:top-[13%] right-3 xs:right-4 sm:right-8 lg:right-[8%] xl:right-[10%]", initialX: 10 },
    // 3: Bottom-Left (well above bottom text panel)
    { positionClass: "bottom-[23%] xs:bottom-[24%] sm:bottom-[25%] lg:bottom-[26%] left-3 xs:left-4 sm:left-8 lg:left-[7%] xl:left-[9%]", initialX: -10 },
    // 4: Top-Left (shoulder clearance level)
    { positionClass: "top-[12%] xs:top-[13%] sm:top-[13%] lg:top-[14%] left-3 xs:left-4 sm:left-8 lg:left-[8%] xl:left-[10%]", initialX: -10 },
    // 5: Bottom-Right (well above bottom text panel)
    { positionClass: "bottom-[24%] xs:bottom-[25%] sm:bottom-[26%] lg:bottom-[27%] right-3 xs:right-4 sm:right-8 lg:right-[7%] xl:right-[9%]", initialX: 10 },
    // 6: Top-Right (shoulder clearance level)
    { positionClass: "top-[12%] xs:top-[13%] sm:top-[13%] lg:top-[14%] right-3 xs:right-4 sm:right-8 lg:right-[8%] xl:right-[10%]", initialX: 10 },
  ], []);

  const currentBadgePos = BADGE_POSITIONS[currentModelIndex % BADGE_POSITIONS.length];

  // Sliding window of exactly 3 models centered around currentModelIndex
  const visibleThreeModels = useMemo(() => {
    const total = HERO_MODELS.length;
    const offsets = [-1, 0, 1];
    return offsets.map((offset) => {
      const idx = (currentModelIndex + offset + total) % total;
      return {
        ...HERO_MODELS[idx],
        originalIndex: idx,
      };
    });
  }, [currentModelIndex]);

  return (
    <section 
      ref={sectionRef} 
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className="relative min-h-[100dvh] lg:h-screen w-full overflow-x-hidden lg:overflow-hidden bg-[#fafafa] pt-[56px] pb-12 lg:pb-0 text-zinc-900 select-none"
    >
      {/* Theatrical Spotlight Fixture & Beam emanating from the Navbar */}
      <TheatricalNavbarLight />
      
      <div className="relative grid h-full w-full grid-cols-1 items-center px-4 sm:px-8 md:px-16 lg:grid-cols-2 lg:px-20 xl:px-28">
        
        {/* ─── Left Column: Typography & CTAs ─── */}
        <motion.div 
          className="z-10 py-6 sm:py-8 lg:py-0"
          variants={prefersReducedMotion ? undefined : containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Eyebrow Badge */}
          <motion.div 
            variants={prefersReducedMotion ? undefined : tumbleVariants}
            className="mb-4 sm:mb-6 inline-flex items-center gap-2 rounded-full border border-black/5 bg-white/80 px-3.5 py-1.5 sm:px-4 sm:py-2 text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.2em] sm:tracking-[0.25em] text-zinc-600 shadow-sm backdrop-blur-md"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-plum-600 animate-pulse" />
            {t("hero.badge", "Fashion, reimagined in 3D")}
          </motion.div>

          {/* Heading with Tumble sequence: Horizontal on mobile, editorial 3-lines on desktop */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[clamp(2.75rem,6.5vw,5.5rem)] font-semibold tracking-tight leading-tight lg:leading-[0.96] text-zinc-950">
            <motion.span variants={prefersReducedMotion ? undefined : tumbleVariants} className="inline-block lg:block mr-2 lg:mr-0 origin-bottom-left">
              {t("hero.title1", "Wear it")}
            </motion.span>
            <motion.span variants={prefersReducedMotion ? undefined : tumbleVariants} className="inline-block lg:block mr-2 lg:mr-0 italic text-plum-600 font-serif font-light origin-bottom-left">
              {t("hero.title2", "before you")}
            </motion.span>
            <motion.span variants={prefersReducedMotion ? undefined : tumbleVariants} className="inline-block lg:block origin-bottom-left">
              {t("hero.title3", "buy it.")}
            </motion.span>
          </h1>

          {/* Subtitle */}
          <motion.p 
            variants={prefersReducedMotion ? undefined : fadeUpVariants}
            className="mt-3 sm:mt-6 max-w-lg text-sm sm:text-base lg:text-lg leading-relaxed text-zinc-600 font-normal"
          >
            {t("hero.subtitle", "Build your 3D avatar and fit hand-woven Ethiopian couture to your exact proportions before the first thread is spun.")}
          </motion.p>

          {/* Call to Actions */}
          <motion.div 
            variants={prefersReducedMotion ? undefined : fadeUpVariants}
            className="mt-5 sm:mt-8 flex flex-row items-center gap-2.5 sm:gap-4 w-full sm:w-auto max-w-[340px] sm:max-w-none"
          >
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/avatar")}
              className="group relative flex-1 sm:flex-none inline-flex min-h-[44px] items-center justify-center rounded-full bg-white/95 backdrop-blur-xl border border-zinc-200/90 px-4 sm:px-8 py-2.5 sm:py-4 text-xs sm:text-sm font-bold tracking-wide text-zinc-900 shadow-[0_8px_20px_-4px_rgba(0,0,0,0.1),0_2px_6px_-2px_rgba(0,0,0,0.06)] hover:shadow-[0_18px_36px_-6px_rgba(124,58,237,0.28),0_4px_12px_-2px_rgba(0,0,0,0.08)] hover:border-plum-300/80 hover:text-plum-950 hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm transition-all duration-300"
            >
              <span>{t("hero.createAvatar", "Create your avatar")}</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/products")}
              onMouseEnter={() => {
                import('../../products/pages/ProductsPage'); // prefetch route chunk
                import('../../products/hooks/useProducts').then(m => m.prefetchProducts()); // prefetch API data
              }}
              onTouchStart={() => {
                import('../../products/pages/ProductsPage'); // prefetch route chunk for mobile
                import('../../products/hooks/useProducts').then(m => m.prefetchProducts()); // prefetch API data
              }}
              className="flex-1 sm:flex-none inline-flex min-h-[44px] items-center justify-center rounded-full bg-plum-600 px-4 sm:px-8 py-2.5 sm:py-4 text-xs sm:text-sm font-semibold text-white transition-colors duration-300 hover:bg-plum-700 shadow-lg hover:shadow-plum-600/30"
            >
              {t("hero.shopNow", "Shop Now")}
            </motion.button>
          </motion.div>

          {/* Testimonial Stream */}
          <motion.div variants={prefersReducedMotion ? undefined : fadeUpVariants} className="mt-8 lg:mt-10 pt-2 lg:pt-4 hidden sm:block">
            <Testimonials />
          </motion.div>
        </motion.div>

        {/* ─── Right Column: Interactive Static Image Stage ─── */}
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          className="relative h-[480px] sm:h-[540px] lg:h-full w-full lg:translate-x-6 flex items-center justify-center mt-2 mb-6 lg:my-0"
        >
          {/* Living Aura Background */}
          <TiletAura />

          {/* Visual Stage: Mind-blowing Brand Animation while 3D is preparing -> Seamless dissolve to Live 3D */}
          <div className="relative w-full h-full max-h-[620px] lg:max-h-[760px] -translate-y-8 sm:-translate-y-9 lg:-translate-y-6 flex items-center justify-center">
            {/* 1. Mesmerizing 3D Brand Animation — active until Three.js/GLB is ready */}
            <AnimatePresence>
              {!is3DReady && (
                <motion.div
                  key="hero-brand-animation"
                  initial={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.04, filter: "blur(4px)" }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none"
                >
                  <HeroBrandAnimation gender={currentModel.gender} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* 2. Live 3D Experience — pointer-events-none on mobile so touches pass through cleanly; md:pointer-events-auto for desktop */}
            <div 
              className={`absolute inset-0 w-full h-full z-10 transition-opacity duration-300 pointer-events-none md:pointer-events-auto ${
                is3DReady ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <HeroModel 
                activeModelId={currentModel.id}
                gender={currentModel.gender} 
                direction={transitionDirection}
                isInView={isInView}
                reducedMotion={Boolean(prefersReducedMotion)}
                pointerRef={pointerRef}
                rotateRef={rotateRef}
                is3DReady={is3DReady}
                isInteracting={isUserInteracting}
                onCycleNext={handleAutoCycle}
                onReady={() => {
                  setIs3DReady(true);
                }} 
                onInteractionChange={(interacting) => {
                  interactingRef.current = interacting;
                  setIsUserInteracting(interacting);
                }}
              />
            </div>

            {/* 3. Mobile Touch Controller: directional swipe locks to 360° avatar spin; vertical swipe scrolls natively */}
            <div 
              ref={mobileTouchRef}
              className="md:hidden absolute inset-0 z-20 touch-pan-y"
            />

            {/* Ambient Aura Background */}
            <div className="absolute inset-0 flex items-center justify-center -z-10 pointer-events-none">
              <div className="w-32 h-64 sm:w-48 sm:h-96 bg-gradient-to-t from-plum-200 to-plum-400 opacity-60 rounded-[100px] blur-sm animate-pulse" />
            </div>
          </div>

          <HeroSwitch 
            side="left" 
            onClick={() => cycleModel(-1)} 
            onMouseEnter={() => {
              const prevIdx = (currentModelIndex - 1 + HERO_MODELS.length) % HERO_MODELS.length;
              preloadHeroModel(HERO_MODELS[prevIdx].path);
            }}
          />
          <HeroSwitch 
            side="right" 
            onClick={() => cycleModel(1)} 
            onMouseEnter={() => {
              const nextIdx = (currentModelIndex + 1) % HERO_MODELS.length;
              preloadHeroModel(HERO_MODELS[nextIdx].path);
            }}
          />

          {/* Floating Outfit Collection Badge — Dynamic position per model with organic water-floating wave motion */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentModel.id}
              initial={{ opacity: 0, x: currentBadgePos.initialX, scale: 0.92 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: currentBadgePos.initialX * 0.8, scale: 0.92 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className={`absolute ${currentBadgePos.positionClass} z-20 pointer-events-auto`}
            >
              {/* Organic "flowing in water" continuous floating motion */}
              <motion.div
                animate={{
                  y: [-5, 5, -5],
                  x: [-2, 2, -2],
                  rotate: [-1, 1, -1],
                }}
                transition={{
                  duration: 4.2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="inline-flex items-center px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-white/95 backdrop-blur-xl border border-plum-200/80 shadow-[0_8px_20px_-4px_rgba(76,29,149,0.15),0_2px_6px_rgba(0,0,0,0.06)] text-left whitespace-nowrap max-w-[155px] xs:max-w-[170px] sm:max-w-none"
              >
                <span className="text-[9.5px] xs:text-[10px] sm:text-[11px] lg:text-[11.5px] text-plum-900 font-semibold tracking-tight sm:tracking-normal truncate">
                  {t(`hero.models.${currentModel.id}.subtitle`, currentModel.subtitle)}
                </span>
              </motion.div>
            </motion.div>
          </AnimatePresence>

          {/* 3-Model Sliding Window Capsule Bar */}
          <div className="absolute bottom-4 sm:bottom-6 lg:bottom-9 left-1/2 -translate-x-1/2 z-20 pointer-events-auto max-w-[96vw]">
            <div className="relative flex items-center justify-center p-1 sm:p-1.5 rounded-full border border-black/5 bg-white/80 shadow-lg backdrop-blur-xl overflow-hidden">
              <div className="flex items-center gap-1 sm:gap-1.5">
                <AnimatePresence initial={false} mode="popLayout">
                  {visibleThreeModels.map((item) => {
                    const isActive = item.originalIndex === currentModelIndex;
                    return (
                      <motion.button
                        key={item.id}
                        layout
                        initial={{ opacity: 0, x: transitionDirection * 35, scale: 0.92 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: -transitionDirection * 35, scale: 0.92 }}
                        transition={{
                          type: "spring",
                          stiffness: 420,
                          damping: 30,
                          opacity: { duration: 0.25 },
                        }}
                        onClick={() => selectModel(item.originalIndex)}
                        onMouseEnter={() => preloadHeroModel(item.path)}
                        className={`relative whitespace-nowrap px-3.5 sm:px-4 py-1.5 text-[11px] sm:text-xs font-semibold tracking-wide rounded-full transition-colors duration-200 cursor-pointer ${
                          isActive ? "text-white" : "text-zinc-600 hover:text-zinc-950 hover:bg-black/5"
                        }`}
                      >
                        {isActive && (
                          <motion.div
                            layoutId="activeSlidingCapsule"
                            className="absolute inset-0 rounded-full bg-plum-600 shadow-sm -z-10"
                            transition={{ type: "spring", stiffness: 450, damping: 32 }}
                          />
                        )}
                        <span className="relative z-10">{t(`hero.models.${item.id}.name`, item.name)}</span>
                      </motion.button>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};



const Testimonials = () => {
  const { t } = useTranslation();
  const [i, setI] = useState(0);

  const TESTIMONIALS = [
    { name: "Selam T.", city: "Addis Ababa", color: "#7c3aed", quote: t("hero.testimonials.1", "Tried the kemis on my own avatar, the fit was flawless.") },
    { name: "Dawit K.", city: "Washington D.C.", color: "#0ea5e9", quote: t("hero.testimonials.2", "Finally ordered Habesha wear without guessing my size.") },
    { name: "Hanna G.", city: "Dubai", color: "#f59e0b", quote: t("hero.testimonials.3", "The Tilet detail is stunning in 3D.") },
  ];

  useEffect(() => {
    const id = setInterval(() => setI((v) => (v + 1) % TESTIMONIALS.length), 4800);
    return () => clearInterval(id);
  }, [TESTIMONIALS.length]);

  const currentT = TESTIMONIALS[i];
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center gap-2">
        <div className="flex text-amber-400">
          {[...Array(5)].map((_, s) => <Star key={s} className="h-3.5 w-3.5 fill-amber-400" />)}
        </div>
        <span className="text-[11px] font-semibold tracking-wider text-zinc-400 uppercase">{t("hero.lovedBy", "Loved by 2,400+ clients")}</span>
      </div>
      <div className="relative h-7 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="flex items-center gap-3"
          >
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white shadow-sm" style={{ backgroundColor: currentT.color }}>
              {currentT.name.charAt(0)}
            </span>
            <p className="text-xs sm:text-sm text-zinc-600 italic">
              "{currentT.quote}" <span className="not-italic font-semibold text-zinc-400 ml-1.5">· {currentT.name}</span>
            </p>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

const HeroSwitch: React.FC<{
  side: "left" | "right";
  onClick: () => void;
  onMouseEnter?: () => void;
}> = ({ side, onClick, onMouseEnter }) => {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      aria-label={side === "left" ? t("hero.prevModel", "Previous avatar (<)") : t("hero.nextModel", "Next avatar (>)")}
      title={side === "left" ? t("hero.prevModel", "Previous avatar (<)") : t("hero.nextModel", "Next avatar (>)")}
      className={`group absolute top-1/2 z-30 pointer-events-auto flex h-10 w-10 sm:h-12 sm:w-12 -translate-y-1/2 items-center justify-center rounded-full border border-black/10 bg-white/70 text-zinc-700 shadow-lg backdrop-blur-xl transition-all duration-300 hover:bg-white hover:text-plum-600 hover:scale-110 active:scale-95 cursor-pointer focus:outline-none focus:ring-2 focus:ring-plum-500/40 ${
        side === "left" ? "left-2 sm:left-4 md:left-6" : "right-2 sm:right-4 md:right-6"
      }`}
    >
      {side === "left" ? (
        <ChevronLeft className="h-5 w-5 pointer-events-none transition-transform group-hover:-translate-x-0.5" />
      ) : (
        <ChevronRight className="h-5 w-5 pointer-events-none transition-transform group-hover:translate-x-0.5" />
      )}
      <span className="hidden lg:group-hover:inline-flex absolute -bottom-7 px-1.5 py-0.5 rounded bg-zinc-900/90 text-[10px] font-mono font-bold text-white shadow-md pointer-events-none whitespace-nowrap">
        {side === "left" ? "<" : ">"}
      </span>
    </button>
  );
};

export default HeroSection;