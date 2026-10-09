const fs = require('fs');

let content = fs.readFileSync('frontend/src/features/products/pages/ProductsPage.tsx', 'utf8');

const hookLogic = `
  // ==========================================
  // OVERSCROLL "PULL TO LOAD" INFINITE SCROLL
  // ==========================================
  useEffect(() => {
    if (viewContext !== 'normal' || searchQuery) return;

    let accumulatedOverscroll = 0;
    let lastTouchY = 0;

    const triggerNext = () => {
      if (visibleCount >= activeCategories.length) {
        setVisibleCount(3);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setVisibleCount(prev => prev + 2);
      }
    };

    const handleWheel = (e) => {
      const isAtBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 150;
      if (isAtBottom && e.deltaY > 0) {
        accumulatedOverscroll += e.deltaY;
        if (accumulatedOverscroll > 250) { // roughly two strong scrolls
          triggerNext();
          accumulatedOverscroll = 0;
        }
      } else if (e.deltaY < 0) {
        accumulatedOverscroll = 0;
      }
    };

    const handleTouchStart = (e) => {
      lastTouchY = e.touches[0].clientY;
    };

    const handleTouchMove = (e) => {
      const currentY = e.touches[0].clientY;
      const deltaY = lastTouchY - currentY; // positive means scrolling down (swiping up)
      lastTouchY = currentY;

      const isAtBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 150;
      if (isAtBottom && deltaY > 0) {
        accumulatedOverscroll += deltaY;
        if (accumulatedOverscroll > 150) { // mobile swipe threshold
          triggerNext();
          accumulatedOverscroll = 0;
        }
      } else if (deltaY < 0) {
        accumulatedOverscroll = 0;
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: true });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [viewContext, searchQuery, visibleCount, activeCategories.length]);

  if (error) return <div className="text-center py-20 text-red-500">{error}</div>;
`;

content = content.replace(
  '  if (error) return <div className="text-center py-20 text-red-500">{error}</div>;',
  hookLogic
);

fs.writeFileSync('frontend/src/features/products/pages/ProductsPage.tsx', content);
console.log("Successfully injected overscroll infinite scroll hook.");
