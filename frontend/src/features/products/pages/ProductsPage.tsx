import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

import Navbar from "../../../shared/components/layout/Navbar";
import ProductFooter from "../components/ProductFooter";
import CategoryNav from "../components/CategoryNav";
import { ProductBlock } from "../components/ProductBlock";
import { ProductCard } from "../components/ProductCard";
import CulturalInterlude from "../components/CulturalInterlude";
import {
  BLOCKS,
  CATEGORIES,
  INTERLUDES,
  PRODUCTS_BY_CATEGORY,
  toClothingVariants,
  type CatalogProduct,
} from "../data/catalog";

// Memoized slug helper to prevent unnecessary string operations
const getSlug = (s: string) => s.toLowerCase().replace(/\s+/g, "-");
const ALL_PRODUCTS = Object.values(PRODUCTS_BY_CATEGORY).flat();

const ProductsPage = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const query = params.get("q")?.trim() ?? "";
  const [active, setActive] = useState<string>("All");

  const tryOn = (p: CatalogProduct) => {
    navigate("/avatar", { state: { clothing: toClothingVariants(p) } });
  };

  // Optimization: Efficient search with early exit
  const results = useMemo(() => {
    if (!query) return [];
    const q = query.toLowerCase();
    return ALL_PRODUCTS.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.fabric?.toLowerCase().includes(q)
    );
  }, [query]);

  // Optimization: Intersection Observer for scroll-spy (Category Highlighting)
  useEffect(() => {
    if (query) return;

    const sections = CATEGORIES.map((c) => document.getElementById(getSlug(c))).filter(
      Boolean
    ) as HTMLElement[];

    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visible) {
          const cat = CATEGORIES.find((c) => getSlug(c) === visible.target.id);
          if (cat) setActive(cat);
        }
      },
      { 
        rootMargin: "-20% 0px -60% 0px", // Better "hit area" for scroll spy
        threshold: [0, 0.1, 0.5] 
      }
    );

    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, [query]);

  // Clean up WebGL/Three.js contexts on unmount to prevent "Context Lost"
  useEffect(() => {
    return () => {
      // Force cleanup hint for the browser when leaving the page
      window.dispatchEvent(new Event("unload"));
    };
  }, []);

  return (
    <div className="min-h-screen bg-white text-ink antialiased">
      <Navbar />

      <section className="mx-auto max-w-[1400px] px-6 pb-5 pt-[100px] md:px-10">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"
        >
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-plum-600">
              ጥለት3D · The Collection
            </span>
            <h1 className="display mt-2 text-3xl font-semibold leading-tight tracking-tight text-ink md:text-5xl">
              Heritage couture, <br className="hidden md:block" /> woven for now.
            </h1>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-ink/50 font-medium">
            Hand-finished Habesha pieces from Ethiopia's finest ateliers — preview
            any garment live on your 3D avatar.
          </p>
        </motion.div>
      </section>

      {!query && <CategoryNav active={active} onSelect={setActive} />}

      <main className="pt-4">
        <AnimatePresence mode="wait">
          {query ? (
            <motion.section 
              key="search-results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mx-auto max-w-[1400px] px-6 pb-20 md:px-10"
            >
              <div className="flex items-center justify-between border-b border-ink/5 pb-6">
                <h2 className="text-xl font-medium">
                  Found {results.length} results for “{query}”
                </h2>
                <button
                  onClick={() => navigate("/products")}
                  className="text-xs font-bold uppercase tracking-widest text-plum-600 hover:text-plum-700"
                >
                  Close Search
                </button>
              </div>

              {results.length === 0 ? (
                <div className="py-32 text-center">
                  <p className="text-ink/40">No pieces match your search.</p>
                </div>
              ) : (
                <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
                  {results.map((p) => (
                    <ProductCard key={p.id} product={p} width="w-full" onTryOn={tryOn} />
                  ))}
                </div>
              )}
            </motion.section>
          ) : (
            <motion.div key="browse-grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {BLOCKS.map((block, i) => (
                <div key={block.id}>
                  <LazyMount minHeight={1200} eager={i === 0}>
                    <ProductBlock categories={block.categories} onTryOn={tryOn} />
                  </LazyMount>

                  {i < INTERLUDES.length && (
                    <LazyMount minHeight={400}>
                      <CulturalInterlude
                        interlude={INTERLUDES[i]}
                        variant={(i % 2) as 0 | 1}
                      />
                    </LazyMount>
                  )}
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <ProductFooter />
    </div>
  );
};

/** Improved LazyMount: Uses better intersection logic to prevent layout jumps */
const LazyMount: React.FC<{
  minHeight: number;
  eager?: boolean;
  children: React.ReactNode;
}> = ({ minHeight, eager = false, children }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(eager);

  useEffect(() => {
    if (eager || show) return;
    const el = ref.current;
    if (!el) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShow(true);
        }
      },
      { rootMargin: "600px 0px" } // Load early enough that the user doesn't see white space
    );

    io.observe(el);
    return () => io.disconnect();
  }, [eager, show]);

  return (
    <div ref={ref} style={!show ? { minHeight, contentVisibility: 'auto' } : {}}>
      {show ? children : null}
    </div>
  );
};

export default ProductsPage;