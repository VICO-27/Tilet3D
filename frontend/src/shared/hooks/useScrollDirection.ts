import { useState, useEffect, useRef } from 'react';

export function useScrollDirection(maxOffset = 92) {
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down'>('up');
  const [scrollY, setScrollY] = useState(0);
  const [navbarOffset, setNavbarOffset] = useState(0);
  
  const lastScrollY = useRef(0);

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

      setNavbarOffset(prev => {
        if (currentScrollY <= 0) return 0;
        let next = prev - dy;
        if (next > 0) next = 0;
        if (next < -maxOffset) next = -maxOffset;
        return next;
      });

      lastScrollY.current = currentScrollY > 0 ? currentScrollY : 0;
    };

    window.addEventListener('scroll', updateScroll, { passive: true });
    return () => window.removeEventListener('scroll', updateScroll);
  }, [scrollDirection, maxOffset]);

  return { scrollDirection, scrollY, navbarOffset };
}
