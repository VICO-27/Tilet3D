import { useEffect, useRef } from "react";
import { ProductCard } from "./ProductCard";
import type { CatalogProduct } from "../data/catalog";

interface Props {
  products: CatalogProduct[];
  mode: "auto" | "linked";
  /** When true, video cards land on even indices (0,2,4…), else odd. */
  videoFirst: boolean;
  scrollRef?: React.RefObject<HTMLDivElement | null>;
  onScroll?: () => void;
  onTryOn: (p: CatalogProduct) => void;
}

// Intentionally non-uniform widths for an editorial, non-grid rhythm.
const WIDTHS = [
  "w-[300px] md:w-[360px]",
  "w-[220px] md:w-[250px]",
  "w-[330px] md:w-[420px]",
  "w-[250px] md:w-[290px]",
  "w-[280px] md:w-[330px]",
];

export const ProductRow: React.FC<Props> = ({
  products,
  mode,
  videoFirst,
  scrollRef,
  onScroll,
  onTryOn,
}) => {
  const localRef = useRef<HTMLDivElement>(null);
  const ref = scrollRef ?? localRef;
  // Duplicate just enough for scroll width without flooding the DOM.
  const repeated = [...products, ...products];

  // ── Click-drag horizontal scroll (all rows) ──────────────────────────────
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let down = false;
    let startX = 0;
    let startLeft = 0;
    const onDown = (e: PointerEvent) => {
      down = true;
      startX = e.clientX;
      startLeft = el.scrollLeft;
    };
    const onMove = (e: PointerEvent) => {
      if (!down) return;
      el.scrollLeft = startLeft - (e.clientX - startX);
    };
    const onUp = () => {
      down = false;
    };
    el.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      el.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [ref]);

  // ── Auto bounce scroll (row 1 only): L→R then R→L on loop ─────────────────
  useEffect(() => {
    if (mode !== "auto") return;
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    let dir = 1;
    let paused = false;
    const tick = () => {
      if (!paused) {
        const max = el.scrollWidth - el.clientWidth;
        if (max > 0) {
          el.scrollLeft += 0.45 * dir;
          if (el.scrollLeft >= max - 0.5) dir = -1;
          else if (el.scrollLeft <= 0.5) dir = 1;
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const pause = () => (paused = true);
    const resume = () => (paused = false);
    el.addEventListener("pointerenter", pause);
    el.addEventListener("pointerleave", resume);
    el.addEventListener("pointerdown", pause);
    window.addEventListener("pointerup", resume);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("pointerenter", pause);
      el.removeEventListener("pointerleave", resume);
      el.removeEventListener("pointerdown", pause);
      window.removeEventListener("pointerup", resume);
    };
  }, [mode, ref]);

  return (
    <div
      ref={ref}
      onScroll={onScroll}
      className="no-scrollbar flex cursor-grab overflow-x-auto active:cursor-grabbing"
      style={{ touchAction: "pan-y" }}
    >
      {repeated.map((p, i) => (
        <ProductCard
          key={`${p.id}-${i}`}
          product={p}
          width={WIDTHS[i % WIDTHS.length]}
          isVideo={i % 2 === (videoFirst ? 0 : 1) && !!p.video}
          onTryOn={onTryOn}
        />
      ))}
    </div>
  );
};
