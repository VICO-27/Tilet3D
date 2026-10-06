import { useState, useEffect, useRef } from 'react';

export function useScrollDirection() {
  const [scrollPhase, setScrollPhase] = useState(0); 
  // 0: fully visible, 1: navbar hidden, 2: both hidden
  const [scrollY, setScrollY] = useState(0);

  const lastScrollY = useRef(0);
  const phaseRef = useRef(0);
  const scrollTimeout = useRef<any>(null);

  useEffect(() => {
    lastScrollY.current = window.pageYOffset;

    const updateScroll = () => {
      const currentScrollY = window.pageYOffset;
      const dy = currentScrollY - lastScrollY.current;
      const direction = dy > 0 ? 'down' : 'up';
      
      setScrollY(currentScrollY);

      if (direction === 'up' && dy < -5) {
         // Smoothly reveal both
         phaseRef.current = 0;
         setScrollPhase(0);
      } else if (direction === 'down' && dy > 5 && currentScrollY > 50) {
         if (phaseRef.current === 0) {
            phaseRef.current = 1;
            setScrollPhase(1);
         } else if (phaseRef.current === 1.5) {
            // "1.5" means the pause after Phase 1 has finished, so we can hide category nav
            phaseRef.current = 2;
            setScrollPhase(2);
         }
      }

      lastScrollY.current = currentScrollY > 0 ? currentScrollY : 0;

      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
      scrollTimeout.current = setTimeout(() => {
         if (phaseRef.current === 1) {
            // Advance internal phase to 1.5 after pause
            phaseRef.current = 1.5; 
         }
      }, 150);
    };

    window.addEventListener('scroll', updateScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', updateScroll);
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    };
  }, []);

  return { 
    scrollY, 
    navbarHidden: scrollPhase >= 1, 
    categoryHidden: scrollPhase >= 2 
  };
}
