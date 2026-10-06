/* cspell:disable */
// src/features/products/pages/ProductsPage.tsx
import React, { useMemo, useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useProducts } from '../hooks/useProducts';
import ProductPageHeader from '../components/ProductPageHeader';
import CategoryBlock from '../components/CategoryBlock';
import BlockDivider from '../components/BlockDivider';
import PageLayout from '@/shared/components/layout/PageLayout';
import BrandLoader from '@/shared/components/BrandLoader';
import ProductCard, { Product } from '../components/ProductCard';
import { Search, X, ArrowRight } from 'lucide-react';

const STORY_VARIATIONS = [
  { title: "Every pattern tells a story", subtitle: "For centuries, Ethiopian weavers have encoded geography, faith, and family into the Tilet — the woven border that crowns every garment.", variant: "light" as const, align: "left" as const, watermark: "TILET" },
  { title: "Woven on pit looms, by hand", subtitle: "From the cotton fields of Arba Minch to the looms of Shiro Meda, each piece passes through dozens of artisan hands before it ever reaches yours.", variant: "dark" as const, align: "left" as const, watermark: "HAND" },
  { title: "The geometry of heritage", subtitle: "Each diamond and line represents a profound architectural or spiritual landmark, speaking a silent language known to the community.", variant: "plum" as const, align: "right" as const, watermark: "HERITAGE" },
  { title: "A dialogue across centuries", subtitle: "By blending authentic Habesha weaving techniques with structural 3D design, we anchor timeless heritage firmly into the modern day.", variant: "light" as const, align: "right" as const, watermark: "3D" },
  { title: "Honoring the master weavers", subtitle: "Every single piece is hand-finished in Ethiopia's finest ateliers, honoring the patience, skill, and souls of the artisans behind the craft.", variant: "dark" as const, align: "left" as const, watermark: "LOOM" }
];

const CUTOFF_CATEGORY = "netela";

// ==========================================
// LUXURY SKELETON LOADER COMPONENT
// ==========================================
const ProductsSkeleton = () => (
  <div className="w-full flex flex-col gap-24 py-12 overflow-hidden">
    <style>{`
      @keyframes shimmerSweep {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
      }
      .shimmer-sweep {
        animation: shimmerSweep 2s infinite linear;
      }
    `}</style>

    {[1, 2].map((row) => (
      <div key={row} className="w-full">
        <div className="px-6 md:px-10 mb-8 flex justify-between items-end">
          <div className="w-48 md:w-64 h-10 bg-stone-100 rounded-lg overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent shimmer-sweep" />
          </div>
        </div>

        <div className="flex gap-6 px-6 md:px-10 overflow-hidden w-max">
          {[1, 2, 3, 4, 5].map((card) => (
            <div key={card} className="min-w-[300px] md:min-w-[400px] shrink-0">
              <div className="w-full aspect-[3/4] bg-stone-100 rounded-2xl relative overflow-hidden mb-5">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent shimmer-sweep" />
              </div>
              <div className="space-y-3">
                <div className="w-3/4 h-5 bg-stone-100 rounded-full relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent shimmer-sweep" />
                </div>
                <div className="w-1/3 h-4 bg-stone-100 rounded-full relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent shimmer-sweep" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
);

// ==========================================
// MAIN PAGE COMPONENT
// ==========================================
const ProductsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get("q") || "";
  const navigate = useNavigate();

  const { groupedProducts, categories, isLoading, error } = useProducts();

  const [viewContext, setViewContext] = useState<string>('normal');
  const [loadDeferredBatch, setLoadDeferredBatch] = useState(false);
  const [showBrandLoader, setShowBrandLoader] = useState(true);
  const [activeScrollCategory, setActiveScrollCategory] = useState<string>("All");

  // 1. Brand Loader takes over for the first 800ms to build suspense
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowBrandLoader(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (viewContext !== 'normal' || searchQuery) return;
      
      let current = "All";
      // We will look for elements with id category-{cat}
      // and determine the one most visible at the top.
      const elements = document.querySelectorAll('[id^="category-"]');
      elements.forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.top <= 140) {
          current = el.id.replace('category-', '');
        }
      });
      
      if (window.scrollY < 200) current = "All";
      setActiveScrollCategory(current);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
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

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return allProducts.filter((p) => {
      const matchesName = p.name.toLowerCase().includes(q);
      const matchesVariant = p.variants?.some((v) => {
        const variant = v as { color?: string; name?: string };
        return (
          variant.color?.toLowerCase().includes(q) ||
          variant.name?.toLowerCase().includes(q)
        );
      });
      return matchesName || matchesVariant;
    });
  }, [searchQuery, allProducts]);

  const clearSearch = () => {
    searchParams.delete("q");
    setSearchParams(searchParams);
  };

  const activeCategories = useMemo(() => {
    return categories.filter((cat) => groupedProducts[cat]?.length > 0);
  }, [categories, groupedProducts]);

  const { initialBatch, deferredBatch } = useMemo(() => {
    const cutoffIndex = activeCategories.findIndex(
      (cat) => cat.toLowerCase() === CUTOFF_CATEGORY
    );
    const splitPoint = cutoffIndex !== -1 ? cutoffIndex + 1 : 4;

    return {
      initialBatch: activeCategories.slice(0, splitPoint),
      deferredBatch: activeCategories.slice(splitPoint)
    };
  }, [activeCategories]);

  const activeRenderList = useMemo(() => {
    if (viewContext === 'normal') {
      return loadDeferredBatch ? [...initialBatch, ...deferredBatch] : initialBatch;
    }

    const chosenIndex = activeCategories.findIndex(
      (cat) => cat.toLowerCase() === viewContext.toLowerCase()
    );

    if (chosenIndex !== -1) {
      return activeCategories.slice(chosenIndex);
    }

    return initialBatch;
  }, [viewContext, loadDeferredBatch, activeCategories, initialBatch, deferredBatch]);

  // ==========================================
  // ROW DATA MANIPULATION LOGIC
  // ==========================================
  const displayProducts = useMemo(() => {
    const updatedGroups = { ...groupedProducts };

    const kemisKey = Object.keys(updatedGroups).find(k => k.toLowerCase().includes('kemis'));

    if (kemisKey && updatedGroups[kemisKey] && updatedGroups[kemisKey].length > 0) {
      const allKemis = [...updatedGroups[kemisKey]];

      const newProducts = allKemis.slice(0, 8);
      const oldProducts = allKemis.slice(8);

      const row1Base = oldProducts.slice(0, 6);
      const row1Other = [...oldProducts].reverse().slice(0, 4);

      let row1 = [...row1Base, ...row1Other];
      while (row1.length > 0 && row1.length < 10) {
        row1 = [...row1, ...oldProducts];
      }
      row1 = row1.slice(0, 10);

      let row2 = [...newProducts];
      while (row2.length > 0 && row2.length < 10) {
        row2 = [...row2, ...newProducts];
      }
      row2 = row2.slice(0, 10);

      let row3 = [...oldProducts].reverse().slice(4);
      while (row3.length > 0 && row3.length < 10) {
        row3 = [...row3, ...oldProducts.reverse()];
      }
      row3 = row3.slice(0, 10);

      if (newProducts.length > 0 && oldProducts.length > 0) {
        updatedGroups[kemisKey] = [...row1, ...row2, ...row3];
      }
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
      setLoadDeferredBatch(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const isInitiallyAvailable = initialBatch.some(i => i.toLowerCase() === normalizedCat);

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

  // Render BrandLoader first
  if (showBrandLoader) {
    return <BrandLoader />;
  }

  if (error) return <div className="text-center py-20 text-red-500">{error}</div>;

  return (
    <PageLayout>
      <ProductPageHeader
        categories={categories}
        activeCategory={activeScrollCategory}
        onCategorySelect={handleCategoryNavigation}
      />

      <main className="min-h-screen pb-32">
        {/* 2. If STILL loading after BrandLoader finishes, show Skeleton */}
        {isLoading ? (
          <ProductsSkeleton />
        ) : searchQuery ? (
          <div className="mx-auto max-w-[1400px] px-6 md:px-10 pt-8 animate-fade-in">
            <div className="flex items-center justify-between mb-10 pb-6 border-b border-stone-200">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-100 text-stone-900">
                  <Search className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-widest text-stone-400 font-semibold">Search Filter Active</p>
                  <h1 className="font-serif text-2xl font-medium text-stone-900">Results for "{searchQuery}"</h1>
                </div>
              </div>
              <button
                onClick={clearSearch}
                className="inline-flex items-center gap-2 rounded-full bg-stone-100 px-4 py-2 text-xs font-bold uppercase tracking-wider text-stone-700 hover:bg-stone-900 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" /> Clear Search
              </button>
            </div>

            {searchResults.length === 0 ? (
              <div className="py-24 text-center space-y-3">
                <p className="font-serif text-2xl text-stone-900">No matching pieces found</p>
                <p className="text-xs text-stone-400">Try searching for another name like "Kemis", "Netela", or color.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {searchResults.map((product, index) => (
                  <ProductCard key={`${product.id}-${index}`} product={product} index={index} />
                ))}
              </div>
            )}
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

            {viewContext === 'normal' && !loadDeferredBatch && (
              <div className="w-full flex flex-col items-center justify-center mt-20 px-6">
                <div className="w-full max-w-5xl h-[1px] bg-gradient-to-r from-transparent via-zinc-200 to-transparent mb-16" />

                <p className="text-[11px] tracking-[0.35em] uppercase font-black text-zinc-400 mb-8 animate-pulse">
                  Explore More Collections
                </p>

                <div className="h-[58px] inline-flex items-center gap-3 bg-zinc-50 border border-zinc-200/80 p-2 rounded-full shadow-md hover:shadow-xl transition-all duration-500 hover:scale-[1.01]">
                  {deferredBatch.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => handleCategoryNavigation(cat)}
                      className="h-full px-7 text-[12px] font-bold tracking-widest text-zinc-600 hover:text-black rounded-full hover:bg-white hover:shadow-sm transition-all duration-300 uppercase"
                    >
                      {cat}
                    </button>
                  ))}
                  <div className="h-4 w-[1px] bg-zinc-300 mx-1" />
                  <button
                    onClick={() => setLoadDeferredBatch(true)}
                    className="h-full px-6 text-[12px] font-black tracking-widest text-white bg-black rounded-full hover:bg-zinc-800 transition-all duration-200 uppercase"
                  >
                    View All
                  </button>
                </div>
              </div>
            )}

            {viewContext !== 'normal' && (
              <div className="w-full flex justify-center mt-24">
                <button
                  onClick={() => handleCategoryNavigation('all')}
                  className="px-8 py-4 border-2 border-black text-[12px] font-black tracking-[0.25em] uppercase hover:bg-black hover:text-white transition-all duration-300 rounded-full shadow-lg"
                >
                  ← Back to All Collections
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </PageLayout>
  );
};

export default ProductsPage;