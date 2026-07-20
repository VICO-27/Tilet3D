import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowRight, ChevronLeft, ChevronRight, Star } from "lucide-react";
import type { Gender } from "../../avatar/types/avatar.types";

// Removed lazy loading to ensure 3D starts immediately
import HeroModel from "./HeroModel";

const HeroSection = () => {
  const navigate = useNavigate();
  const line1Ref = useRef(null);
  const line2Ref = useRef(null);
  const line3Ref = useRef(null);
  const subRef = useRef(null);
  const ctaRef = useRef(null);

  const [heroGender, setHeroGender] = useState<Gender>("female");
  const interactingRef = useRef(false);
  const [is3DReady, setIs3DReady] = useState(false);

  useEffect(() => {
    const id = setInterval(() => {
      if (!interactingRef.current) {
        setHeroGender((g) => (g === "female" ? "male" : "female"));
      }
    }, 10000);
    return () => clearInterval(id);
  }, []);

  const markInteracting = () => { interactingRef.current = true; };
  const endInteracting = () => { setTimeout(() => (interactingRef.current = false), 1500); };
  const swapGender = (g: Gender) => { markInteracting(); endInteracting(); setHeroGender(g); };

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.timeline({ defaults: { ease: "power4.out", duration: 1.2, force3D: true } })
        .fromTo([line1Ref.current, line2Ref.current, line3Ref.current],
          { opacity: 0, y: 40, filter: "blur(12px)" },
          { opacity: 1, y: 0, filter: "blur(0px)", stagger: 0.1, onComplete: () => {
              gsap.set([line1Ref.current, line2Ref.current, line3Ref.current], { clearProps: "filter" });
            }
          })
        .fromTo(subRef.current, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.8 }, "-=0.7")
        .fromTo(ctaRef.current, { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.7 }, "-=0.6");
    });
    return () => ctx.revert();
  }, []);

  return (
    <section className="relative h-screen w-full overflow-hidden bg-white pt-[48px]">
      {/* Background Blobs - Expanded for full screen */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-20 top-0 h-[80vh] w-[80vh] rounded-full bg-plum-200/25 blur-[120px]" />
        <div className="absolute -left-20 bottom-0 h-[60vh] w-[60vh] rounded-full bg-amber-100/30 blur-[120px]" />
      </div>

      {/* Main Container - Removed max-w constraint and added h-full */}
      <div className="relative grid h-full w-full grid-cols-1 items-center px-8 md:px-16 lg:grid-cols-2 lg:px-24 xl:px-32">
        
        {/* LEFT — Copy */}
        <div className="z-10 py-10 lg:py-0">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-ink/10 bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-ink/60">
            <span className="h-1.5 w-1.5 rounded-full bg-plum-600" />
            Fashion, reimagined in 3D
          </div>

          <h1 className="display text-[clamp(3rem,7vw,6rem)] font-semibold leading-[0.9] text-ink">
            <span ref={line1Ref} className="block">Wear it</span>
            <span ref={line2Ref} className="block italic text-plum-600">before you</span>
            <span ref={line3Ref} className="block">buy it.</span>
          </h1>

          <p ref={subRef} className="mt-6 max-w-lg text-lg leading-relaxed text-ink/60">
            Build your 3D avatar and fit hand-woven Ethiopian couture to your exact 
            proportions—before the first thread is spun.
          </p>

          <div ref={ctaRef} className="mt-10 flex flex-wrap items-center gap-4">
            <button
              onClick={() => navigate("/avatar")}
              className="group inline-flex items-center gap-3 rounded-full bg-ink px-8 py-4 text-sm font-bold text-white transition-all hover:bg-plum-600 hover:shadow-2xl hover:shadow-plum-300/40"
            >
              Create your avatar
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
            <button
              onClick={() => navigate("/products")}
              className="inline-flex items-center rounded-full border border-ink/20 px-8 py-4 text-sm font-bold text-ink transition-colors hover:bg-ink/[0.03]"
            >
              Explore the collection
            </button>
          </div>

          <div className="mt-12">
            <Testimonials />
          </div>
        </div>

        {/* RIGHT — 3D Avatar Canvas */}
        <div
          className="relative h-full w-full lg:translate-x-10"
          onPointerDown={markInteracting}
          onPointerUp={endInteracting}
        >
          <div className="absolute left-1/2 top-1/2 -z-0 h-[90%] w-[90%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-plum-100/40 blur-[140px]" />
          
          <HeroModel gender={heroGender} onReady={() => setIs3DReady(true)} />

          <AnimatePresence>
            {!is3DReady && (
              <motion.div 
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-50 flex items-center justify-center bg-white"
              >
                <div className="h-12 w-12 animate-spin-slow rounded-full border-2 border-plum-200 border-t-plum-600" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Switchers */}
          <HeroSwitch side="left" onClick={() => swapGender(heroGender === "female" ? "male" : "female")} />
          <HeroSwitch side="right" onClick={() => swapGender(heroGender === "female" ? "male" : "female")} />

          {/* Dots */}
          <div className="absolute bottom-10 left-1/2 flex -translate-x-1/2 gap-2">
            {(["female", "male"] as Gender[]).map((g) => (
              <button
                key={g}
                onClick={() => swapGender(g)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  heroGender === g ? "w-8 bg-plum-600" : "w-1.5 bg-ink/20 hover:bg-ink/40"
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
  { name: "Selam T.", city: "Addis Ababa", color: "#7c3aed", quote: "Tried the kemis on my own avatar — the fit was flawless." },
  { name: "Dawit K.", city: "Washington D.C.", color: "#0ea5e9", quote: "Finally ordered Habesha wear without guessing my size." },
  { name: "Hanna G.", city: "Dubai", color: "#f59e0b", quote: "The Tilet detail is stunning in 3D." },
];

const Testimonials = () => {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((v) => (v + 1) % TESTIMONIALS.length), 4500);
    return () => clearInterval(id);
  }, []);
  const t = TESTIMONIALS[i];
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className="flex text-plum-500">
          {[...Array(5)].map((_, s) => <Star key={s} className="h-4 w-4 fill-plum-500" />)}
        </div>
        <span className="text-xs font-bold tracking-wider text-ink/40">Loved by 2,400+ clients</span>
      </div>
      <div className="relative h-8 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div key={i} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="flex items-center gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white" style={{ backgroundColor: t.color }}>{t.name.charAt(0)}</span>
            <p className="text-sm text-ink/70 italic">“{t.quote}” <span className="not-italic font-bold text-ink/30 ml-2">— {t.name}</span></p>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

const HeroSwitch: React.FC<{ side: "left" | "right"; onClick: () => void }> = ({ side, onClick }) => (
  <button onClick={onClick} className={`absolute top-1/2 z-10 flex h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full border border-ink/10 bg-white/40 text-ink/60 backdrop-blur-xl transition-all hover:bg-white hover:text-plum-600 hover:shadow-xl ${side === "left" ? "left-4" : "right-4"}`}>
    {side === "left" ? <ChevronLeft className="h-6 w-6" /> : <ChevronRight className="h-6 w-6" />}
  </button>
);

export default HeroSection;