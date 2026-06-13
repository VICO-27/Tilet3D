import { Suspense, lazy, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowRight, ChevronLeft, ChevronRight, Star } from "lucide-react";
import type { Gender } from "../../avatar/types/avatar.types";

const HeroModel = lazy(() => import("./HeroModel"));

const HeroSection = () => {
  const navigate = useNavigate();
  const line1Ref = useRef(null);
  const line2Ref = useRef(null);
  const line3Ref = useRef(null);
  const subRef = useRef(null);
  const ctaRef = useRef(null);

  // Hero avatar alternates female ↔ male every 10s while the user isn't interacting.
  const [heroGender, setHeroGender] = useState<Gender>("female");
  const interactingRef = useRef(false);

  useEffect(() => {
    const id = setInterval(() => {
      if (!interactingRef.current) {
        setHeroGender((g) => (g === "female" ? "male" : "female"));
      }
    }, 10000);
    return () => clearInterval(id);
  }, []);

  const markInteracting = () => {
    interactingRef.current = true;
  };
  const endInteracting = () => {
    // brief cool-down so a drag doesn't immediately trigger a swap
    setTimeout(() => (interactingRef.current = false), 1500);
  };
  const swapGender = (g: Gender) => {
    markInteracting();
    endInteracting();
    setHeroGender(g);
  };

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap
        .timeline({ defaults: { ease: "power3.out", duration: 1.1 } })
        .fromTo(
          [line1Ref.current, line2Ref.current, line3Ref.current],
          { opacity: 0, y: 60, filter: "blur(14px)" },
          { opacity: 1, y: 0, filter: "blur(0px)", stagger: 0.12 },
        )
        .fromTo(
          subRef.current,
          { opacity: 0, y: 24 },
          { opacity: 1, y: 0, duration: 0.9 },
          "-=0.6",
        )
        .fromTo(
          ctaRef.current,
          { opacity: 0, y: 18 },
          { opacity: 1, y: 0, duration: 0.8 },
          "-=0.55",
        );
    });
    return () => ctx.revert();
  }, []);

  return (
    <section className="relative min-h-screen overflow-hidden bg-white pt-[48px]">
      {/* Atmospheric accents (kept subtle on white) */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -right-40 top-10 h-[560px] w-[560px] rounded-full bg-plum-200/40 blur-[140px]" />
        <div className="absolute -left-24 bottom-0 h-[420px] w-[420px] rounded-full bg-amber-100/50 blur-[130px]" />
      </div>

      <div className="relative mx-auto grid min-h-[calc(100vh-48px)] max-w-[1400px] grid-cols-1 items-center gap-2 px-6 md:px-10 lg:grid-cols-2 lg:gap-0">
        
        {/* LEFT — copy */}
        <div className="z-10 pt-6 lg:pt-0">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-ink/10 bg-white px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-ink/60">
            <span className="h-1.5 w-1.5 rounded-full bg-plum-600" />
            Fashion, reimagined in 3D
          </div>

          <h1 className="display text-[clamp(2.75rem,6.5vw,5.25rem)] font-semibold leading-[0.95] text-ink">
            <span ref={line1Ref} className="block">
              Wear it
            </span>
            <span ref={line2Ref} className="block italic text-plum-600">
              before you
            </span>
            <span ref={line3Ref} className="block">
              buy it.
            </span>
          </h1>

          {/* Sub-text: Smaller, highly targeted description text */}
          <p
            ref={subRef}
            className="mt-5 max-w-md text-base leading-relaxed text-ink/65"
          >
            Build your 3D avatar and fit hand-woven Ethiopian couture to your exact 
            proportions—before the first thread is spun.
          </p>

          {/* Buttons */}
          <div ref={ctaRef} className="mt-8 flex flex-wrap items-center gap-3">
            <button
              onClick={() => navigate("/avatar")}
              className="group inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-plum-600 hover:shadow-xl hover:shadow-plum-300/40"
            >
              Create your avatar
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>
            <button
              onClick={() => navigate("/products")}
              className="inline-flex items-center rounded-full border border-ink/15 px-6 py-3 text-sm font-semibold text-ink transition-colors hover:border-ink/40 hover:bg-ink/[0.03]"
            >
              Explore the collection
            </button>
          </div>

          {/* Streamlined Feedback Frame */}
          <div className="mt-10 flex flex-col gap-6 lg:flex-row lg:items-center">
            <Testimonials />
          </div>
        </div>

        {/* 
          RIGHT — 3D Avatar Canvas
          PRECISION SHIFT:
          - Changed `lg:-ml-32` to `lg:-ml-28` to pull the layout right ~1cm.
          - Added `lg:-translate-y-3` to shift the canvas frame straight up ~1cm.
        */}
        <div
          className="relative h-[60vh] min-h-[460px] w-full lg:-ml-28 lg:-translate-y-3 lg:h-[86vh]"
          onPointerDown={markInteracting}
          onPointerUp={endInteracting}
        >
          {/* Podium glow + ground */}
          <div className="absolute left-1/2 top-1/2 -z-0 h-[80%] w-[80%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-plum-300/30 blur-[120px]" />
          <div className="absolute bottom-[12%] left-1/2 h-10 w-[60%] -translate-x-1/2 rounded-[50%] bg-ink/10 blur-2xl" />

          <Suspense
            fallback={
              <div className="flex h-full items-center justify-center">
                <div className="h-10 w-10 animate-spin-slow rounded-full border-2 border-plum-200 border-t-plum-600" />
              </div>
            }
          >
            <HeroModel gender={heroGender} />
          </Suspense>

          {/* Dissolve veil — smooths each female ↔ male swap */}
          <motion.div
            key={heroGender}
            initial={{ opacity: 0.85 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="pointer-events-none absolute inset-0 z-[5]"
            style={{
              background:
                "radial-gradient(circle at 50% 45%, rgba(255,255,255,0.9) 0%, rgba(243,239,252,0.6) 45%, rgba(255,255,255,0) 75%)",
              backdropFilter: "blur(6px)",
            }}
          />

          {/* Luxury prev / next avatar switchers */}
          <HeroSwitch side="left" onClick={() => swapGender(heroGender === "female" ? "male" : "female")} />
          <HeroSwitch side="right" onClick={() => swapGender(heroGender === "female" ? "male" : "female")} />

          {/* Floating spec chip */}
          <div className="absolute bottom-6 right-2 hidden rounded-2xl border border-ink/10 bg-white/80 px-4 py-3 shadow-lg shadow-ink/5 backdrop-blur-md md:block">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-plum-500">
              Now previewing
            </p>
            <p className="display text-sm font-semibold capitalize text-ink">
              {heroGender} Avatar
            </p>
          </div>

          {/* Gender dots */}
          <div className="absolute bottom-7 left-1/2 flex -translate-x-1/2 gap-1.5">
            {(["female", "male"] as Gender[]).map((g) => (
              <button
                key={g}
                onClick={() => swapGender(g)}
                aria-label={`${g} avatar`}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  heroGender === g ? "w-6 bg-plum-600" : "w-1.5 bg-ink/20 hover:bg-ink/40"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Scroll cue */}
      <div className="absolute bottom-6 left-1/2 lg:left-[55%] hidden -translate-x-1/2 flex-col items-center gap-2 lg:flex transition-all duration-300">
        <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-ink/35">
          Scroll
        </span>
        <span className="h-10 w-px bg-gradient-to-b from-ink/30 to-transparent" />
      </div>
    </section>
  );
};

const TESTIMONIALS = [
  { name: "Selam T.", city: "Addis Ababa", color: "#7c3aed", quote: "Tried the kemis on my own avatar — the fit was flawless when it arrived." },
  { name: "Dawit K.", city: "Washington D.C.", color: "#0ea5e9", quote: "Finally ordered Habesha wear from abroad without guessing my size." },
  { name: "Hanna G.", city: "Dubai", color: "#f59e0b", quote: "The Tilet detail is stunning. Seeing it in 3D first sold me instantly." },
  { name: "Yonas A.", city: "Toronto", color: "#10b981", quote: "The walk preview is genius — I could see how the shemiz moved." },
  { name: "Mahlet B.", city: "London", color: "#ef4444", quote: "Felt like a private atelier fitting, from my living room." },
];

const Testimonials = () => {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((v) => (v + 1) % TESTIMONIALS.length), 4500);
    return () => clearInterval(id);
  }, []);
  const t = TESTIMONIALS[i];
  return (
    <div className="flex flex-col gap-2 text-ink lg:pb-1">
      
      {/* LINE 1: Stars + Rating Count Text */}
      <div className="flex items-center gap-1.5">
        <div className="flex text-plum-500">
          {Array.from({ length: 5 }).map((_, s) => (
            <Star key={s} className="h-3.5 w-3.5 fill-plum-500" />
          ))}
        </div>
        <span className="text-[11px] font-semibold tracking-wide text-ink/50 whitespace-nowrap">
          Loved by 2,400+ clients
        </span>
      </div>

      {/* LINE 2: Horizontal Quote String */}
      <div className="relative min-w-[320px] lg:min-w-[420px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={i}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="flex items-center gap-2 whitespace-nowrap"
          >
            {/* User Initial Circle */}
            <span
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white shadow-sm"
              style={{ backgroundColor: t.color }}
            >
              {t.name.charAt(0)}
            </span>
            
            {/* Quote + Name in one smooth string */}
            <p className="text-xs text-ink/80 font-normal">
              <span className="italic">“{t.quote}”</span>
              <span className="text-[10px] font-semibold text-ink/40 ml-2">
                — {t.name} · {t.city}
              </span>
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

    </div>
  );
};

const HeroSwitch: React.FC<{ side: "left" | "right"; onClick: () => void }> = ({
  side,
  onClick,
}) => (
  <button
    onClick={onClick}
    aria-label={`${side} avatar`}
    className={`group absolute top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-ink/10 bg-white/60 text-ink/60 shadow-sm backdrop-blur-md transition-all hover:scale-105 hover:border-plum-300 hover:bg-white hover:text-plum-600 ${
      side === "left" ? "left-1 md:left-3" : "right-1 md:right-3"
    }`}
  >
    {side === "left" ? (
      <ChevronLeft className="h-5 w-5 transition-transform group-hover:-translate-x-0.5" />
    ) : (
      <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
    )}
  </button>
);

export default HeroSection;