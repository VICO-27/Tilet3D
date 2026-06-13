import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

const steps = [
  {
    number: "01",
    title: "Create your avatar",
    desc: "Enter a few measurements and Tilet3D builds a realistic 3D version of you for accurate virtual fitting.",
  },
  {
    number: "02",
    title: "Try on Habesha couture",
    desc: "See authentic handwoven garments on your avatar in real time. Rotate, zoom and inspect every thread.",
  },
  {
    number: "03",
    title: "Order with confidence",
    desc: "Choose the design you love and order knowing exactly how it looks and fits before tailoring begins.",
  },
];

const HowItWorksSection = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);
  const barRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const total = steps.length;
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

    steps.forEach((_, i) => {
      const el = stepRefs.current[i];
      const bar = barRefs.current[i];
      if (!el || !bar) return;
      const content = el.querySelectorAll(".anim");
      tl.fromTo(
        content,
        { opacity: 0, y: 22, filter: "blur(6px)" },
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
        y: -14,
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
    timelineRef.current?.progress(i / steps.length).play();
  };

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden border-t border-ink/[0.06] bg-white py-28"
    >
      <div className="mx-auto grid max-w-[1200px] grid-cols-1 items-center gap-16 px-6 md:grid-cols-12 md:px-10">
        <div className="md:col-span-5">
          <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-plum-600">
            How it works
          </span>
          <h2 className="display mt-5 text-4xl font-semibold leading-[1.05] text-ink md:text-5xl">
            From measurement
            <br />
            to <span className="italic text-plum-600">perfect fit.</span>
          </h2>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-ink/55">
            Tilet3D turns traditional Habesha tailoring into an effortless,
            real-time 3D experience.
          </p>
        </div>

        <div className="relative flex h-[240px] items-center md:col-span-7">
          {steps.map((step, i) => (
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
              <div className="anim mb-4 font-mono text-xs font-semibold tracking-[0.3em] text-plum-500">
                STEP {step.number}
              </div>
              <h3 className="anim display mb-4 text-3xl font-semibold text-ink md:text-4xl">
                {step.title}
              </h3>
              <p className="anim max-w-xl text-lg leading-relaxed text-ink/55">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto mt-12 max-w-[1200px] px-6 md:px-10">
        <div className="grid grid-cols-3 gap-6 border-t border-ink/10 pt-7">
          {steps.map((step, i) => (
            <button
              key={step.number}
              onClick={() => jump(i)}
              className="group text-left outline-none"
            >
              <div className="mb-3 h-[2px] overflow-hidden rounded-full bg-ink/10">
                <div
                  ref={(el) => {
                    barRefs.current[i] = el;
                  }}
                  className="h-full w-full origin-left bg-plum-600"
                  style={{ transform: "scaleX(0)" }}
                />
              </div>
              <span
                className={`text-[11px] font-semibold uppercase tracking-[0.2em] transition-colors ${
                  activeIndex === i
                    ? "text-plum-600"
                    : "text-ink/40 group-hover:text-ink/70"
                }`}
              >
                {step.title}
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
