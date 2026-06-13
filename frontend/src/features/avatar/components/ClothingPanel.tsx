import React, { useRef } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Sparkles, ShoppingBag, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { ClothingItem } from "../types/avatar.types";
import { ClothCard } from "./ClothCard";
import { MOST_PURCHASED } from "../data/clothing";
import { GARMENT_COLORS } from "../utils/garment";

interface Props {
  primaryItems: ClothingItem[];
  selectedItem: ClothingItem | null;
  garmentColor: string;
  onGarmentColorChange: (hex: string) => void;
  onSelect: (item: ClothingItem) => void;
  onConfirm: () => void;
}

export const ClothingPanel: React.FC<Props> = ({
  primaryItems,
  selectedItem,
  garmentColor,
  onGarmentColorChange,
  onSelect,
  onConfirm,
}) => {
  const navigate = useNavigate();
  const railRef = useRef<HTMLDivElement>(null);

  const scrollRail = (dir: "left" | "right") => {
    const el = railRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === "left" ? -260 : 260, behavior: "smooth" });
  };

  const hasPrimary = primaryItems.length > 0;

  return (
    <div className="flex h-full flex-col bg-white">
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="border-b border-slate-100 px-7 pb-5 pt-7">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-violet-500">
          The Fitting Room
        </p>
        <h2 className="mt-1.5 font-serif text-2xl font-semibold tracking-tight text-slate-900">
          {hasPrimary ? "Your Selection" : "Curated For You"}
        </h2>
      </div>

      {/* ── Scrollable body ──────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        {/* PRIMARY — vertical */}
        <section className="px-7 pt-6">
          {hasPrimary ? (
            <div className="space-y-3.5">
              {primaryItems.map((item) => (
                <ClothCard
                  key={item.id}
                  item={item}
                  variant="vertical"
                  selected={selectedItem?.id === item.id}
                  onTry={onSelect}
                />
              ))}
            </div>
          ) : (
            <EmptyPrimary onBrowse={() => navigate("/products")} />
          )}
        </section>

        {/* SECONDARY — horizontal "Most Purchased This Week" */}
        <section className="mt-9 pb-8">
          <div className="flex items-end justify-between px-7">
            <div>
              <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.25em] text-violet-500">
                <Sparkles className="h-3.5 w-3.5" />
                This Week
              </p>
              <h3 className="mt-1 font-serif text-lg font-semibold text-slate-900">
                Most Purchased
              </h3>
            </div>
            <div className="flex gap-1.5">
              <RailArrow dir="left" onClick={() => scrollRail("left")} />
              <RailArrow dir="right" onClick={() => scrollRail("right")} />
            </div>
          </div>

          <div
            ref={railRef}
            className="no-scrollbar mt-4 flex gap-3.5 overflow-x-auto px-7 pb-2"
          >
            {MOST_PURCHASED.map((item) => (
              <ClothCard
                key={item.id}
                item={item}
                variant="compact"
                selected={selectedItem?.id === item.id}
                onTry={onSelect}
              />
            ))}
          </div>
        </section>
      </div>

      {/* ── Sticky checkout bar ──────────────────────────────────────────── */}
      {selectedItem && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 30 }}
          className="border-t border-slate-100 bg-white/95 p-5 backdrop-blur-md"
        >
          <div className="mb-3 flex items-center justify-between">
            <div className="min-w-0">
              <p className="truncate font-serif text-sm font-semibold text-slate-900">
                {selectedItem.name}
              </p>
              <p className="text-[11px] text-slate-400">{selectedItem.brand}</p>
            </div>
            <span className="shrink-0 text-base font-bold text-slate-900">
              {selectedItem.currency ?? "ETB"}{" "}
              {selectedItem.price.toLocaleString()}
            </span>
          </div>
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={onConfirm}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-slate-900 py-3.5 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-violet-600"
          >
            <ShoppingBag className="h-4 w-4" />
            Order Custom Fit
          </motion.button>
        </motion.div>
      )}
    </div>
  );
};

const RailArrow: React.FC<{ dir: "left" | "right"; onClick: () => void }> = ({
  dir,
  onClick,
}) => (
  <motion.button
    whileTap={{ scale: 0.9 }}
    onClick={onClick}
    aria-label={`Scroll ${dir}`}
    className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition-colors hover:border-violet-300 hover:text-violet-600"
  >
    {dir === "left" ? (
      <ChevronLeft className="h-4 w-4" />
    ) : (
      <ChevronRight className="h-4 w-4" />
    )}
  </motion.button>
);

const EmptyPrimary: React.FC<{ onBrowse: () => void }> = ({ onBrowse }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/60 px-6 py-10 text-center"
  >
    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-violet-100 text-violet-600">
      <Sparkles className="h-5 w-5" />
    </div>
    <h3 className="mt-4 font-serif text-lg font-semibold text-slate-900">
      Your avatar is ready
    </h3>
    <p className="mx-auto mt-1.5 max-w-[240px] text-[13px] leading-relaxed text-slate-500">
      Explore the collection and tap{" "}
      <span className="font-semibold text-violet-600">Try On Avatar</span> on any
      piece to preview it here.
    </p>
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={onBrowse}
      className="mt-5 rounded-full bg-violet-600 px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-violet-500"
    >
      Browse Collection
    </motion.button>
  </motion.div>
);
