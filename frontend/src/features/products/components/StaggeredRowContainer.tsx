// src/components/products/StaggeredRowContainer.tsx
import { useEffect, useRef, useState } from "react";

type StaggeredRowContainerProps = {
  children: React.ReactNode;
};

const StaggeredRowContainer = ({ children }: StaggeredRowContainerProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [hasEntered, setHasEntered] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasEntered(true);
          // Once loaded, we can unobserve to save GPU cycles
          if (containerRef.current) observer.unobserve(containerRef.current);
        }
      },
      { threshold: 0.05, rootMargin: "0px 0px -40px 0px" }
    );

    if (containerRef.current) observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className={`transition-all duration-300 ${
        hasEntered ? "[&_>_section_>_div_>_div]:animate-fade-stagger" : "[&_>_section_>_div_>_div]:opacity-0"
      }`}
    >
      {children}
    </div>
  );
};

export default StaggeredRowContainer;