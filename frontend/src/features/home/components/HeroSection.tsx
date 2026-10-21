import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { Gender } from "../../avatar/types/avatar.types";
import HeroModel, { preloadGender, type PointerTracker } from "./HeroModel";
import HeroBrandAnimation from "./HeroBrandAnimation";

// Preload hero 3D models immediately
if (typeof window !== "undefined") {
  preloadGender("female");
  preloadGender("male");
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

const HeroSection = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [heroGender, setHeroGender] = useState<Gender>("female");
  const [transitionDirection, setTransitionDirection] = useState<-1 | 1>(1);
  const interactingRef = useRef(false);
  const sectionRef = useRef<HTMLElement>(null);
  const [isInView, setIsInView] = useState(true);
  const [is3DReady, setIs3DReady] = useState(false);

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

  // Only auto-switch gender after 3D avatar has loaded and appeared
  useEffect(() => {
    if (!is3DReady) return;
    const id = setInterval(() => {
      if (!interactingRef.current) {
        setTransitionDirection(1);
        setHeroGender((g) => (g === "female" ? "male" : "female"));
      }
    }, 15000);
    return () => clearInterval(id);
  }, [is3DReady]);

  const markInteracting = () => { interactingRef.current = true; };
  const endInteracting = () => { setTimeout(() => (interactingRef.current = false), 3000); };
  const swapGender = (g: Gender, dir?: -1 | 1) => { 
    markInteracting(); 
    endInteracting(); 
    if (g !== heroGender) {
      const computedDir = dir ?? (g === "male" ? 1 : -1);
      setTransitionDirection(computedDir);
      setHeroGender(g);
    }
  };

  // Only run animations if the user hasn't requested reduced motion
  const prefersReducedMotion = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  return (
    <section 
      ref={sectionRef} 
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className="relative h-screen w-full overflow-hidden bg-[#fafafa] pt-[56px] text-zinc-900 select-none"
    >
      
      <div className="relative grid h-full w-full grid-cols-1 items-center px-6 md:px-16 lg:grid-cols-2 lg:px-20 xl:px-28">
        
        {/* ─── Left Column: Typography & CTAs ─── */}
        <motion.div 
          className="z-10 py-8 lg:py-0"
          variants={prefersReducedMotion ? undefined : containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Eyebrow Badge */}
          <motion.div 
            variants={prefersReducedMotion ? undefined : tumbleVariants}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-black/5 bg-white/80 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-zinc-600 shadow-sm backdrop-blur-md"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-plum-600 animate-pulse" />
            {t("hero.badge", "Fashion, reimagined in 3D")}
          </motion.div>

          {/* Heading with Tumble sequence */}
          <h1 className="text-[clamp(2.75rem,6.5vw,5.5rem)] font-semibold tracking-tight leading-[0.96] text-zinc-950">
            <motion.span variants={prefersReducedMotion ? undefined : tumbleVariants} className="block origin-bottom-left">
              {t("hero.title1", "Wear it")}
            </motion.span>
            <motion.span variants={prefersReducedMotion ? undefined : tumbleVariants} className="block italic text-plum-600 font-serif font-light origin-bottom-left">
              {t("hero.title2", "before you")}
            </motion.span>
            <motion.span variants={prefersReducedMotion ? undefined : tumbleVariants} className="block origin-bottom-left">
              {t("hero.title3", "buy it.")}
            </motion.span>
          </h1>

          {/* Subtitle */}
          <motion.p 
            variants={prefersReducedMotion ? undefined : fadeUpVariants}
            className="mt-6 max-w-lg text-base sm:text-lg leading-relaxed text-zinc-600 font-normal"
          >
            {t("hero.subtitle", "Build your 3D avatar and fit hand-woven Ethiopian couture to your exact proportions—before the first thread is spun.")}
          </motion.p>

          {/* Call to Actions */}
          <motion.div 
            variants={prefersReducedMotion ? undefined : fadeUpVariants}
            className="mt-6 sm:mt-8 flex flex-row items-center gap-2 sm:gap-4 w-[85%] sm:w-full max-w-[320px] sm:max-w-none"
          >
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/avatar")}
              className="group flex-1 sm:flex-none inline-flex min-h-[44px] items-center justify-center rounded-full bg-white/70 backdrop-blur-xl border border-white/50 px-4 sm:px-8 py-2.5 sm:py-4 text-[10px] sm:text-sm font-bold tracking-wide text-zinc-900 transition-all duration-300 hover:bg-white hover:border-white shadow-sm hover:shadow-md"
            >
              {t("hero.createAvatar", "Create your avatar")}
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
              className="flex-1 sm:flex-none inline-flex min-h-[44px] items-center justify-center rounded-full bg-plum-600 px-3 sm:px-8 py-2.5 sm:py-4 text-[10px] sm:text-sm font-semibold text-white transition-colors duration-300 hover:bg-plum-700 shadow-lg hover:shadow-plum-600/30"
            >
              {t("hero.shopNow", "Shop Now")}
            </motion.button>
          </motion.div>

          {/* Testimonial Stream */}
          <motion.div variants={prefersReducedMotion ? undefined : fadeUpVariants} className="mt-10 pt-4">
            <Testimonials />
          </motion.div>
        </motion.div>

        {/* ─── Right Column: Interactive Static Image Stage ─── */}
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          className="relative h-[50vh] lg:h-full w-full lg:translate-x-6 flex items-center justify-center"
        >
          {/* Living Aura Background */}
          <TiletAura />

          {/* Visual Stage: Mind-blowing Brand Animation while 3D is preparing -> Seamless dissolve to Live 3D */}
          <div className="relative w-full h-[80%] max-h-[600px] flex items-center justify-center">
            {/* 1. Mesmerizing 3D Brand Animation — active until Three.js/GLB is ready */}
            <AnimatePresence>
              {!is3DReady && (
                <motion.div
                  key="hero-brand-animation"
                  initial={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.08, filter: "blur(6px)" }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none"
                >
                  <HeroBrandAnimation gender={heroGender} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* 2. Live 3D Experience — mounted immediately, fades in seamlessly once 1st frame is ready */}
            <div 
              className={`absolute inset-0 w-full h-full z-20 transition-opacity duration-700 cursor-grab active:cursor-grabbing overflow-hidden ${
                is3DReady ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
              }`}
              style={{
                WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 12%, black 88%, transparent 100%)',
                maskImage: 'linear-gradient(to right, transparent 0%, black 12%, black 88%, transparent 100%)',
              }}
            >

              <HeroModel 
                gender={heroGender} 
                direction={transitionDirection}
                isInView={isInView}
                reducedMotion={Boolean(prefersReducedMotion)}
                pointerRef={pointerRef}
                onReady={() => {
                  setIs3DReady(true);
                }} 
                onInteractionChange={(interacting) => {
                  interactingRef.current = interacting;
                }}
              />
            </div>

            {/* Ambient Aura Background */}
            <div className="absolute inset-0 flex items-center justify-center -z-10 pointer-events-none">
               <div className="w-32 h-64 sm:w-48 sm:h-96 bg-gradient-to-t from-plum-200 to-plum-400 opacity-60 rounded-[100px] blur-sm animate-pulse" />
            </div>
          </div>

          <HeroSwitch 
            side="left" 
            onClick={() => swapGender(heroGender === "female" ? "male" : "female", -1)} 
            onMouseEnter={() => preloadGender(heroGender === "female" ? "male" : "female")}
          />
          <HeroSwitch 
            side="right" 
            onClick={() => swapGender(heroGender === "female" ? "male" : "female", 1)} 
            onMouseEnter={() => preloadGender(heroGender === "female" ? "male" : "female")}
          />

          {/* Interactive Hint Indicator */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/70 backdrop-blur-md border border-black/5 shadow-xs text-[10px] tracking-widest uppercase font-medium text-zinc-500 select-none pointer-events-none transition-opacity duration-300">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-plum-500 animate-pulse" />
            <span>Drag to rotate · 360° View</span>
          </div>

          <div className="absolute bottom-10 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full border border-black/5 bg-white/70 p-1.5 shadow-lg backdrop-blur-xl z-20 pointer-events-auto">
            {(["female", "male"] as Gender[]).map((g) => (
              <button
                key={g}
                onClick={() => swapGender(g, g === "male" ? 1 : -1)}
                onMouseEnter={() => {
                  if (heroGender !== g) {
                    preloadGender(g);
                  }
                }}
                className={`relative px-5 py-2 text-xs font-semibold uppercase tracking-wider transition-colors duration-300 ${
                  heroGender === g ? "text-white" : "text-zinc-500 hover:text-zinc-900"
                }`}
              >
                {heroGender === g && (
                  <motion.div
                    layoutId="genderCapsule"
                    className="absolute inset-0 rounded-full bg-plum-600 shadow-sm -z-10"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{t(`hero.gender.${g}`, g)}</span>
              </button>
            ))}
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
    { name: "Selam T.", city: "Addis Ababa", color: "#7c3aed", quote: t("hero.testimonials.1", "Tried the kemis on my own avatar — the fit was flawless.") },
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
              "{currentT.quote}" <span className="not-italic font-semibold text-zinc-400 ml-1.5">— {currentT.name}</span>
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
}> = ({ side, onClick, onMouseEnter }) => (
  <button
    type="button"
    onClick={onClick}
    onMouseEnter={onMouseEnter}
    aria-label={side === "left" ? "Previous avatar" : "Next avatar"}
    title={side === "left" ? "Previous avatar" : "Next avatar"}
    className={`absolute top-1/2 z-30 pointer-events-auto flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-black/10 bg-white/70 text-zinc-700 shadow-lg backdrop-blur-xl transition-all duration-300 hover:bg-white hover:text-plum-600 hover:scale-110 active:scale-95 cursor-pointer focus:outline-none focus:ring-2 focus:ring-plum-500/40 ${
      side === "left" ? "left-3 sm:left-5 md:left-6" : "right-3 sm:right-5 md:right-6"
    }`}
  >
    {side === "left" ? (
      <ChevronLeft className="h-5 w-5 pointer-events-none" />
    ) : (
      <ChevronRight className="h-5 w-5 pointer-events-none" />
    )}
  </button>
);

export default HeroSection;