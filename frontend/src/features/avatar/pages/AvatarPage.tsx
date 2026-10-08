import React, { useEffect, useState } from 'react';
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

  useEffect(() => {
    fetchAvatar();
  }, [fetchAvatar]);

  useEffect(() => {
    if (hasAttemptedFetch && !isLoading) {
      setIsInitializing(false);
    }
  }, [hasAttemptedFetch, isLoading]);

  const isHidden = isInitializing || isConfirmed;

  return (
    <div className="flex flex-col h-screen w-full bg-[#f8f8f9] overflow-hidden">
      <Navbar />

      <main className="relative flex-1 mt-[48px] w-full overflow-hidden">

        {/* 3D Studio — always full background */}
        <div className="absolute inset-0 z-0">
          <AvatarViewer />
        </div>

        {/* Calibration panel — slides right on desktop, slides down on mobile on confirm */}
        <div
          className={`
            absolute bottom-0 md:top-0 right-0
            h-[55%] md:h-full
            w-full md:w-[35%] md:min-w-[400px]
            bg-white/90 md:bg-white/88
            backdrop-blur-3xl
            rounded-t-3xl md:rounded-none
            border-t md:border-t-0 md:border-l border-stone-200/60
            shadow-[0_-20px_60px_rgba(0,0,0,0.08)] md:shadow-[-20px_0_60px_rgba(0,0,0,0.04)]
            transition-transform duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)]
            z-10 overflow-y-auto
            ${isHidden ? 'translate-y-full md:translate-y-0 md:translate-x-full' : 'translate-y-0 md:translate-x-0'}
          `}
        >
          <div className="p-6 md:p-10 pb-28 max-w-lg mx-auto">
            {/* Mobile drag handle indicator */}
            <div className="w-12 h-1.5 bg-stone-300 rounded-full mx-auto mb-6 md:hidden" />
            <AvatarForm />
          </div>
        </div>

      </main>
    </div>
  );
};

export default AvatarPage;
