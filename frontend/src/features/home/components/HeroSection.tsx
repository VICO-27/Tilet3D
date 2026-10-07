import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useProgress } from "@react-three/drei";
import { useNavigate } from "react-router-dom";
import { ArrowRight, ChevronLeft, ChevronRight, Star, Sparkles, CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { Gender } from "../../avatar/types/avatar.types";
import HeroModel from "./HeroModel";

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
      staggerChildren: 0.12,
      delayChildren: 0.1, // Wait for aura to start
    },
  },
};

const tumbleVariants: Variants = {
  hidden: { opacity: 0, y: 40, rotate: -4, scale: 0.94 },
  visible: { 
    opacity: 1, 
    y: 0, 
    rotate: 0, 
    scale: 1,
    transition: { type: "spring", stiffness: 220, damping: 20, mass: 0.8 }
  }
};

const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.96 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { type: "spring", stiffness: 200, damping: 20 }
  }
};

const visualVariants: Variants = {
  hidden: { opacity: 0, y: 40, scale: 0.9, rotate: 2 },
  visible: {
    opacity: 1, y: 0, scale: 1, rotate: 0,
    transition: { type: "spring", stiffness: 180, damping: 22, delay: 0.65 }
  }
};

// ─── Living Aura ─────────────────────────────────────────────────────────────
const TiletAura = () => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 1.2, ease: "easeOut" }}
    className="absolute left-1/2 top-1/2 -z-10 h-full w-full -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-80 mix-blend-multiply dark:mix-blend-screen"
  >
    {/* Layer 1: Large atmospheric glow */}
    <motion.div
      animate={{ scale: [1, 1.08, 1], opacity: [0.35, 0.50, 0.35] }}
      transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      className="absolute left-1/2 top-1/2 h-[75%] w-[75%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-200/50 blur-[100px]"
    />
    {/* Layer 2: Brighter core */}
    <motion.div
      animate={{ scale: [0.95, 1.05, 0.95], opacity: [0.4, 0.65, 0.4], x: ["-50%", "-48%", "-52%", "-50%"], y: ["-50%", "-52%", "-48%", "-50%"] }}
      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      className="absolute left-1/2 top-1/2 h-[45%] w-[45%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-plum-300/60 blur-[80px]"
    />
    {/* Layer 3: Secondary offset glow */}
    <motion.div
      animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.35, 0.2], x: ["-30%", "-20%", "-30%"] }}
      transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      className="absolute left-[40%] top-[60%] h-[55%] w-[55%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-100/40 blur-[90px]"
    />
  </motion.div>
);

const HeroSection = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [heroGender, setHeroGender] = useState<Gender>("female");
  const interactingRef = useRef(false);
  const [is3DReady, setIs3DReady] = useState(false);

  // Defer mounting WebGL canvas by two frames to prevent main thread blocking during entrance
  const [mount3D, setMount3D] = useState(false);
  useEffect(() => {
    const raf1 = requestAnimationFrame(() => {
      const raf2 = requestAnimationFrame(() => setMount3D(true));
      return () => cancelAnimationFrame(raf2);
    });
    return () => cancelAnimationFrame(raf1);
  }, []);

  const { progress } = useProgress();

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
            className="mt-8 flex flex-row items-center gap-3 sm:gap-4 w-full max-w-[400px] sm:max-w-none"
          >
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/avatar")}
              className="group flex-1 sm:flex-none inline-flex items-center justify-center gap-2 sm:gap-3 rounded-full bg-zinc-950 px-4 sm:px-8 py-3 sm:py-4 text-[10px] sm:text-sm font-semibold text-white transition-colors duration-300 hover:bg-plum-600 shadow-lg hover:shadow-plum-500/20"
            >
              {t("hero.createAvatar", "Create your avatar")}
              <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/products")}
              className="flex-1 sm:flex-none inline-flex items-center justify-center rounded-full border border-zinc-200 bg-white/60 px-4 sm:px-8 py-3 sm:py-4 text-[10px] sm:text-sm font-semibold text-zinc-800 transition-colors duration-300 hover:border-zinc-300 hover:bg-white hover:shadow-sm"
            >
              {t("hero.explore", "Explore the collection")}
            </motion.button>
          </motion.div>

          {/* Testimonial Stream */}
          <motion.div variants={prefersReducedMotion ? undefined : fadeUpVariants as any} className="mt-10 pt-4">
            <Testimonials />
          </motion.div>
        </motion.div>

        {/* ─── Right Column: Interactive 3D Stage ─── */}
        <motion.div
          variants={prefersReducedMotion ? undefined : visualVariants as any}
          initial="hidden"
          animate="visible"
          className="relative h-full w-full lg:translate-x-6"
          onPointerDown={markInteracting}
          onPointerUp={endInteracting}
        >
          {/* Living Aura Background */}
          {!prefersReducedMotion && <TiletAura />}

          {/* Idle floating motion for the 3D visual */}
          <motion.div
            animate={prefersReducedMotion ? {} : { y: [0, -10, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="h-full w-full relative"
          >
            {mount3D && <HeroModel gender={heroGender} onReady={() => setIs3DReady(true)} />}
            
            {/* Playful Floating Badges */}
            {!prefersReducedMotion && is3DReady && (
              <>
                <motion.div
                  initial={{ opacity: 0, scale: 0.5, rotate: -15 }}
                  animate={{ opacity: 1, scale: 1, rotate: [-2, 2, -2], y: [0, -6, 0] }}
                  transition={{ 
                    opacity: { duration: 0.5, delay: 1.2 },
                    scale: { type: "spring", stiffness: 200, delay: 1.2 },
                    rotate: { duration: 5, repeat: Infinity, ease: "easeInOut" },
                    y: { duration: 4.5, repeat: Infinity, ease: "easeInOut" }
                  }}
                  className="absolute top-1/4 right-8 md:right-16 bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-white shadow-sm flex items-center gap-1.5 z-20"
                >
                  <Sparkles className="w-3.5 h-3.5 text-plum-500" />
                  <span className="text-[10px] font-bold tracking-wider text-zinc-700 uppercase">AI Fitted</span>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.5, rotate: 10 }}
                  animate={{ opacity: 1, scale: 1, rotate: [2, -2, 2], y: [0, 8, 0] }}
                  transition={{ 
                    opacity: { duration: 0.5, delay: 1.4 },
                    scale: { type: "spring", stiffness: 200, delay: 1.4 },
                    rotate: { duration: 6, repeat: Infinity, ease: "easeInOut" },
                    y: { duration: 5.5, repeat: Infinity, ease: "easeInOut" }
                  }}
                  className="absolute bottom-1/3 left-4 md:left-12 bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-white shadow-sm flex items-center gap-1.5 z-20"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                  <span className="text-[10px] font-bold tracking-wider text-zinc-700 uppercase">True Size</span>
                </motion.div>
              </>
            )}
          </motion.div>

          {/* Cinematic Loader Overlay */}
          <AnimatePresence>
            {!is3DReady && <LoaderOverlay progress={progress} />}
          </AnimatePresence>

          {/* Navigation Switches */}
          <HeroSwitch side="left" onClick={() => swapGender(heroGender === "female" ? "male" : "female")} />
          <HeroSwitch side="right" onClick={() => swapGender(heroGender === "female" ? "male" : "female")} />

          {/* Gender Segment Control */}
          <div className="absolute bottom-10 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full border border-black/5 bg-white/70 p-1.5 shadow-lg backdrop-blur-xl">
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
                    className="absolute inset-0 rounded-full bg-plum-600 shadow-sm"
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

const LoaderOverlay = ({ progress = 0 }: { progress?: number }) => {
  const letters = LOGO.split("");
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, filter: "blur(6px)" }}
      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#fafafa]"
    >
      <style>{`
        .hero-loader-shimmer {
          background: linear-gradient(100deg, #09090b 42%, #a21caf 50%, #09090b 58%);
          background-size: 250% 100%;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          animation: heroShimmerSweep 2.6s ease-in-out infinite;
        }
        @keyframes heroShimmerSweep {
          0% { background-position: 200% 0; }
          100% { background-position: -60% 0; }
        }
      `}</style>

      <div className="relative flex flex-col items-center justify-center">
        <div className="absolute h-[260px] w-[260px] sm:h-[340px] sm:w-[340px] rounded-full bg-plum-200/25 blur-[90px]" />
        
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 16, repeat: Infinity, ease: "linear" }}
          className="absolute h-[200px] w-[200px] sm:h-[280px] sm:w-[280px] rounded-full border border-plum-200/50"
        >
          <span className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-plum-500 shadow-[0_0_14px_4px_rgba(162,28,175,0.35)]" />
        </motion.div>

        <div className="flex" style={{ fontFamily: APPLE_FONT }}>
          {letters.map((char, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.8, delay: 0.2 + i * 0.055, ease: [0.16, 1, 0.3, 1] }}
              className="hero-loader-shimmer text-[clamp(2.5rem,7vw,5rem)] font-semibold tracking-tight"
            >
              {char}
            </motion.span>
          ))}
        </div>

        <motion.span
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 + letters.length * 0.055 + 0.25 }}
          className="mt-5 text-[10px] sm:text-xs font-medium tracking-[0.5em] uppercase text-zinc-400"
        >
          {"Preparing your fitting room"}
        </motion.span>

        <div className="mt-8 w-44 sm:w-52 h-[2px] bg-zinc-200 rounded-full overflow-hidden relative">
          <motion.div
            animate={{ width: `${Math.max(progress, 4)}%` }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-plum-400 to-plum-600"
          />
        </div>
      </div>
    </motion.div>
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