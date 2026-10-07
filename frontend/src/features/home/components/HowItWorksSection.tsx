import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useTranslation } from "react-i18next";

const stepData = [
  {
    number: "01",
    key: "step1",
    defaultTitle: "Create your avatar",
    defaultDesc: "Enter a few measurements and Tilet3D builds a realistic 3D version of you for accurate virtual fitting.",
  },
  {
    number: "02",
    key: "step2",
    defaultTitle: "Try on Habesha couture",
    defaultDesc: "See authentic handwoven garments on your avatar in real time. Rotate, zoom and inspect every thread.",
  },
  {
    number: "03",
    key: "step3",
    defaultTitle: "Order with confidence",
    defaultDesc: "Choose the design you love and order knowing exactly how it looks and fits before tailoring begins.",
  },
];

import { motion } from "framer-motion";

const HowItWorksSection = () => {
  const { t } = useTranslation();
  const [activeIndex, setActiveIndex] = useState(0);
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);
  const barRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const total = stepData.length;
    const perStep = 5;

    const tl = gsap.timeline({
      repeat: -1,
      paused: true,
      onUpdate: () => {
        const p = tl.progress();
        setActiveIndex(Math.min(Math.floor(p * total), total - 1));
      },
    });
    timelineRef.current = tl;

    stepData.forEach((_, i) => {
      const el = stepRefs.current[i];
      const bar = barRefs.current[i];
      if (!el || !bar) return;
      const content = el.querySelectorAll(".anim");
      
      tl.fromTo(
        content,
        { opacity: 0, y: 18, filter: "blur(6px)" },
        {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          stagger: 0.08,
          duration: 0.6,
          ease: "power3.out",
        },
      );
      tl.fromTo(
        bar,
        { scaleX: 0 },
        {
          scaleX: 1,
          duration: perStep - 0.6,
          ease: "none",
          transformOrigin: "left center",
        },
        "<",
      );
      tl.to(content, {
        opacity: 0,
        y: -12,
        filter: "blur(4px)",
        duration: 0.5,
        ease: "power2.in",
      });
    });

    const obs = new IntersectionObserver(
      ([entry]) =>
        entry.isIntersecting
          ? timelineRef.current?.play()
          : timelineRef.current?.pause(),
      { threshold: 0.35 },
    );
    if (sectionRef.current) obs.observe(sectionRef.current);

    return () => {
      obs.disconnect();
      tl.kill();
    };
  }, []);

  const jump = (i: number) => {
    timelineRef.current?.progress(i / stepData.length).play();
  };

  return (
    <motion.section
      ref={sectionRef}
      initial={{ opacity: 0, y: 30, scale: 0.98 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ type: "spring", stiffness: 180, damping: 22 }}
      className="relative overflow-hidden border-t border-black/[0.06] bg-[#fafafa] py-28 text-zinc-900 select-none"
    >
      <div className="mx-auto grid max-w-[1200px] grid-cols-1 items-center gap-16 px-6 md:grid-cols-12 md:px-10">
        
        {/* Left Column Title */}
        <div className="md:col-span-5">
          <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-plum-600">
            {t("howItWorks.badge", "How it works")}
          </span>
          <h2 className="mt-4 text-4xl font-semibold leading-[1.08] tracking-tight text-zinc-950 md:text-5xl">
            {t("howItWorks.titleLead", "From measurement")}
            <br />
            <span className="font-serif italic text-plum-600 font-light">
              {t("howItWorks.titleAccent", "to perfect fit.")}
            </span>
          </h2>
          <p className="mt-5 max-w-md text-base sm:text-lg leading-relaxed text-zinc-600">
            {t("howItWorks.subtitle", "Tilet3D turns traditional Habesha tailoring into an effortless, real-time 3D experience.")}
          </p>
        </div>

        {/* Right Column Step Stream */}
        <div className="relative flex h-[240px] items-center md:col-span-7">
          {stepData.map((step, i) => (
            <div
              key={step.number}
              ref={(el) => {
                stepRefs.current[i] = el;
              }}
              className={`absolute inset-0 flex flex-col justify-center transition-opacity duration-500 ${
                activeIndex === i
                  ? "opacity-100"
                  : "pointer-events-none opacity-0"
              }`}
            >
              <div className="anim mb-3 font-mono text-xs font-semibold tracking-[0.25em] text-plum-600 uppercase">
                {t("howItWorks.stepLabel", "STEP")} {step.number}
              </div>
              <h3 className="anim mb-3 text-3xl font-semibold tracking-tight text-zinc-950 md:text-4xl">
                {t(`howItWorks.${step.key}.title`, step.defaultTitle)}
              </h3>
              <p className="anim max-w-xl text-base sm:text-lg leading-relaxed text-zinc-600">
                {t(`howItWorks.${step.key}.desc`, step.defaultDesc)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Progress Bar Navigation */}
      <div className="mx-auto mt-12 max-w-[1200px] px-6 md:px-10">
        <div className="grid grid-cols-3 gap-6 border-t border-black/10 pt-7">
          {stepData.map((step, i) => (
            <button
              key={step.number}
              onClick={() => jump(i)}
              className="group text-left outline-none"
            >
              <div className="mb-3 h-[2px] overflow-hidden rounded-full bg-zinc-200">
                <div
                  ref={(el) => {
                    barRefs.current[i] = el;
                  }}
                  className="h-full w-full origin-left bg-plum-600"
                  style={{ transform: "scaleX(0)" }}
                />
              </div>
              <span
                className={`text-[11px] font-semibold uppercase tracking-[0.2em] transition-colors duration-300 ${
                  activeIndex === i
                    ? "text-plum-600"
                    : "text-zinc-400 group-hover:text-zinc-700"
                }`}
              >
                {t(`howItWorks.${step.key}.title`, step.defaultTitle)}
              </span>
            </button>
          ))}
        </div>
      </div>
    </motion.section>
  );
};

export default HowItWorksSection;