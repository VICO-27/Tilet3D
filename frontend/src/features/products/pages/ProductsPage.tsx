import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";

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

const slug = (s: string) => s.toLowerCase().replace(/\s+/g, "-");
const ALL_PRODUCTS = Object.values(PRODUCTS_BY_CATEGORY).flat();

const ProductsPage = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const query = params.get("q")?.trim() ?? "";
  const [active, setActive] = useState<string>("All");

  const tryOn = (p: CatalogProduct) => {
    navigate("/avatar", { state: { clothing: toClothingVariants(p) } });
  };

  const results = useMemo(() => {
    if (!query) return [];
    const q = query.toLowerCase();
    return ALL_PRODUCTS.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.fabric.toLowerCase().includes(q),
    );
  }, [query]);

  // Scroll-spy: highlight the category currently in view (browse mode only).
  useEffect(() => {
    if (query) return;
    const sections = CATEGORIES.map((c) => document.getElementById(slug(c))).filter(
      Boolean,
    ) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) {
          const cat = CATEGORIES.find((c) => slug(c) === visible.target.id);
          if (cat) setActive(cat);
        }
      },
      { rootMargin: "-130px 0px -55% 0px", threshold: [0.1, 0.5] },
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, [query]);

  // ── Search results mode ───────────────────────────────────────────────────
  if (query) {
    return (
      <div className="min-h-screen bg-white text-ink">
        <Navbar />
        <section className="mx-auto max-w-[1400px] px-6 pb-16 pt-[100px] md:px-10">
          <div className="flex items-end justify-between border-b border-ink/[0.06] pb-6">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-[0.35em] text-plum-600">
                Search
              </span>
              <h1 className="display mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
                “{query}”
              </h1>
              <p className="mt-1 text-sm text-ink/50">
                {results.length} {results.length === 1 ? "result" : "results"}
              </p>
            </div>
            <button
              onClick={() => navigate("/products")}
              className="rounded-full border border-ink/15 px-4 py-2 text-xs font-semibold text-ink/70 transition-colors hover:bg-ink/[0.03]"
            >
              Clear
            </button>
          </div>

          {results.length === 0 ? (
            <p className="py-24 text-center text-sm text-ink/45">
              No pieces match “{query}”. Try a category like Kemis, Suri or Netela.
            </p>
          ) : (
            <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
              {results.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  width="w-full"
                  isVideo={false}
                  onTryOn={tryOn}
                />
              ))}
            </div>
          )}
        </section>
        <ProductFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-ink">
      <Navbar />

      {/* Compact intro — present but secondary; products visible almost immediately */}
      <section className="mx-auto max-w-[1400px] px-6 pb-5 pt-[100px] md:px-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-[0.35em] text-plum-600">
              ጥለት3D · The Collection
            </span>
            <h1 className="display mt-2 text-3xl font-semibold leading-tight tracking-tight text-ink md:text-4xl">
              Heritage couture, woven for now.
            </h1>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-ink/50">
            Hand-finished Habesha pieces from Ethiopia's finest ateliers — preview
            any garment live on your 3D avatar.
          </p>
        </div>
      </section>

      <CategoryNav active={active} onSelect={setActive} />

      {/* Blocks + cultural interludes — lazily mounted so the page paints fast */}
      <div className="pt-4">
        {BLOCKS.map((block, i) => (
          <div key={block.id}>
            <LazyMount minHeight={1500} eager={i === 0}>
              <ProductBlock categories={block.categories} onTryOn={tryOn} />
            </LazyMount>

            {i < INTERLUDES.length && (
              <LazyMount minHeight={420}>
                <CulturalInterlude
                  interlude={INTERLUDES[i]}
                  variant={(i % 2) as 0 | 1}
                />
              </LazyMount>
            )}
          </div>
        ))}
      </div>

      <ProductFooter />
    </div>
  );
};

/** Renders children only once they near the viewport (keeps a placeholder height). */
const LazyMount: React.FC<{
  minHeight: number;
  eager?: boolean;
  children: React.ReactNode;
}> = ({ minHeight, eager = false, children }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(eager);

  useEffect(() => {
    if (eager) return;
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setShow(true);
          io.disconnect();
        }
      },
      { rootMargin: "700px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [eager]);

  return (
    <div ref={ref} style={show ? undefined : { minHeight }}>
      {show ? children : null}
    </div>
  );
};

export default ProductsPage;
