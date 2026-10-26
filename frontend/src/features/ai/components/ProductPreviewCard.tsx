import React from "react";
import { useNavigate } from "react-router-dom";
import { Play, ArrowRight, Sparkles } from "lucide-react";
import { Product } from "../../products/types";
import { optimizeCloudinaryUrl, optimizeCloudinaryVideoUrl } from "../../../shared/utils/cloudinary";

interface ProductPreviewCardProps {
  product: Product;
  compact?: boolean;
}

export const ProductPreviewCard: React.FC<ProductPreviewCardProps> = ({ product, compact }) => {
  const navigate = useNavigate();
  const primaryMedia = product.media?.find((m) => m.is_primary) || product.media?.[0];
  const isVideo = primaryMedia?.media_type === "video";
  const primaryVariant = product.variants?.[0];
  const price = primaryVariant?.price;

  // Determine stock availability across variants
  const isAvailable = product.variants && product.variants.length > 0
    ? product.variants.some((v) => (v.available_stock ?? 1) > 0)
    : true;

  const handleTryOn = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate("/avatar", { state: { selectedProductId: product.id } });
  };

  const formattedPrice = price
    ? `${Number(price).toLocaleString()} ETB`
    : "Bespoke";

  return (
    <div
      onClick={() => navigate(`/products/${product.id}`)}
      className={`group cursor-pointer bg-neutral-900/90 hover:bg-neutral-800/95 border border-white/[0.08] hover:border-amber-500/60 rounded-xl overflow-hidden transition-all duration-200 shadow-sm hover:shadow-md ${
        compact ? "flex flex-col p-2 gap-2" : "flex flex-col"
      }`}
    >
      <div
        className={`relative bg-neutral-950 overflow-hidden rounded-lg ${
          compact ? "w-full aspect-[4/3]" : "w-full aspect-square"
        }`}
      >
        {primaryMedia ? (
          isVideo ? (
            <>
              <video
                src={optimizeCloudinaryVideoUrl(primaryMedia.file)}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                muted
                playsInline
                onMouseEnter={(e) => e.currentTarget.play()}
                onMouseLeave={(e) => e.currentTarget.pause()}
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <Play size={compact ? 16 : 22} className="text-white drop-shadow" fill="white" />
              </div>
            </>
          ) : (
            <img
              src={optimizeCloudinaryUrl(primaryMedia.file, "c_fill,w_360,q_auto,f_auto")}
              alt={product.name}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          )
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/30 text-xs">
            No image
          </div>
        )}

        {/* Availability Badge */}
        {!isAvailable && (
          <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-950/80 text-red-300 border border-red-500/30 backdrop-blur-sm">
            Sold out
          </div>
        )}

        {/* Color tag if present */}
        {primaryVariant?.color && (
          <div className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-black/60 text-white/80 backdrop-blur-sm">
            {primaryVariant.color}
          </div>
        )}
      </div>

      <div className={compact ? "flex flex-col gap-1 min-w-0" : "p-3 flex flex-col gap-1"}>
        <h4 className="font-medium text-white/95 text-xs truncate group-hover:text-amber-400 transition-colors">
          {product.name}
        </h4>
        <div className="flex items-center justify-between gap-1 text-[11px]">
          <span className="font-semibold text-amber-300 tracking-tight">
            {formattedPrice}
          </span>
          {primaryVariant?.size && (
            <span className="text-white/40 text-[10px] uppercase">
              {primaryVariant.size}
            </span>
          )}
        </div>

        {/* Interactive Try On / View Action */}
        <div className="pt-1.5 mt-1 border-t border-white/[0.06] flex items-center justify-between gap-1 text-[11px]">
          <button
            type="button"
            onClick={handleTryOn}
            className="inline-flex items-center gap-1 text-amber-400/90 hover:text-amber-300 transition-colors text-[10px] font-medium py-0.5"
            aria-label={`Try on ${product.name} in 3D`}
          >
            <Sparkles size={11} />
            <span>Try On 3D</span>
          </button>
          <span className="inline-flex items-center text-white/40 group-hover:text-white/80 transition-colors text-[10px]">
            View <ArrowRight size={10} className="ml-0.5 group-hover:translate-x-0.5 transition-transform" />
          </span>
        </div>
      </div>
    </div>
  );
};