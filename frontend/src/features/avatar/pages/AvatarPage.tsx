import React, { useEffect, useState, useRef, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ArrowRight,
  ShoppingBag,
  Sparkles,
  Sliders,
  X,
  ArrowUp,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import Navbar from "../../../shared/components/layout/Navbar";
import { AvatarViewer } from "../components/AvatarViewer";
import { AvatarForm } from "../components/AvatarForm";
import { useAvatarStore } from "../store/useAvatarStore";
import { FashionDiscoveryShowcase } from "../components/FashionDiscoveryShowcase";
import { SelectedGarmentFittingBadge } from "../components/SelectedGarmentFittingBadge";
import { Product } from "../../products/types";
import { productApi } from "../../products/api/productApi";

const AvatarPage = () => {
  const { t } = useTranslation();
  const location = useLocation();

  const fetchAvatar = useAvatarStore((s) => s.fetchAvatar);
  const isEditing = useAvatarStore((s) => s.isEditing);
  const enterEditMode = useAvatarStore((s) => s.enterEditMode);
  const exitEditMode = useAvatarStore((s) => s.exitEditMode);
  const hasAttemptedFetch = useAvatarStore((s) => s.hasAttemptedFetch);
  const isLoading = useAvatarStore((s) => s.isLoading);

  // Selected garment state connecting Experience A to Experience B
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Announcement card dismissal state (dismissed manually or automatically when editing)
  const [isDismissedManually, setIsDismissedManually] = useState(false);
  const isCardDismissed = isDismissedManually || isEditing;

  // Prevent the measurement card from flashing before the initial fetch completes
  const isInitializing = !(hasAttemptedFetch && !isLoading);

  // Section references for seamless vertical scroll transitions
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const discoveryRef = useRef<HTMLElement | null>(null);
  const fittingRoomRef = useRef<HTMLElement | null>(null);

  // Check for incoming selectedProductId from route navigation
  const routeProductId = (
    location.state as { selectedProductId?: string } | null
  )?.selectedProductId;

  useEffect(() => {
    fetchAvatar();
  }, [fetchAvatar]);

  // Fetch product if route passed an initial selectedProductId
  useEffect(() => {
    if (routeProductId) {
      productApi
        .getProductById(routeProductId)
        .then((prod) => {
          if (prod) setSelectedProduct(prod);
        })
        .catch(() => {});
    }
  }, [routeProductId]);

  // Scroll helpers: native smooth scrolling between Discovery and 3D Atelier
  const scrollToFittingRoom = useCallback(() => {
    fittingRoomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const scrollToDiscovery = useCallback(() => {
    discoveryRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const handleSelectProductForFitting = useCallback((product: Product) => {
    setSelectedProduct(product);
  }, []);

  const isHidden = isInitializing || !isEditing;

  return (
    <div className="flex flex-col h-screen w-full bg-white overflow-hidden">
      <Navbar />

      {/* Main scrollable container holding both vertically stacked experiences */}
      <div
        ref={scrollContainerRef}
        className="relative flex-1 mt-[48px] w-full overflow-y-auto overflow-x-hidden scroll-smooth snap-y snap-proximity overscroll-contain"
      >
        {/* ==========================================================
            EXPERIENCE A: Fashion Discovery Showcase (Initial Viewport)
            ========================================================== */}
        <section
          ref={discoveryRef}
          id="discovery-experience"
          className="relative w-full h-[calc(100vh-48px)] min-h-[640px] snap-start shrink-0 overflow-hidden"
        >
          <FashionDiscoveryShowcase
            onSelectForFitting={handleSelectProductForFitting}
            onScrollToFittingRoom={scrollToFittingRoom}
            initialProductId={routeProductId}
          />
        </section>

        {/* ==========================================================
            EXPERIENCE B: Existing Interactive 3D Avatar Fitting Room
            ========================================================== */}
        <section
          ref={fittingRoomRef}
          id="fitting-room-experience"
          className="relative w-full h-[calc(100vh-48px)] min-h-[640px] snap-start shrink-0 overflow-hidden bg-white"
        >
          {/* 3D Studio Canvas — Full scene */}
          <div className="absolute inset-0 z-0">
            <AvatarViewer showControls={isCardDismissed} />
          </div>

          {/* Top Bar: Active Garment Badge (Left) + Showcase Quick Nav (Right) */}
          <div className="absolute top-3 sm:top-4 left-3 sm:left-4 right-3 sm:right-4 z-30 flex items-start justify-between gap-2 pointer-events-none">
            {/* Left: Active Garment Card from Discovery */}
            {selectedProduct ? (
              <div className="pointer-events-auto min-w-0 max-w-[calc(100%-105px)] sm:max-w-sm">
                <SelectedGarmentFittingBadge
                  product={selectedProduct}
                  onChangeLook={scrollToDiscovery}
                  onClear={() => setSelectedProduct(null)}
                />
              </div>
            ) : (
              <div />
            )}

            {/* Right: Quick Nav Back to Discovery Showcase */}
            <div className="pointer-events-auto shrink-0">
              <button
                type="button"
                onClick={scrollToDiscovery}
                className="group inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-full text-xs font-medium tracking-wider uppercase backdrop-blur-xl bg-white/90 dark:bg-stone-900/90 border border-stone-200/80 dark:border-stone-700/80 hover:border-plum-300 shadow-sm hover:shadow-md transition-all active:scale-95 shrink-0"
              >
                <ArrowUp className="w-3.5 h-3.5 text-plum-600 dark:text-plum-400 group-hover:-translate-y-0.5 transition-transform shrink-0" />
                <span className="hidden sm:inline">
                  {t("avatar.backToShowcase", "Discovery Showcase")}
                </span>
                <span className="sm:hidden">
                  {t("avatar.backShort", "Showcase")}
                </span>
              </button>
            </div>
          </div>

          {/* Center "Coming Soon!" Announcement Card (Preserved Exactly) */}
          {!isCardDismissed ? (
            <div className="absolute inset-0 z-30 pointer-events-none flex items-center justify-center p-4 sm:p-6 select-none">
              <div className="pointer-events-auto relative backdrop-blur-2xl bg-white/90 dark:bg-stone-900/90 border border-white/80 dark:border-stone-700/70 shadow-[0_24px_64px_-12px_rgba(0,0,0,0.18)] rounded-3xl p-6 sm:p-9 max-w-sm sm:max-w-md w-full text-center flex flex-col items-center animate-in fade-in zoom-in-95 duration-500">
                {/* Dismiss button to view 3D avatar freely */}
                <button
                  type="button"
                  onClick={() => setIsDismissedManually(true)}
                  className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                  title={t("common.close", "Dismiss")}
                  aria-label="Dismiss announcement"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[10px] font-mono font-medium tracking-[0.25em] uppercase bg-plum-500/10 text-plum-700 dark:text-plum-300 border border-plum-500/20 mb-3.5 shadow-xs">
                  <Sparkles
                    className="w-3 h-3 text-plum-600 animate-spin"
                    style={{ animationDuration: "6s" }}
                  />
                  <span>{t("avatar.title", "Virtual 3D Avatar")}</span>
                </div>

                <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-light tracking-tight text-purple-700 dark:text-purple-400 mb-2.5">
                  {t("avatar.comingSoon", "Coming Soon")}
                </h2>

                <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 font-light leading-relaxed max-w-xs sm:max-w-sm mb-6">
                  {t(
                    "avatar.subtitle",
                    "Our personalized 3D avatar calibration and virtual fitting room experience is currently being crafted."
                  )}
                </p>

                {/* Action buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-3 w-full">
                  <Link
                    to="/products"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold tracking-wider uppercase bg-purple-600 hover:bg-purple-700 text-white shadow-md hover:shadow-lg hover:brightness-105 active:scale-95 transition-all duration-200 shrink-0"
                  >
                    <ShoppingBag className="w-3.5 h-3.5 text-white" />
                    <span>{t("nav.collection", "Shop Collection")}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-white" />
                  </Link>

                  <button
                    type="button"
                    onClick={enterEditMode}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full text-xs font-medium tracking-wider uppercase border border-purple-200 hover:border-purple-400 bg-purple-50/50 hover:bg-purple-50 text-purple-900 transition-all duration-200 shrink-0"
                  >
                    <Sliders className="w-3.5 h-3.5 text-purple-600" />
                    <span>
                      {isEditing
                        ? t("avatar.controlsActive", "Controls Active")
                        : t("avatar.controls", "Studio Controls")}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Minimized top single-line pill when user dismisses the card */
            <div
              className={`absolute ${
                selectedProduct ? "top-20 sm:top-5" : "top-3 sm:top-5"
              } left-1/2 -translate-x-1/2 z-20 pointer-events-auto max-w-[calc(100vw-1.5rem)]`}
            >
              <div className="flex items-center gap-1.5 sm:gap-3 px-2.5 sm:px-3.5 py-1 sm:py-2 rounded-full backdrop-blur-xl bg-white/95 dark:bg-stone-900/95 border border-purple-200/90 dark:border-purple-800/80 shadow-[0_6px_24px_rgba(147,51,234,0.12)] whitespace-nowrap text-xs">
                <button
                  type="button"
                  onClick={() => setIsDismissedManually(false)}
                  className="flex items-center gap-1.5 shrink-0 group hover:opacity-85 transition-opacity"
                  title="Expand announcement"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-600" />
                  </span>
                  <span className="font-serif text-xs sm:text-sm font-semibold text-purple-700 dark:text-purple-300 tracking-wide">
                    {t("avatar.comingSoon", "Coming Soon")}
                  </span>
                </button>

                <div className="w-px h-3.5 sm:h-4 bg-purple-200 dark:bg-purple-800 shrink-0" />

                <Link
                  to="/products"
                  className="group inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full bg-purple-600 hover:bg-purple-700 text-white text-[10.5px] sm:text-xs font-semibold uppercase tracking-wider shadow-sm transition-all shrink-0"
                >
                  <ShoppingBag className="w-3.5 h-3.5 text-white" />
                  <span>{t("nav.collection", "Shop Now")}</span>
                  <ArrowRight className="w-3 h-3 text-white group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>
          )}

          {/* Calibration Panel — Slides right on desktop, slides down on mobile on confirm */}
          <div
            className={`
              absolute bottom-0 md:top-0 right-0
              h-[65%] sm:h-[68%] md:h-full
              w-full md:w-[35%] md:min-w-[420px]
              bg-white/95 md:bg-white/90
              backdrop-blur-3xl
              rounded-t-[2rem] md:rounded-none
              border-t md:border-t-0 md:border-l border-stone-200/80
              shadow-[0_-16px_48px_rgba(0,0,0,0.12)] md:shadow-[-20px_0_60px_rgba(0,0,0,0.04)]
              transition-transform duration-[800ms] ease-[cubic-bezier(0.16,1,0.3,1)]
              z-30 overflow-y-auto overscroll-contain
              ${
                isHidden
                  ? "translate-y-full md:translate-y-0 md:translate-x-full pointer-events-none"
                  : "translate-y-0 md:translate-x-0 pointer-events-auto"
              }
            `}
          >
            {/* Close button for calibration panel */}
            <button
              type="button"
              onClick={exitEditMode}
              className="absolute top-3.5 right-4 p-2 text-stone-400 hover:text-stone-800 rounded-full hover:bg-stone-100 transition-colors z-10"
              title="Close editor"
              aria-label="Close editor"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-3.5 sm:p-5 md:p-8 pb-32 max-w-lg mx-auto">
              {/* Mobile drag handle indicator */}
              <div className="w-10 h-1.5 bg-stone-300 rounded-full mx-auto mb-3 md:hidden" />
              <AvatarForm />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AvatarPage;
