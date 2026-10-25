import React, { useMemo, useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useProducts } from '../hooks/useProducts';
import { useProductSearch } from '../hooks/useProductSearch';
import ProductPageHeader from '../components/ProductPageHeader';
import CategoryBlock from '../components/CategoryBlock';
import BlockDivider from '../components/BlockDivider';
import PageLayout from '@/shared/components/layout/PageLayout';
import BrandLoader from '@/shared/components/BrandLoader';
import ProductCard, { Product } from '../components/ProductCard';
import ProductsSkeleton from '../components/ProductsSkeleton';
import { Search, X, ArrowRight, SlidersHorizontal, Sparkles, Clock, Calendar } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { FilterDrawer } from '../components/FilterDrawer';

const STORY_VARIATIONS = [
  { title: "Every pattern tells a story", subtitle: "For centuries, Ethiopian weavers have encoded geography, faith, and family into the Tilet, the woven border that crowns every garment.", variant: "light" as const, align: "left" as const, watermark: "TILET" },
  { title: "Woven on pit looms, by hand", subtitle: "From the cotton fields of Arba Minch to the looms of Shiro Meda, each piece passes through dozens of artisan hands before it ever reaches yours.", variant: "dark" as const, align: "left" as const, watermark: "HAND" },
  { title: "The geometry of heritage", subtitle: "Each diamond and line represents a profound architectural or spiritual landmark, speaking a silent language known to the community.", variant: "plum" as const, align: "right" as const, watermark: "HERITAGE" },
  { title: "A dialogue across centuries", subtitle: "By blending authentic Habesha weaving techniques with structural 3D design, we anchor timeless heritage firmly into the modern day.", variant: "light" as const, align: "right" as const, watermark: "3D" },
  { title: "Honoring the master weavers", subtitle: "Every single piece is hand-finished in Ethiopia's finest ateliers, honoring the patience, skill, and souls of the artisans behind the craft.", variant: "dark" as const, align: "left" as const, watermark: "LOOM" }
];

const CUTOFF_CATEGORY = "netela";


// ==========================================
// MAIN PAGE COMPONENT
// ==========================================
const ProductsPage: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get("q") || "";
  const navigate = useNavigate();

  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Normal view full catalog
  const { groupedProducts, categories, isLoading, error, hasNextPage, isFetchingNext, loadMore } = useProducts();
  
  // Search and filter view
  const { data: searchData, isLoading: isSearchLoading, hasFilters, isFetchingNext: isSearchFetchingNext, hasNextPage: searchHasNextPage, loadMore: searchLoadMore } = useProductSearch(searchParams);

  // Auto-open filter drawer if requested
  useEffect(() => {
    if (searchParams.get('open_filters') === 'true') {
      setIsFilterOpen(true);
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('open_filters');
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const [viewContext, setViewContext] = useState<string>('normal');
  const [newTimeFilter, setNewTimeFilter] = useState<'all' | 'day' | 'week' | 'month'>('all');
  const [visibleCount, setVisibleCount] = useState(3);
  const [showBrandLoader, setShowBrandLoader] = useState(true);

  // Keep BrandLoader visible until the products have fully loaded in the background!
  useEffect(() => {
    if (!isLoading) {
      // The moment the products are fetched and ready, we drop the BrandLoader
      // Added a slight 400ms delay so the beautiful brand animation isn't abruptly cut off if network is instantly fast
      const timer = setTimeout(() => {
        setShowBrandLoader(false);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  const [activeScrollCategory, setActiveScrollCategory] = useState<string>("All");

  
  useEffect(() => {
    let ticking = false;

    const updateActiveCategory = () => {
      if (viewContext !== 'normal' || searchQuery) {
        ticking = false;
        return;
      }
      
      let current = "All";
      const elements = document.querySelectorAll('[id^="category-"]');
      elements.forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.top <= 140) {
          current = el.id.replace('category-', '');
        }
      });
      
      if (window.scrollY < 200) current = "All";
      setActiveScrollCategory(current);
      ticking = false;
    };

    const handleScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(updateActiveCategory);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    updateActiveCategory();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [viewContext, searchQuery]);

  const allProducts = useMemo(() => {
    const list: Product[] = [];
    Object.values(groupedProducts).forEach((prods) => {
      if (Array.isArray(prods)) {
        list.push(...prods);
      }
    });
    return list;
  }, [groupedProducts]);

  // Group products into Day, Week, and Month arrivals
  const { dayProducts, weekProducts, monthProducts, allNewProducts } = useMemo(() => {
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const sevenDaysMs = 7 * oneDayMs;
    const thirtyDaysMs = 30 * oneDayMs;

    const day: Product[] = [];
    const week: Product[] = [];
    const month: Product[] = [];
    const seen = new Set<string>();

    const sorted = [...allProducts].sort((a, b) => {
      const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return timeB - timeA;
    });

    sorted.forEach((p) => {
      if (seen.has(p.id)) return;
      seen.add(p.id);

      if (!p.created_at) {
        month.push(p);
        return;
      }
      const createdTime = new Date(p.created_at).getTime();
      if (isNaN(createdTime)) {
        month.push(p);
        return;
      }

      const diff = now - createdTime;
      if (diff <= oneDayMs) {
        day.push(p);
      } else if (diff <= sevenDaysMs) {
        week.push(p);
      } else if (diff <= thirtyDaysMs) {
        month.push(p);
      } else {
        month.push(p);
      }
    });

    const allNew = [...day, ...week, ...month];
    return { dayProducts: day, weekProducts: week, monthProducts: month, allNewProducts: allNew };
  }, [allProducts]);

  const handleSelectNew = () => {
    if (searchQuery) clearSearch();
    setViewContext('new');
    setNewTimeFilter('all');
    window.scrollTo({ top: 380, behavior: 'smooth' });
  };

  const clearSearch = () => {
    // Clear all filters and search
    setSearchParams(new URLSearchParams());
  };

  const activeCategories = useMemo(() => {
    return categories.filter((cat) => groupedProducts[cat]?.length > 0);
  }, [categories, groupedProducts]);

  const activeRenderList = useMemo(() => {
    if (viewContext === 'normal') {
      return activeCategories.slice(0, visibleCount);
    }

    const chosenIndex = activeCategories.findIndex(
      (cat) => cat.toLowerCase() === viewContext.toLowerCase()
    );

    if (chosenIndex !== -1) {
      return activeCategories.slice(chosenIndex);
    }

    return activeCategories.slice(0, 3);
  }, [viewContext, visibleCount, activeCategories]);

  // ==========================================
  // ROW DATA MANIPULATION LOGIC
  // ==========================================
  const displayProducts = useMemo(() => {
    const updatedGroups = { ...groupedProducts };

    const kemisKey = Object.keys(updatedGroups).find(k => k.toLowerCase().includes('kemis'));

    if (kemisKey && updatedGroups[kemisKey] && updatedGroups[kemisKey].length > 0) {
      const allKemis = [...updatedGroups[kemisKey]];

      // 1. Separate the Couture Collection pieces (User favorites: Row 1 Cards 1-10 & Row 2 Cards 1-5)
      const getCollectionNum = (slug: string) => {
        const match = slug.match(/collection-(\d+)/);
        return match ? parseInt(match[1], 10) : 999;
      };

      const coutureCollection = allKemis
        .filter(p => p.slug.includes('collection'))
        .sort((a, b) => getCollectionNum(a.slug) - getCollectionNum(b.slug));

      // 2. Separate all the new bespoke products deployed recently
      const bespokeKemis = allKemis
        .filter(p => p.slug.includes('bespoke'))
        .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));

      // 3. Separate all other older products
      const otherKemis = allKemis
        .filter(p => !p.slug.includes('collection') && !p.slug.includes('bespoke'))
        .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));

      // Row 1 (Cards 1-10) + Row 2 (Cards 1-5) = 15 Couture Collection items
      // Row 2 Card 6 = first bespoke piece (kept from Row 2 cards 1-6)
      // Row 2 Cards 7-10 (4 cards) + Row 3 Cards 1-10 (10 cards) = filled with new bespoke pieces
      const top16 = coutureCollection.length >= 15
        ? [...coutureCollection.slice(0, 15), bespokeKemis[0]].filter(Boolean)
        : coutureCollection;

      const remainingBespoke = bespokeKemis.filter(p => !top16.some(t => t.id === p.id));

      updatedGroups[kemisKey] = [
        ...top16,
        ...remainingBespoke,
        ...otherKemis,
      ];
    }

    return updatedGroups;
  }, [groupedProducts]);

  useEffect(() => {
    if (viewContext !== 'normal') {
      window.scrollTo({ top: 380, behavior: 'smooth' });
    }
  }, [viewContext]);

  const handleCategoryNavigation = (rawCat: string) => {
    if (searchQuery) clearSearch();
    const normalizedCat = rawCat.toLowerCase();

    if (normalizedCat === 'all') {
      setViewContext('normal');
      setVisibleCount(3);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const isInitiallyAvailable = activeRenderList.some(i => i.toLowerCase() === normalizedCat);

    if (isInitiallyAvailable) {
      setViewContext('normal');
      setTimeout(() => {
        const exactCatName = activeCategories.find(c => c.toLowerCase() === normalizedCat);
        const element = document.getElementById(`category-${exactCatName}`);
        if (element) {
          window.scrollTo({
            top: element.offsetTop - 96,
            behavior: "smooth"
          });
        }
      }, 50);
    } else {
      setViewContext(normalizedCat);
    }
  };




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

    const handleWheel = (e: WheelEvent) => {
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

    const handleTouchStart = (e: TouchEvent) => {
      lastTouchY = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
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

  // Render BrandLoader first
  if (showBrandLoader) {
    return <BrandLoader />;
  }

  if (error) return <div className="text-center py-20 text-red-500">{error}</div>;


  return (
    <PageLayout>
      <ProductPageHeader
        categories={categories}
        activeCategory={viewContext === 'new' ? '' : activeScrollCategory}
        onCategorySelect={handleCategoryNavigation}
        isNewActive={viewContext === 'new'}
        onSelectNew={handleSelectNew}
      />

      <main className="min-h-screen pb-32">
        {/* 2. If STILL loading after BrandLoader finishes, show Skeleton */}
        {isLoading ? (
          <ProductsSkeleton />
        ) : hasFilters ? (
          <div className="mx-auto max-w-[1400px] px-6 md:px-10 pt-8 animate-fade-in">
            <div className="flex items-center justify-between mb-10 pb-6 border-b border-stone-200">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-100 text-stone-900">
                  <Search className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-widest text-stone-400 font-semibold">{t("products.filters.activeFilter", "Search Filter Active")}</p>
                  <h1 className="font-serif text-2xl font-medium text-stone-900">
                    {searchQuery ? `${t("common.search", "Search")}: "${searchQuery}"` : t("products.filters.title", "Filtered Results")}
                  </h1>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsFilterOpen(true)}
                  className="inline-flex items-center gap-2 rounded-full bg-stone-100 px-4 py-2 text-xs font-bold uppercase tracking-wider text-stone-700 hover:bg-stone-900 hover:text-white transition-colors"
                >
                  <SlidersHorizontal size={14} /> {t("products.filters.title", "Filters")}
                </button>
                <button
                  onClick={clearSearch}
                  className="inline-flex items-center gap-2 rounded-full bg-stone-100 px-4 py-2 text-xs font-bold uppercase tracking-wider text-stone-700 hover:bg-stone-900 hover:text-white transition-colors"
                >
                  <X className="h-4 w-4" /> {t("common.clearAll", "Clear All")}
                </button>
              </div>
            </div>

            {isSearchLoading ? (
               <ProductsSkeleton />
            ) : !searchData || searchData.results.length === 0 ? (
              <div className="py-24 text-center space-y-8 animate-fade-in">
                <div className="space-y-3">
                  <p className="font-serif text-2xl text-stone-900">{t("products.filters.noMatch", "We couldn't find an exact match")}</p>
                  <p className="text-xs text-stone-400">{t("products.filters.noMatchSubtitle", "But we think you'll love these pieces from our collection.")}</p>
                </div>
                
                {/* Fallback to showing normal products instead of a dead end! */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12 text-left">
                  {allProducts.slice(0, 6).map((product, index) => (
                    <ProductCard key={`fallback-${product.id}-${index}`} product={product} index={index} />
                  ))}
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {searchData.results.map((product, index) => (
                    <ProductCard key={`${product.id}-${index}`} product={product} index={index} />
                  ))}
                </div>
                
                {/* Infinite Scroll / Load More */}
                {searchHasNextPage && (
                  <div className="w-full flex justify-center mt-16 mb-8 relative z-10 px-6">
                    <button
                      onClick={searchLoadMore}
                      disabled={isSearchFetchingNext}
                      className="px-10 py-4 bg-black text-white text-[12px] font-black uppercase tracking-[0.3em] rounded-full hover:bg-zinc-800 transition-colors disabled:opacity-50"
                    >
                      {isSearchFetchingNext ? t("common.loading", "Loading...") : t("products.drops.loadMore", "Load More")}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        ) : viewContext === 'new' ? (
          /* ================= NEW PRODUCTS CATEGORIZED BY DAY, WEEK, MONTH ================= */
          <div className="mx-auto max-w-[1400px] px-4 sm:px-6 md:px-10 pt-4 sm:pt-8 animate-fade-in">
            {/* Header banner */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 pb-6 border-b border-zinc-200">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-[11px] font-bold tracking-wider uppercase">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>{t("products.drops.curatedDrops", "✦ Curated Drops")}</span>
                </div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-zinc-900 tracking-tight">
                  {t("products.drops.newTitle", "New In Collection")}
                </h1>
                <p className="text-xs sm:text-sm text-zinc-500 max-w-2xl">
                  {t("products.drops.newSubtitle", "Handcrafted Habesha attire fresh from our master weavers. Categorized by arrival timeframe: Day, Week, and Month.")}
                </p>
              </div>

              {/* Timeframe sub-tabs */}
              <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-1">
                <button
                  onClick={() => setNewTimeFilter('all')}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
                    newTimeFilter === 'all'
                      ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-md shadow-purple-900/20'
                      : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
                  }`}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>{t("products.drops.allNew", "All New")}</span>
                  <span className={`ml-1 text-[10px] px-1.5 py-0.5 rounded-full font-bold ${newTimeFilter === 'all' ? 'bg-white/20 text-white' : 'bg-black/10 text-zinc-700'}`}>
                    {allNewProducts.length}
                  </span>
                </button>

                <button
                  onClick={() => setNewTimeFilter('day')}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
                    newTimeFilter === 'day'
                      ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-md shadow-purple-900/20'
                      : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
                  }`}
                >
                  <Clock className="h-3.5 w-3.5" />
                  <span>{t("products.drops.day", "Day / Today")}</span>
                  <span className={`ml-1 text-[10px] px-1.5 py-0.5 rounded-full font-bold ${newTimeFilter === 'day' ? 'bg-white/20 text-white' : 'bg-black/10 text-zinc-700'}`}>
                    {dayProducts.length}
                  </span>
                </button>

                <button
                  onClick={() => setNewTimeFilter('week')}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
                    newTimeFilter === 'week'
                      ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-md shadow-purple-900/20'
                      : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
                  }`}
                >
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{t("products.drops.week", "This Week")}</span>
                  <span className={`ml-1 text-[10px] px-1.5 py-0.5 rounded-full font-bold ${newTimeFilter === 'week' ? 'bg-white/20 text-white' : 'bg-black/10 text-zinc-700'}`}>
                    {weekProducts.length}
                  </span>
                </button>

                <button
                  onClick={() => setNewTimeFilter('month')}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
                    newTimeFilter === 'month'
                      ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-md shadow-purple-900/20'
                      : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
                  }`}
                >
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{t("products.drops.month", "This Month")}</span>
                  <span className={`ml-1 text-[10px] px-1.5 py-0.5 rounded-full font-bold ${newTimeFilter === 'month' ? 'bg-white/20 text-white' : 'bg-black/10 text-zinc-700'}`}>
                    {monthProducts.length}
                  </span>
                </button>
              </div>
            </div>

            {/* Categorized drops */}
            <div className="space-y-16">
              {/* 1. DAY DROPS */}
              {(newTimeFilter === 'all' || newTimeFilter === 'day') && dayProducts.length > 0 && (
                <section>
                  <div className="flex items-center justify-between mb-6 pb-3 border-b border-purple-100">
                    <div>
                      <span className="text-[10px] uppercase tracking-widest font-bold text-purple-600">{t("products.drops.day", "Day / Today")}</span>
                      <h2 className="text-xl sm:text-2xl font-serif font-bold text-zinc-900 flex items-center gap-2">
                        {t("products.drops.dayTitle", "Today's New Drops")}
                        <span className="text-xs font-sans font-bold text-purple-600 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
                          {dayProducts.length} {t("common.pieces", "pieces")}
                        </span>
                      </h2>
                    </div>
                    <span className="text-xs text-zinc-400 hidden sm:inline">{t("products.drops.daySubtitle", "Past 24 hours")}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
                    {dayProducts.map((product, idx) => (
                      <ProductCard key={`day-${product.id}-${idx}`} product={product} index={idx} />
                    ))}
                  </div>
                </section>
              )}

              {/* 2. WEEK DROPS */}
              {(newTimeFilter === 'all' || newTimeFilter === 'week') && weekProducts.length > 0 && (
                <section>
                  <div className="flex items-center justify-between mb-6 pb-3 border-b border-purple-100">
                    <div>
                      <span className="text-[10px] uppercase tracking-widest font-bold text-purple-600">{t("products.drops.week", "This Week")}</span>
                      <h2 className="text-xl sm:text-2xl font-serif font-bold text-zinc-900 flex items-center gap-2">
                        {t("products.drops.weekTitle", "Released This Week")}
                        <span className="text-xs font-sans font-bold text-purple-600 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
                          {weekProducts.length} {t("common.pieces", "pieces")}
                        </span>
                      </h2>
                    </div>
                    <span className="text-xs text-zinc-400 hidden sm:inline">{t("products.drops.weekSubtitle", "Past 7 days")}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
                    {weekProducts.map((product, idx) => (
                      <ProductCard key={`week-${product.id}-${idx}`} product={product} index={idx} />
                    ))}
                  </div>
                </section>
              )}

              {/* 3. MONTH DROPS */}
              {(newTimeFilter === 'all' || newTimeFilter === 'month') && monthProducts.length > 0 && (
                <section>
                  <div className="flex items-center justify-between mb-6 pb-3 border-b border-purple-100">
                    <div>
                      <span className="text-[10px] uppercase tracking-widest font-bold text-purple-600">{t("products.drops.month", "This Month")}</span>
                      <h2 className="text-xl sm:text-2xl font-serif font-bold text-zinc-900 flex items-center gap-2">
                        {t("products.drops.monthTitle", "This Month's Drops")}
                        <span className="text-xs font-sans font-bold text-purple-600 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
                          {monthProducts.length} {t("common.pieces", "pieces")}
                        </span>
                      </h2>
                    </div>
                    <span className="text-xs text-zinc-400 hidden sm:inline">{t("products.drops.monthSubtitle", "Past 30 days")}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
                    {monthProducts.map((product, idx) => (
                      <ProductCard key={`month-${product.id}-${idx}`} product={product} index={idx} />
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* Back to All Collections button */}
            <div className="w-full flex justify-center mt-20 mb-10">
              <button
                onClick={() => handleCategoryNavigation('all')}
                className="px-8 py-3.5 border-2 border-black text-[12px] font-black tracking-[0.25em] uppercase hover:bg-black hover:text-white transition-all duration-300 rounded-full shadow-lg"
              >
                {t("products.drops.backToAll", "← Back to All Collections")}
              </button>
            </div>
          </div>
        ) : (
          <div className="animate-fade-in">
            {activeRenderList.map((cat, index) => {
              const storyData = STORY_VARIATIONS[index % STORY_VARIATIONS.length];
              return (
                <div key={cat} id={`category-${cat}`}>
                  <CategoryBlock categoryName={cat} products={displayProducts[cat] ?? []} />

                  {/* LUXURY "MORE" BUTTON (WITH CORRECT ROUTING) */}
                  <div className="w-full flex justify-center mt-2 mb-16 relative z-10 px-6">
                    <button
                      onClick={() => navigate(`/products/category/${cat.toLowerCase()}`)}
                      className="group flex items-center gap-4 bg-white/60 backdrop-blur-md border border-zinc-200 px-6 py-3 rounded-full text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-600 hover:text-black hover:border-zinc-300 hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-500"
                    >
                      <span>Explore full {cat} collection</span>
                      <div className="bg-zinc-100 text-zinc-400 rounded-full p-1.5 group-hover:bg-black group-hover:text-white transition-colors duration-500">
                        <ArrowRight size={14} className="transform group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </button>
                  </div>

                  {index < activeRenderList.length - 1 && (
                    <BlockDivider
                      title={storyData.title}
                      subtitle={storyData.subtitle}
                      variant={storyData.variant}
                      align={storyData.align}
                      watermark={storyData.watermark}
                    />
                  )}
                </div>
              );
            })}

            {viewContext === 'normal' && (
              <div className="w-full flex flex-col items-center justify-center mt-20 px-6">
                <div className="w-full max-w-5xl h-[1px] bg-gradient-to-r from-transparent via-zinc-200 to-transparent mb-16" />

                <div className="flex flex-col items-center gap-4">
                  <button
                    onClick={() => {
                      if (visibleCount >= activeCategories.length) {
                        // Loop back to the start
                        setVisibleCount(3);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      } else {
                        setVisibleCount(prev => prev + 2);
                      }
                    }}
                    className="inline-flex items-center gap-4 px-10 py-5 bg-black text-white rounded-full shadow-xl hover:bg-zinc-800 transition-all duration-300 hover:-translate-y-1 group"
                  >
                    <span className="text-sm font-black tracking-widest uppercase">{t("products.drops.nextClothes", "Next Clothes")}</span>
                    <div className="bg-white/20 p-2 rounded-full">
                      <ArrowRight size={16} className="transform group-hover:translate-x-1 transition-transform" />
                    </div>
                  </button>
                  <p className="text-[11px] tracking-[0.3em] uppercase font-bold text-zinc-500">
                    {t("common.next", "Next")}: {(visibleCount >= activeCategories.length 
                      ? activeCategories.slice(0, 2) 
                      : activeCategories.slice(visibleCount, visibleCount + 2)).map(c => t(`products.categories.${c}`, c)).join(" & ")}
                  </p>
                </div>
              </div>
            )}

            {viewContext !== 'normal' && (
              <div className="w-full flex justify-center mt-24">
                <button
                  onClick={() => handleCategoryNavigation('all')}
                  className="px-8 py-4 border-2 border-black text-[12px] font-black tracking-[0.25em] uppercase hover:bg-black hover:text-white transition-all duration-300 rounded-full shadow-lg"
                >
                  {t("products.drops.backToAll", "← Back to All Collections")}
                </button>
              </div>
            )}
            
            {viewContext === 'normal' && hasNextPage && (
              <div className="w-full flex justify-center mt-12 mb-24 relative z-10 px-6">
                <button
                  onClick={loadMore}
                  disabled={isFetchingNext}
                  className="px-10 py-4 bg-black text-white text-[12px] font-black uppercase tracking-[0.3em] rounded-full hover:bg-zinc-800 transition-colors disabled:opacity-50"
                >
                  {isFetchingNext ? t("common.loading", "Loading...") : t("products.drops.loadMore", "Load More")}
                </button>
              </div>
            )}
          </div>
        )}
      </main>
      
      <FilterDrawer isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} />
    </PageLayout>
  );
};

export default ProductsPage;