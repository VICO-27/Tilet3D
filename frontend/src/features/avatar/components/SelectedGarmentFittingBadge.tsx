import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Sparkles, ArrowUp, ChevronDown, ChevronUp, Shirt, X } from "lucide-react";
import { Product } from "../../products/types";
import { getCategoryName } from "../utils/showcaseHelpers";
import { optimizeCloudinaryUrl } from "../../../shared/utils/cloudinary";

interface SelectedGarmentFittingBadgeProps {
  product: Product | null;
  onChangeLook: () => void;
  onClear?: () => void;
  className?: string;
}

export const SelectedGarmentFittingBadge: React.FC<SelectedGarmentFittingBadgeProps> = ({
  product,
  onChangeLook,
  onClear,
  className,
}) => {
  const { t } = useTranslation();
  const [isCollapsed, setIsCollapsed] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 640 : false
  );

  if (!product) return null;

  const categoryName = getCategoryName(product);
  const primaryMedia =
    product.media?.find((m) => m.is_primary) || product.media?.[0];
  const price = product.variants?.[0]?.price
    ? `${Number(product.variants[0].price).toLocaleString()} ETB`
    : t("products.bespokeCouture", "Bespoke");

  return (
    <div
      className={
        className ||
        "pointer-events-auto w-full max-w-[calc(100vw-2rem)] sm:max-w-sm select-none transition-all duration-300"
      }
    >
      <div className="backdrop-blur-2xl bg-white/90 dark:bg-stone-900/90 border border-white/80 dark:border-stone-700/80 shadow-[0_16px_40px_-10px_rgba(0,0,0,0.14)] rounded-2xl p-3 sm:p-3.5 transition-all">
        {/* Header bar */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="flex h-2 w-2 relative shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-plum-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-plum-600" />
            </span>
            <span className="text-[9px] font-mono uppercase tracking-widest text-plum-700 dark:text-plum-300 font-semibold truncate">
              {t("avatar.activeGarment", "Active Look")}
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setIsCollapsed((c) => !c)}
              className="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              title={isCollapsed ? "Expand" : "Collapse"}
            >
              {isCollapsed ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronUp className="w-3.5 h-3.5" />
              )}
            </button>
            {onClear && (
              <button
                type="button"
                onClick={onClear}
                className="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                title={t("common.close", "Dismiss")}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Content body */}
        {!isCollapsed && (
          <div className="mt-2.5 pt-2.5 border-t border-stone-200/60 dark:border-stone-800 animate-in fade-in duration-200">
            <div className="flex items-center gap-3">
              {/* Garment Image */}
              <div className="relative w-12 h-14 rounded-xl overflow-hidden bg-stone-100 shrink-0 border border-stone-200/60">
                {primaryMedia ? (
                  <img
                    src={optimizeCloudinaryUrl(
                      primaryMedia.file,
                      "c_fill,w_100,h_120,q_auto,f_auto"
                    )}
                    alt={product.name}
                    className="w-full h-full object-cover object-top"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-stone-300">
                    <Shirt className="w-4 h-4" />
                  </div>
                )}
              </div>

              {/* Garment Meta */}
              <div className="min-w-0 flex-1">
                <span className="text-[8px] font-mono tracking-widest uppercase text-plum-600 dark:text-plum-400 block font-semibold truncate">
                  {categoryName}
                </span>
                <p className="font-serif text-xs sm:text-sm font-medium text-stone-900 dark:text-stone-100 truncate mt-0.5">
                  {product.name}
                </p>
                <p className="font-mono text-[11px] font-semibold text-stone-600 dark:text-stone-300 mt-0.5">
                  {price}
                </p>
              </div>
            </div>

            {/* Calibration Notice: Accurate communication without falsely claiming real-time drape */}
            <p className="text-[10px] text-stone-500 font-light mt-2.5 leading-snug">
              {t(
                "avatar.calibrationNotice",
                "Avatar measurements are calibrated to custom-tailor this silhouette. 3D cloth simulation in development."
              )}
            </p>

            {/* Actions */}
            <div className="mt-2.5 pt-2 border-t border-stone-200/50 dark:border-stone-800 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={onChangeLook}
                className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold text-plum-700 dark:text-plum-400 hover:text-plum-800 transition-colors py-0.5"
              >
                <ArrowUp className="w-3 h-3" />
                <span>{t("avatar.changeLook", "Change Look")}</span>
              </button>

              <span className="inline-flex items-center gap-1 text-[9.5px] font-mono text-emerald-600 dark:text-emerald-400">
                <Sparkles className="w-2.5 h-2.5" />
                <span>{t("avatar.calibrated", "Calibrated")}</span>
              </span>
            </div>
          </div>
        )}

        {/* Collapsed single-line view */}
        {isCollapsed && (
          <div className="flex items-center justify-between gap-2 mt-1">
            <span className="text-xs font-serif font-medium text-stone-800 dark:text-stone-200 truncate">
              {product.name}
            </span>
            <button
              type="button"
              onClick={onChangeLook}
              className="text-[10px] text-plum-600 font-semibold hover:underline shrink-0"
            >
              ↑ Change
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
