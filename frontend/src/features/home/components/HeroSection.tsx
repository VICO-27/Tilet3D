import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { useNavigate } from "react-router-dom";
import { ArrowRight, ChevronLeft, ChevronRight, Star, Sparkles, CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { Gender } from "../../avatar/types/avatar.types";


const LOGO = "TILET3D";
const APPLE_FONT =
  "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', 'Helvetica Neue', Arial, sans-serif";

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

const visualVariants: Variants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { duration: 1.0, ease: [0.16, 1, 0.3, 1], delay: 0.2 }
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
  const interactingRef = useRef(false);
  

  // Defer mounting WebGL canvas by two frames to prevent main thread blocking during entrance
  

  

  useEffect(() => {
    const id = setInterval(() => {
      if (!interactingRef.current) {
        setHeroGender((g) => (g === "female" ? "male" : "female"));
      }
    }, 10000);
    return () => clearInterval(id);
  }, []);

  const markInteracting = () => { interactingRef.current = true; };
  const endInteracting = () => { setTimeout(() => (interactingRef.current = false), 2000); };
  const swapGender = (g: Gender) => { markInteracting(); endInteracting(); setHeroGender(g); };

  // Only run animations if the user hasn't requested reduced motion
  const prefersReducedMotion = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  return (
    <section className="relative h-screen w-full overflow-hidden bg-[#fafafa] pt-[56px] text-zinc-900 select-none">
      
      <div className="relative grid h-full w-full grid-cols-1 items-center px-6 md:px-16 lg:grid-cols-2 lg:px-20 xl:px-28">
        
        {/* ─── Left Column: Typography & CTAs ─── */}
        <motion.div 
          className="z-10 py-8 lg:py-0"
          variants={prefersReducedMotion ? undefined : containerVariants as any}
          initial="hidden"
          animate="visible"
        >
          {/* Eyebrow Badge */}
          <motion.div 
            variants={prefersReducedMotion ? undefined : tumbleVariants as any}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-black/5 bg-white/80 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-zinc-600 shadow-sm backdrop-blur-md"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-plum-600 animate-pulse" />
            {t("hero.badge", "Fashion, reimagined in 3D")}
          </motion.div>

          {/* Heading with Tumble sequence */}
          <h1 className="text-[clamp(2.75rem,6.5vw,5.5rem)] font-semibold tracking-tight leading-[0.96] text-zinc-950">
            <motion.span variants={prefersReducedMotion ? undefined : tumbleVariants as any} className="block origin-bottom-left">
              {t("hero.title1", "Wear it")}
            </motion.span>
            <motion.span variants={prefersReducedMotion ? undefined : tumbleVariants as any} className="block italic text-plum-600 font-serif font-light origin-bottom-left">
              {t("hero.title2", "before you")}
            </motion.span>
            <motion.span variants={prefersReducedMotion ? undefined : tumbleVariants as any} className="block origin-bottom-left">
              {t("hero.title3", "buy it.")}
            </motion.span>
          </h1>

          {/* Subtitle */}
          <motion.p 
            variants={prefersReducedMotion ? undefined : fadeUpVariants as any}
            className="mt-6 max-w-lg text-base sm:text-lg leading-relaxed text-zinc-600 font-normal"
          >
            {t("hero.subtitle", "Build your 3D avatar and fit hand-woven Ethiopian couture to your exact proportions—before the first thread is spun.")}
          </motion.p>

          {/* Call to Actions */}
          <motion.div 
            variants={prefersReducedMotion ? undefined : fadeUpVariants as any}
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
          <motion.div variants={prefersReducedMotion ? undefined : fadeUpVariants as any} className="mt-10 pt-4">
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

          {/* Static Hero Fallback instead of heavy WebGL/ThreeJS */}
          <div className="relative w-full h-[80%] max-h-[600px] flex items-center justify-center pointer-events-none z-10">
            <img 
              src={`/models/${heroGender}Avatar_fallback.webp`} 
              alt={`${heroGender} avatar wearing traditional Ethiopian clothing`}
              fetchPriority="high"
              className="object-contain h-full w-full drop-shadow-2xl transition-opacity duration-500"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
            <div className="absolute inset-0 flex items-center justify-center -z-10">
               <div className="w-32 h-64 sm:w-48 sm:h-96 bg-gradient-to-t from-plum-200 to-plum-400 opacity-60 rounded-[100px] blur-sm animate-pulse" />
            </div>
          </div>

          <HeroSwitch side="left" onClick={() => swapGender(heroGender === "female" ? "male" : "female")} />
          <HeroSwitch side="right" onClick={() => swapGender(heroGender === "female" ? "male" : "female")} />

          <div className="absolute bottom-10 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full border border-black/5 bg-white/70 p-1.5 shadow-lg backdrop-blur-xl z-20 pointer-events-auto">
            {(["female", "male"] as Gender[]).map((g) => (
              <button
                key={g}
                onClick={() => swapGender(g)}
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

const HeroSwitch: React.FC<{ side: "left" | "right"; onClick: () => void }> = ({ side, onClick }) => (
  <button
    onClick={onClick}
    className={`absolute top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-black/5 bg-white/60 text-zinc-600 shadow-lg backdrop-blur-xl transition-all duration-300 hover:bg-white hover:text-plum-600 hover:scale-105 active:scale-95 ${side === "left" ? "left-4" : "right-4"}`}
  >
    {side === "left" ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
  </button>
);

export default HeroSection;