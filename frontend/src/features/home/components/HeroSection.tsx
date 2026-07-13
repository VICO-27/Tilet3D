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
    setTimeout(() => (interactingRef.current = false), 1500);
  };
  const swapGender = (g: Gender) => {
    markInteracting();
    endInteracting();
    setHeroGender(g);
  };

  useEffect(() => {
    // Optimization: Delay GSAP slightly to allow 3D Canvas to initialize 
    // without competing for the main thread.
    const ctx = gsap.context(() => {
      gsap
        .timeline({ 
          defaults: { ease: "power4.out", duration: 1.2, force3D: true } 
        })
        .fromTo(
          [line1Ref.current, line2Ref.current, line3Ref.current],
          { opacity: 0, y: 40, filter: "blur(12px)" },
          { 
            opacity: 1, 
            y: 0, 
            filter: "blur(0px)", 
            stagger: 0.1,
            // Optimization: Clear filters after animation to boost scroll performance
            onComplete: () => {
              gsap.set([line1Ref.current, line2Ref.current, line3Ref.current], { clearProps: "filter" });
            }
          }
        )
        .fromTo(
          subRef.current,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.8 },
          "-=0.7"
        )
        .fromTo(
          ctaRef.current,
          { opacity: 0, y: 15 },
          { opacity: 1, y: 0, duration: 0.7 },
          "-=0.6"
        );
    });
    return () => ctx.revert();
  }, []);

  return (
    <section className="relative min-h-screen overflow-hidden bg-white pt-[48px]">
      {/* Optimization: Used will-change on blobs to prevent paint flashes */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-40 top-10 h-[560px] w-[560px] rounded-full bg-plum-200/30 blur-[140px] will-change-transform" />
        <div className="absolute -left-24 bottom-0 h-[420px] w-[420px] rounded-full bg-amber-100/40 blur-[130px] will-change-transform" />
      </div>

      <div className="relative mx-auto grid min-h-[calc(100vh-48px)] max-w-[1400px] grid-cols-1 items-center gap-2 px-6 md:px-10 lg:grid-cols-2 lg:gap-0">
        
        <div className="z-10 pt-6 lg:pt-0">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-ink/10 bg-white px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-ink/60">
            <span className="h-1.5 w-1.5 rounded-full bg-plum-600" />
            Fashion, reimagined in 3D
          </div>

          <h1 className="display text-[clamp(2.75rem,6.5vw,5.25rem)] font-semibold leading-[0.95] text-ink">
            <span ref={line1Ref} className="block will-change-transform">
              Wear it
            </span>
            <span ref={line2Ref} className="block italic text-plum-600 will-change-transform">
              before you
            </span>
            <span ref={line3Ref} className="block will-change-transform">
              buy it.
            </span>
          </h1>

          <p
            ref={subRef}
            className="mt-5 max-w-md text-base leading-relaxed text-ink/65 will-change-transform"
          >
            Build your 3D avatar and fit hand-woven Ethiopian couture to your exact 
            proportions—before the first thread is spun.
          </p>

          <div ref={ctaRef} className="mt-8 flex flex-wrap items-center gap-3 will-change-transform">
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

          <div className="mt-10 flex flex-col gap-6 lg:flex-row lg:items-center">
            <Testimonials />
          </div>
        </div>

        <div
          className="relative h-[60vh] min-h-[460px] w-full lg:-ml-28 lg:-translate-y-3 lg:h-[86vh]"
          onPointerDown={markInteracting}
          onPointerUp={endInteracting}
        >
          <div className="absolute left-1/2 top-1/2 -z-0 h-[80%] w-[80%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-plum-300/30 blur-[120px]" />
          
          <Suspense
            fallback={
              <div className="flex h-full items-center justify-center">
                <div className="h-10 w-10 animate-spin-slow rounded-full border-2 border-plum-200 border-t-plum-600" />
              </div>
            }
          >
            <HeroModel gender={heroGender} />
          </Suspense>

          <motion.div
            key={heroGender}
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "circOut" }}
            className="pointer-events-none absolute inset-0 z-[5]"
            style={{
              background: "white",
              backdropFilter: "blur(8px)",
            }}
          />

          <HeroSwitch side="left" onClick={() => swapGender(heroGender === "female" ? "male" : "female")} />
          <HeroSwitch side="right" onClick={() => swapGender(heroGender === "female" ? "male" : "female")} />

          <div className="absolute bottom-7 left-1/2 flex -translate-x-1/2 gap-1.5">
            {(["female", "male"] as Gender[]).map((g) => (
              <button
                key={g}
                onClick={() => swapGender(g)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  heroGender === g ? "w-6 bg-plum-600" : "w-1.5 bg-ink/20 hover:bg-ink/40"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

const TESTIMONIALS = [
  { name: "Selam T.", city: "Addis Ababa", color: "#7c3aed", quote: "Tried the kemis on my own avatar — the fit was flawless when it arrived." },
  { name: "Dawit K.", city: "Washington D.C.", color: "#0ea5e9", quote: "Finally ordered Habesha wear from abroad without guessing my size." },
  { name: "Hanna G.", city: "Dubai", color: "#f59e0b", quote: "The Tilet detail is stunning. Seeing it in 3D first sold me instantly." },
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
      <div className="flex items-center gap-1.5">
        <div className="flex text-plum-500">
          {[...Array(5)].map((_, s) => (
            <Star key={s} className="h-3.5 w-3.5 fill-plum-500" />
          ))}
        </div>
        <span className="text-[11px] font-semibold tracking-wide text-ink/50 whitespace-nowrap">
          Loved by 2,400+ clients
        </span>
      </div>

      <div className="relative min-w-[320px] lg:min-w-[420px] h-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.4 }}
            className="flex items-center gap-2 whitespace-nowrap"
          >
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white" style={{ backgroundColor: t.color }}>
              {t.name.charAt(0)}
            </span>
            <p className="text-xs text-ink/80">
              <span className="italic">“{t.quote}”</span>
              <span className="text-[10px] font-semibold text-ink/40 ml-2">— {t.name}</span>
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
    className={`absolute top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-ink/10 bg-white/60 text-ink/60 shadow-sm backdrop-blur-md transition-all hover:bg-white hover:text-plum-600 ${
      side === "left" ? "left-1 md:left-3" : "right-1 md:right-3"
    }`}
  >
    {side === "left" ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
  </button>
);

export default HeroSection;