// src/components/products/EditorialStory.tsx
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

export type StoryItem = {
  phase: string;
  headline: string;
  narrative: string;
};

type EditorialStoryProps = {
  variant: "split" | "centered" | "magazine";
  theme: "light" | "dark";
  accentTitle: string;
  accentSubtitle: string;
  accentDescription: string;
  steps: StoryItem[];
};

const EditorialStory = ({ variant, theme, accentTitle, accentSubtitle, accentDescription, steps }: EditorialStoryProps) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const contentContainersRef = useRef<(HTMLDivElement | null)[]>([]);
  const visualTracksRef = useRef<(HTMLDivElement | null)[]>([]);

  const isDark = theme === "dark";

  useEffect(() => {
    const totalSteps = steps.length;
    const durationPerStep = 6.0;

    const tl = gsap.timeline({
      repeat: -1,
      paused: true,
      onUpdate: () => {
        const progress = tl.progress();
        const index = Math.min(Math.floor(progress * totalSteps), totalSteps - 1);
        setActiveIndex(index);
      },
    });

    timelineRef.current = tl;

    steps.forEach((_, index) => {
      const containerEl = contentContainersRef.current[index];
      const trackingBar = visualTracksRef.current[index];

      if (!containerEl || !trackingBar) return;

      const animatedTexts = containerEl.querySelectorAll(".story-anim-text");
      const subLabel = containerEl.querySelector(".story-anim-label");

      // Group existing nodes safely so GSAP never sees a 'null' reference
      const structuralTargets = [subLabel, ...Array.from(animatedTexts)].filter(Boolean);

      let startY = 20;
      let startScale = 1;
      if (variant === "centered") { startY = 0; startScale = 0.97; }
      if (variant === "magazine") { startY = 10; }

      // IN Animation Sequence
      tl.fromTo(
        structuralTargets,
        { opacity: 0, y: startY, scale: startScale, filter: "blur(8px)" },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          filter: "blur(0px)",
          stagger: 0.05,
          duration: 0.65,
          ease: "power2.out",
        }
      );

      // TRACK BAR TIMELINE SYNC
      tl.fromTo(
        trackingBar,
        { [variant === "magazine" ? "width" : "scaleX"]: 0 },
        {
          [variant === "magazine" ? "width" : "scaleX"]: 1,
          duration: durationPerStep - 0.65,
          ease: "none",
          transformOrigin: "left center",
        },
        "<"
      );

      // OUT Animation Sequence
      tl.to(structuralTargets, {
        opacity: 0,
        y: variant === "centered" ? 0 : -10,
        scale: variant === "centered" ? 0.98 : 1,
        filter: "blur(6px)",
        duration: 0.4,
        ease: "power2.inOut",
      });
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) timelineRef.current?.play();
          else timelineRef.current?.pause();
        });
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);

    return () => {
      if (sectionRef.current) observer.unobserve(sectionRef.current);
      tl.kill();
    };
  }, [steps, variant]);

  const setManualProgress = (index: number) => {
    if (timelineRef.current) {
      timelineRef.current.progress(index / steps.length).play();
    }
  };

  // ==========================================
  // DESIGN VARIANT 1: ASYMMETRIC SPLIT GRID
  // ==========================================
  if (variant === "split") {
    return (
      <section ref={sectionRef} className={`relative py-32 overflow-hidden antialiased ${isDark ? "bg-neutral-950 text-white" : "bg-neutral-50 text-black"}`}>
        <div className="max-w-7xl mx-auto px-8 grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          <div className="lg:col-span-4 space-y-4">
            <span className="text-[10px] tracking-[0.3em] uppercase font-extrabold text-purple-500 block">{accentTitle}</span>
            <h2 className="text-4xl font-black tracking-tight uppercase leading-none">{accentSubtitle}</h2>
            <div className="h-[1px] w-20 bg-purple-500/30 my-4" />
            <p className="text-xs text-neutral-400 font-medium leading-relaxed max-w-sm">{accentDescription}</p>
          </div>
          <div className="lg:col-span-8 relative h-[220px] border-l border-neutral-200/40 pl-12 flex items-center">
            {steps.map((step, idx) => (
              <div key={idx} ref={(el) => { contentContainersRef.current[idx] = el; }} className={`absolute inset-y-0 left-12 right-0 flex flex-col justify-center transition-opacity duration-300 ${activeIndex === idx ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
                <div className="story-anim-label font-mono text-xs text-purple-500 tracking-widest font-bold mb-2">{step.phase}</div>
                <h3 className="story-anim-text text-3xl font-black mb-3 tracking-tight">{step.headline}</h3>
                <p className="story-anim-text text-sm text-neutral-400 max-w-xl font-medium leading-relaxed">{step.narrative}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-8 mt-12">
          <div className="grid grid-cols-3 gap-8">
            {steps.map((step, idx) => (
              <button key={idx} onClick={() => setManualProgress(idx)} className="text-left group outline-none">
                <div className="h-[2px] bg-neutral-200/30 rounded-full overflow-hidden mb-2">
                  <div ref={(el) => { visualTracksRef.current[idx] = el; }} className="h-full bg-purple-600 origin-left" style={{ transform: "scaleX(0)" }} />
                </div>
                <span className={`text-[10px] font-black tracking-widest uppercase transition-colors duration-300 ${activeIndex === idx ? "text-purple-500" : "text-neutral-400"}`}>{step.headline}</span>
              </button>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // ==========================================
  // DESIGN VARIANT 2: VELVET CENTER SYMMETRIC
  // ==========================================
  if (variant === "centered") {
    return (
      <section ref={sectionRef} className="relative py-36 bg-black text-white overflow-hidden antialiased text-center">
        <div className="absolute inset-0 bg-radial-gradient from-purple-900/10 via-transparent to-transparent opacity-60 pointer-events-none" />
        <div className="max-w-4xl mx-auto px-8 relative">
          <span className="text-[9px] tracking-[0.4em] font-black text-purple-400 uppercase block mb-3">{accentTitle}</span>
          <h2 className="text-3xl font-light tracking-widest uppercase text-neutral-300 mb-16">{accentSubtitle}</h2>
          
          <div className="relative h-[180px] flex items-center justify-center">
            {steps.map((step, idx) => (
              <div key={idx} ref={(el) => { contentContainersRef.current[idx] = el; }} className={`absolute inset-x-0 mx-auto max-w-2xl flex flex-col items-center justify-center transition-opacity duration-500 ${activeIndex === idx ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
                <h3 className="story-anim-text text-2xl font-bold tracking-wide text-white mb-4">{step.headline}</h3>
                <p className="story-anim-text text-sm text-neutral-400 font-normal leading-relaxed tracking-wide">{step.narrative}</p>
              </div>
            ))}
          </div>

          <div className="flex justify-center items-center space-x-12 mt-8">
            {steps.map((step, idx) => (
              <button key={idx} onClick={() => setManualProgress(idx)} className="relative py-2 outline-none group text-center">
                <span className={`text-[10px] tracking-[0.2em] font-bold uppercase transition-all duration-300 ${activeIndex === idx ? "text-purple-400 scale-105" : "text-neutral-600 group-hover:text-neutral-400"}`}>{step.phase}</span>
                <div className="absolute bottom-0 inset-x-0 h-[1px] bg-neutral-800">
                  <div ref={(el) => { visualTracksRef.current[idx] = el; }} className="h-full bg-purple-400 origin-left" style={{ transform: "scaleX(0)" }} />
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // ==========================================
  // DESIGN VARIANT 3: LUXURY MAGAZINE EDITORIAL
  // ==========================================
  return (
    <section ref={sectionRef} className="relative py-32 bg-white text-neutral-900 overflow-hidden antialiased">
      <div className="max-w-7xl mx-auto px-8 grid grid-cols-1 lg:grid-cols-12 gap-16">
        <div className="lg:col-span-5 flex flex-col justify-between">
          <div>
            <span className="text-[10px] tracking-widest font-black text-neutral-400 uppercase block mb-2">{accentTitle}</span>
            <h2 className="text-5xl font-serif tracking-tight text-neutral-900 leading-tight">{accentSubtitle}</h2>
          </div>
          <p className="text-sm text-neutral-500 font-medium leading-relaxed max-w-sm mt-8 lg:mt-0">{accentDescription}</p>
        </div>

        <div className="lg:col-span-7 flex flex-col justify-between h-[300px]">
          <div className="relative h-[160px] flex items-center">
            {steps.map((step, idx) => (
              <div key={idx} ref={(el) => { contentContainersRef.current[idx] = el; }} className={`absolute inset-0 flex items-start gap-6 transition-opacity duration-300 ${activeIndex === idx ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
                <span className="story-anim-label font-serif text-5xl font-light text-purple-200 leading-none">0{idx + 1}</span>
                <div>
                  <h3 className="story-anim-text text-xl font-bold tracking-tight text-neutral-900 mb-2">{step.headline}</h3>
                  <p className="story-anim-text text-sm text-neutral-500 leading-relaxed max-w-lg">{step.narrative}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-4 border-t border-neutral-100 pt-6">
            {steps.map((step, idx) => (
              <button key={idx} onClick={() => setManualProgress(idx)} className="w-full flex items-center justify-between text-left group outline-none">
                <span className={`text-xs font-bold tracking-wide transition-colors duration-300 ${activeIndex === idx ? "text-purple-600" : "text-neutral-400 group-hover:text-neutral-700"}`}>{step.headline}</span>
                <div className="w-32 h-[1px] bg-neutral-100 relative overflow-hidden">
                  <div ref={(el) => { visualTracksRef.current[idx] = el; }} className="absolute inset-y-0 left-0 bg-neutral-900 w-0" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default EditorialStory;