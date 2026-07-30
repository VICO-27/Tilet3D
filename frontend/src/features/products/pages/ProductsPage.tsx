// src/features/products/pages/ProductsPage.tsx
import React, { useMemo, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useProducts } from '../hooks/useProducts';
import ProductPageHeader from '../components/ProductPageHeader';
import CategoryBlock from '../components/CategoryBlock';
import BlockDivider from '../components/BlockDivider';
import PageLayout from '@/shared/components/layout/PageLayout';
import BrandLoader from '@/shared/components/BrandLoader';
import ProductCard, { Product } from '../components/ProductCard';
import { Search, X } from 'lucide-react';

const STORY_VARIATIONS = [
  { title: "Every pattern tells a story", subtitle: "For centuries, Ethiopian weavers have encoded geography, faith, and family into the Tilet — the woven border that crowns every garment.", variant: "light" as const, align: "left" as const, watermark: "TILET" },
  { title: "Woven on pit looms, by hand", subtitle: "From the cotton fields of Arba Minch to the looms of Shiro Meda, each piece passes through dozens of artisan hands before it ever reaches yours.", variant: "dark" as const, align: "left" as const, watermark: "HAND" },
  { title: "The geometry of heritage", subtitle: "Each diamond and line represents a profound architectural or spiritual landmark, speaking a silent language known to the community.", variant: "plum" as const, align: "right" as const, watermark: "HERITAGE" },
  { title: "A dialogue across centuries", subtitle: "By blending authentic Habesha weaving techniques with structural 3D design, we anchor timeless heritage firmly into the modern day.", variant: "light" as const, align: "right" as const, watermark: "3D" },
  { title: "Honoring the master weavers", subtitle: "Every single piece is hand-finished in Ethiopia's finest ateliers, honoring the patience, skill, and souls of the artisans behind the craft.", variant: "dark" as const, align: "left" as const, watermark: "LOOM" }
];

const CUTOFF_CATEGORY = "netela";

const ProductsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get("q") || "";

  const { groupedProducts, categories, isLoading, error } = useProducts();
  
  const [viewContext, setViewContext] = useState<string>('normal');
  const [loadDeferredBatch, setLoadDeferredBatch] = useState(false);

  // Flatten all products for searching
  const allProducts = useMemo(() => {
    const list: Product[] = [];
    Object.values(groupedProducts).forEach((prods) => {
      if (Array.isArray(prods)) {
        list.push(...prods);
      }
    });
    return list;
  }, [groupedProducts]);

  // Filter products based on search query
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return allProducts.filter((p) => 
      p.name.toLowerCase().includes(q) || 
      p.variants?.some(v => v.color?.toLowerCase().includes(q) || v.name?.toLowerCase().includes(q))
    );
  }, [searchQuery, allProducts]);

  // Clear search query param
  const clearSearch = () => {
    searchParams.delete("q");
    setSearchParams(searchParams);
  };

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

  if (isLoading) return <BrandLoader />;
  if (error) return <div className="text-center py-20 text-red-500">{error}</div>;

  return (
    <PageLayout>
      <ProductPageHeader 
        categories={categories} 
        onCategorySelect={handleCategoryNavigation} 
      />

      <main className="min-h-screen pb-32">
        {/* IF USER IS SEARCHING */}
        {searchQuery ? (
          <div className="mx-auto max-w-[1400px] px-6 md:px-10 pt-8">
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
                  <ProductCard key={product.id} product={product} index={index} />
                ))}
              </div>
            )}
          </div>
        ) : (
          /* NORMAL CATALOGUE STREAM */
          <>
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
          </>
        )}
      </main>
    </PageLayout>
  );
};

export default ProductsPage;