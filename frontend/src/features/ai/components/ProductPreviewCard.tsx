import React from "react";
import { useNavigate } from "react-router-dom";
import { Play, ArrowRight } from "lucide-react";
import { Product } from "../../products/types";

interface ProductPreviewCardProps {
  product: Product;
  compact?: boolean;
}

export const ProductPreviewCard: React.FC<ProductPreviewCardProps> = ({ product, compact }) => {
  const navigate = useNavigate();
  const primaryMedia = product.media?.find((m) => m.is_primary) || product.media?.[0];
  const isVideo = primaryMedia?.media_type === "video";
  const price = product.variants?.[0]?.price;

  return (
    <div
      onClick={() => navigate(`/products/${product.id}`)}
      className={`group cursor-pointer bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl overflow-hidden hover:border-amber-500 transition-all shadow-sm ${
        compact ? "flex flex-row items-center gap-3 p-2" : "flex flex-col"
      }`}
    >
      <div
        className={`relative bg-neutral-100 dark:bg-neutral-800 overflow-hidden ${
          compact ? "w-14 h-14 rounded-lg flex-shrink-0" : "w-full aspect-square"
        }`}
      >
        {primaryMedia ? (
          isVideo ? (
            <>
              <video
                src={primaryMedia.file}
                className="w-full h-full object-cover"
                muted
                playsInline
                onMouseEnter={(e) => e.currentTarget.play()}
                onMouseLeave={(e) => e.currentTarget.pause()}
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <Play size={compact ? 14 : 22} className="text-white drop-shadow" fill="white" />
              </div>
            </>
          ) : (
            <img src={primaryMedia.file} alt={product.name} className="w-full h-full object-cover" />
          )
        ) : (
          <div className="w-full h-full flex items-center justify-center text-neutral-400 text-xs">
            No image
          </div>
        )}
      </div>

      <div className={compact ? "flex-1 min-w-0" : "p-3"}>
        <h4
          className={`font-semibold text-neutral-900 dark:text-white truncate group-hover:text-amber-600 ${
            compact ? "text-xs" : "text-sm"
          }`}
        >
          {product.name}
        </h4>
        <p className={`text-neutral-500 mt-0.5 ${compact ? "text-[11px]" : "text-xs"}`}>
          {price ? `${price} ETB` : "Bespoke"}
        </p>
      </div>

      {!compact && (
        <div className="px-3 pb-3 flex items-center gap-1 text-xs text-amber-600 font-medium">
          View <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
        </div>
      )}
    </div>
  );
};