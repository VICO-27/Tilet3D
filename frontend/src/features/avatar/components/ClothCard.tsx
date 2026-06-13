import React from "react";
import { motion } from "framer-motion";
import { Check, ArrowUpRight } from "lucide-react";
import type { ClothingItem } from "../types/avatar.types";

interface Props {
  item: ClothingItem;
  variant?: "vertical" | "compact";
  selected?: boolean;
  onTry: (item: ClothingItem) => void;
}

const FALLBACK_IMG =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='500'><rect width='100%' height='100%' fill='#ede9fe'/><text x='50%' y='50%' font-family='sans-serif' font-size='20' fill='#a78bfa' text-anchor='middle'>Tilet3D</text></svg>`,
  );

const formatPrice = (item: ClothingItem) =>
  `${item.currency ?? "ETB"} ${item.price.toLocaleString()}`;

const handleImgError = (e: React.SyntheticEvent<HTMLImageElement>) => {
  const img = e.currentTarget;
  if (img.src !== FALLBACK_IMG) img.src = FALLBACK_IMG;
};

export const ClothCard: React.FC<Props> = ({
  item,
  variant = "vertical",
  selected = false,
  onTry,
}) => {
  if (variant === "compact") {
    return (
      <motion.button
        type="button"
        onClick={() => onTry(item)}
        whileHover={{ y: -4 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 320, damping: 24 }}
        className={`group relative flex w-44 shrink-0 flex-col overflow-hidden rounded-2xl border bg-white text-left transition-shadow ${
          selected
            ? "border-violet-400 shadow-lg shadow-violet-200/50"
            : "border-slate-200/80 hover:shadow-lg hover:shadow-slate-200/60"
        }`}
      >
        <div className="relative aspect-[3/4] w-full overflow-hidden bg-slate-100">
          <img
            src={item.image}
            onError={handleImgError}
            alt={item.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
          {item.badge && (
            <span className="absolute left-2.5 top-2.5 rounded-full bg-white/90 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-violet-700 backdrop-blur-sm">
              {item.badge}
            </span>
          )}
        </div>
        <div className="flex flex-col gap-0.5 p-3">
          <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-violet-500">
            {item.brand}
          </p>
          <h4 className="truncate font-serif text-sm font-semibold text-slate-900">
            {item.name}
          </h4>
          <p className="mt-1 text-xs font-bold text-slate-700">
            {formatPrice(item)}
          </p>
        </div>
      </motion.button>
    );
  }

  // Vertical (primary) editorial card
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 26 }}
      className={`group relative overflow-hidden rounded-3xl border bg-white transition-all ${
        selected
          ? "border-violet-400 shadow-xl shadow-violet-200/50"
          : "border-slate-200/80 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-200/50"
      }`}
    >
      <div className="flex gap-4 p-4">
        <div className="relative h-32 w-24 shrink-0 overflow-hidden rounded-2xl bg-slate-100">
          <img
            src={item.image}
            onError={handleImgError}
            alt={item.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
          {selected && (
            <div className="absolute inset-0 flex items-center justify-center bg-violet-600/30 backdrop-blur-[1px]">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-violet-600 shadow">
                <Check className="h-4 w-4 stroke-[3]" />
              </span>
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-start justify-between gap-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-500">
              {item.brand}
            </p>
            {item.badge && (
              <span className="shrink-0 rounded-full bg-violet-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-violet-700">
                {item.badge}
              </span>
            )}
          </div>

          <h3 className="mt-1 font-serif text-lg font-semibold leading-tight text-slate-900">
            {item.name}
          </h3>

          {item.fabric && (
            <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-slate-400">
              {item.fabric}
            </p>
          )}

          <div className="mt-auto flex items-center justify-between pt-3">
            <span className="text-sm font-bold text-slate-900">
              {formatPrice(item)}
            </span>
            <motion.button
              type="button"
              onClick={() => onTry(item)}
              whileTap={{ scale: 0.95 }}
              className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-[11px] font-bold uppercase tracking-wider transition-colors ${
                selected
                  ? "bg-slate-900 text-white"
                  : "bg-violet-600 text-white hover:bg-violet-500"
              }`}
            >
              {selected ? "Selected" : "Try This"}
              {!selected && <ArrowUpRight className="h-3.5 w-3.5" />}
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
