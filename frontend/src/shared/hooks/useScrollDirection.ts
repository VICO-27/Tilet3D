import { useState, useEffect, useRef } from 'react';

export function useScrollDirection(maxOffset = 92) {
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down'>('up');
  const [scrollY, setScrollY] = useState(0);
  const [navbarOffset, setNavbarOffset] = useState(0);
  
  const lastScrollY = useRef(0);
  const scrollPhase = useRef(0); // 0: can hide main navbar, 1: can hide category nav
  const scrollTimeout = useRef<any>(null);

  useEffect(() => {
    // Initialize
    lastScrollY.current = window.pageYOffset;

    const updateScroll = () => {
      const currentScrollY = window.pageYOffset;
      const dy = currentScrollY - lastScrollY.current;
      const direction = dy > 0 ? 'down' : 'up';
      
      setScrollY(currentScrollY);

      if (
        direction !== scrollDirection &&
        (dy > 10 || dy < -10)
      ) {
        setScrollDirection(direction);
      }

      if (direction === 'up') {
        // When scrolling up, reset phase to 0 so they both slide down seamlessly
        scrollPhase.current = 0;
        setNavbarOffset(prev => {
          if (currentScrollY <= 0) return 0;
          let next = prev - dy;
          if (next > 0) next = 0;
          return next;
        });
      } else {
        // Scrolling down
        if (currentScrollY <= 0) {
          scrollPhase.current = 0;
          setNavbarOffset(0);
        } else {
          setNavbarOffset(prev => {
            let next = prev - dy;
            
            // Phase 0: Lock offset at -48 so the Category Nav stays pinned to top
            if (scrollPhase.current === 0) {
              if (next <= -48) next = -48;
            } else {
              // Phase 1: Allow offset to drop to maxOffset (-92) to hide Category Nav
              if (next <= -maxOffset) next = -maxOffset;
            }
            return next;
          });
        }
      }

      lastScrollY.current = currentScrollY > 0 ? currentScrollY : 0;

      // Handle swipe end detection
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
      scrollTimeout.current = setTimeout(() => {
        // Swipe ended. If we are currently locked at -48, advance to phase 1
        // so the NEXT swipe down can hide the category nav.
        setNavbarOffset(currentOffset => {
          if (currentOffset <= -48 && scrollPhase.current === 0) {
            scrollPhase.current = 1;
          }
          return currentOffset;
        });
      }, 150);
    };

    window.addEventListener('scroll', updateScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', updateScroll);
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    };
  }, [scrollDirection, maxOffset]);

  return { scrollDirection, scrollY, navbarOffset };
}
