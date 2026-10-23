import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sliders, Sparkles, X } from 'lucide-react';
import Navbar from '../../../shared/components/layout/Navbar';
import { AvatarViewer } from '../components/AvatarViewer';
import { AvatarForm } from '../components/AvatarForm';
import { useAvatarStore } from '../store/useAvatarStore';

const AvatarPage = () => {
  const fetchAvatar = useAvatarStore((s) => s.fetchAvatar);
  const isConfirmed = useAvatarStore((s) => s.isConfirmed);
  const hasAttemptedFetch = useAvatarStore((s) => s.hasAttemptedFetch);
  const isLoading = useAvatarStore((s) => s.isLoading);

  // Prevent the measurement card from flashing before the initial fetch completes
  const [isInitializing, setIsInitializing] = useState(true);
  const [showPanel, setShowPanel] = useState(false);
  const [isCardDismissed, setIsCardDismissed] = useState(false);

  useEffect(() => {
    fetchAvatar();
  }, [fetchAvatar]);

  useEffect(() => {
    if (hasAttemptedFetch && !isLoading) {
      setIsInitializing(false);
    }
  }, [hasAttemptedFetch, isLoading]);

  const isHidden = isInitializing || isConfirmed || !showPanel;

  return (
    <div className="flex flex-col h-screen w-full bg-[#f8f8f9] overflow-hidden">
      <Navbar />

      <main className="relative flex-1 mt-[48px] w-full overflow-hidden">

        {/* 3D Studio — always full background */}
        <div className="absolute inset-0 z-0">
          <AvatarViewer />
        </div>

        {/* Center "Coming Soon!" Announcement */}
        {!isCardDismissed ? (
          <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center p-4 select-none">
            <div className="pointer-events-auto relative backdrop-blur-2xl bg-white/85 dark:bg-stone-900/85 border border-white/60 dark:border-stone-700/50 shadow-[0_24px_64px_-12px_rgba(0,0,0,0.18)] rounded-3xl p-6 sm:p-9 max-w-sm sm:max-w-md w-full text-center flex flex-col items-center animate-in fade-in zoom-in-95 duration-500">
              
              {/* Optional dismiss button to view 3D avatar unobstructed */}
              <button
                type="button"
                onClick={() => setIsCardDismissed(true)}
                className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                title="Dismiss to view 3D model"
                aria-label="Dismiss announcement"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[10px] font-mono font-medium tracking-[0.25em] uppercase bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20 mb-3 shadow-xs">
                <Sparkles className="w-3 h-3 text-purple-600 animate-spin" style={{ animationDuration: '6s' }} />
                <span>Virtual Fitting Atelier</span>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-light tracking-tight text-stone-900 dark:text-white mb-2">
                Coming Soon!
              </h1>

              <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 font-light leading-relaxed max-w-xs sm:max-w-sm mb-6">
                Our personalized 3D avatar calibration and virtual fitting room experience is currently being crafted.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3 w-full">
                <Link
                  to="/products"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-medium tracking-wider uppercase bg-[#111111] hover:bg-black text-white shadow-md hover:shadow-lg transition-all duration-200"
                >
                  <span>Explore Collection</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>

                <button
                  type="button"
                  onClick={() => setShowPanel(!showPanel)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-medium tracking-wider uppercase border border-stone-300/80 hover:border-stone-400 bg-white/70 hover:bg-white text-stone-800 transition-all duration-200"
                >
                  <Sliders className="w-3.5 h-3.5 text-purple-600" />
                  <span>{showPanel ? "Hide Studio Controls" : "Preview Studio"}</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Minimized pill if the user dismissed the card */
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
            <button
              type="button"
              onClick={() => setIsCardDismissed(false)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-xl bg-white/90 border border-stone-200/80 shadow-md text-xs font-medium text-stone-800 hover:bg-white transition-all hover:scale-105"
            >
              <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse" />
              <span className="font-serif">Coming Soon!</span>
              <span className="text-[10px] text-stone-400 font-mono">(Tap to expand)</span>
            </button>
          </div>
        )}

        {/* Calibration panel — slides right on desktop, slides down on mobile on confirm */}
        <div
          className={`
            absolute bottom-0 md:top-0 right-0
            h-[62%] sm:h-[65%] md:h-full
            w-full md:w-[35%] md:min-w-[420px]
            bg-white/95 md:bg-white/90
            backdrop-blur-3xl
            rounded-t-[2rem] md:rounded-none
            border-t md:border-t-0 md:border-l border-stone-200/80
            shadow-[0_-16px_48px_rgba(0,0,0,0.12)] md:shadow-[-20px_0_60px_rgba(0,0,0,0.04)]
            transition-transform duration-[1000ms] ease-[cubic-bezier(0.16,1,0.3,1)]
            z-30 overflow-y-auto overscroll-contain
            ${isHidden ? 'translate-y-full md:translate-y-0 md:translate-x-full' : 'translate-y-0 md:translate-x-0'}
          `}
        >
          <div className="p-3.5 sm:p-5 md:p-8 pb-32 max-w-lg mx-auto">
            {/* Mobile drag handle indicator */}
            <div className="w-10 h-1.5 bg-stone-300 rounded-full mx-auto mb-3 md:hidden" />
            <AvatarForm />
          </div>
        </div>

      </main>
    </div>
  );
};

export default AvatarPage;
