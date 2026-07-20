// src/features/products/pages/ProductsPage.tsx
import React, { useMemo, useState, useEffect } from 'react';
import { useProducts } from '../hooks/useProducts';
import ProductPageHeader from '../components/ProductPageHeader';
import CategoryBlock from '../components/CategoryBlock';
import BlockDivider from '../components/BlockDivider';
import PageLayout from '@/shared/components/layout/PageLayout';
import BrandLoader from '@/shared/components/BrandLoader';

const STORY_VARIATIONS = [
  { title: "Every pattern tells a story", subtitle: "For centuries, Ethiopian weavers have encoded geography, faith, and family into the Tilet — the woven border that crowns every garment.", variant: "light" as const, align: "left" as const, watermark: "TILET" },
  { title: "Woven on pit looms, by hand", subtitle: "From the cotton fields of Arba Minch to the looms of Shiro Meda, each piece passes through dozens of artisan hands before it ever reaches yours.", variant: "dark" as const, align: "left" as const, watermark: "HAND" },
  { title: "The geometry of heritage", subtitle: "Each diamond and line represents a profound architectural or spiritual landmark, speaking a silent language known to the community.", variant: "plum" as const, align: "right" as const, watermark: "HERITAGE" },
  { title: "A dialogue across centuries", subtitle: "By blending authentic Habesha weaving techniques with structural 3D design, we anchor timeless heritage firmly into the modern day.", variant: "light" as const, align: "right" as const, watermark: "3D" },
  { title: "Honoring the master weavers", subtitle: "Every single piece is hand-finished in Ethiopia's finest ateliers, honoring the patience, skill, and souls of the artisans behind the craft.", variant: "dark" as const, align: "left" as const, watermark: "LOOM" }
];

const CUTOFF_CATEGORY = "netela";

const ProductsPage: React.FC = () => {
  const { groupedProducts, categories, isLoading, error } = useProducts();
  
  const [viewContext, setViewContext] = useState<string>('normal');
  const [loadDeferredBatch, setLoadDeferredBatch] = useState(false);

  // 1. Gather all active categories that populated successfully from the hook
  const activeCategories = useMemo(() => {
    return categories.filter((cat) => groupedProducts[cat]?.length > 0);
  }, [categories, groupedProducts]);

  // 2. Identify structural pagination partitions
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

  // 3. Compute Pinterest Dynamic Context Render Stream
  const activeRenderList = useMemo(() => {
    if (viewContext === 'normal') {
      return loadDeferredBatch ? [...initialBatch, ...deferredBatch] : initialBatch;
    }

    const chosenIndex = activeCategories.findIndex(
      (cat) => cat.toLowerCase() === viewContext.toLowerCase()
    );

    if (chosenIndex !== -1) {
      // Return the targeted category and everything after it, filtering out prior blocks
      return activeCategories.slice(chosenIndex);
    }

    return initialBatch;
  }, [viewContext, loadDeferredBatch, activeCategories, initialBatch, deferredBatch]);

  const displayProducts = useMemo(() => {
    const updatedGroups = { ...groupedProducts };
    const kemisKey = Object.keys(updatedGroups).find(k => k.toLowerCase() === 'kemis');
    if (kemisKey && updatedGroups[kemisKey]) {
      updatedGroups[kemisKey] = [...updatedGroups[kemisKey]].reverse();
    }
    return updatedGroups;
  }, [groupedProducts]);

  // Automatically adjust view target focus smoothly
  useEffect(() => {
    if (viewContext !== 'normal') {
      window.scrollTo({ top: 380, behavior: 'smooth' });
    }
  }, [viewContext]);

  // COMBINED CONTROLLER FOR LINK SELECTION
  const handleCategoryNavigation = (rawCat: string) => {
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
        // Standardize element queries to locate dynamic container ids cleanly
        const element = document.getElementById(`category-${exactCatName}`);
        if (element) {
          window.scrollTo({
            top: element.offsetTop - 96,
            behavior: "smooth"
          });
        }
      }, 50);
    } else {
      // Category belongs to page 2 (Deferred): trigger Pinterest filter view swap instantly
      setViewContext(normalizedCat);
    }
  };

  if (isLoading) return <BrandLoader />;
  if (error) return <div className="text-center py-20 text-red-500">{error}</div>;

  return (
    <PageLayout>
      <ProductPageHeader 
        categories={categories} 
        onCategorySelect={handleCategoryNavigation} 
      />

      <main className="min-h-screen pb-32">
        {activeRenderList.map((cat, index) => {
          const storyData = STORY_VARIATIONS[index % STORY_VARIATIONS.length];
          return (
            <div key={cat} id={`category-${cat}`}>
              <CategoryBlock categoryName={cat} products={displayProducts[cat] ?? []} />
              
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

        {/* BOTTOM REFERRAL NAVBAR (Larger, luxury action layout style) */}
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

        {/* Isolated Pinterest View Reset UI Component */}
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
      </main>
    </PageLayout>
  );
};

export default ProductsPage;