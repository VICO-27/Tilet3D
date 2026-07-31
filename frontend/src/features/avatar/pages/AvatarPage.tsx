import React, { useEffect } from 'react';
import Navbar from '../../../shared/components/layout/Navbar';
import { AvatarViewer } from '../components/AvatarViewer';
import { AvatarForm } from '../components/AvatarForm';
import { useAvatarStore } from '../store/useAvatarStore';

const AvatarPage = () => {
  const fetchAvatar = useAvatarStore((s) => s.fetchAvatar);
  const isConfirmed = useAvatarStore((s) => s.isConfirmed);

  useEffect(() => {
    fetchAvatar();
  }, [fetchAvatar]);

  return (
    <div className="flex flex-col h-screen w-full bg-[#f8f8f9] overflow-hidden">
      <Navbar />

      <main className="relative flex-1 mt-[48px] w-full overflow-hidden">

        {/* 3D Studio — always full background */}
        <div className="absolute inset-0 z-0">
          <AvatarViewer />
        </div>

        {/* Calibration panel — slides right on confirm */}
        <div
          className={`
            absolute top-0 right-0 h-full
            w-full md:w-[35%] md:min-w-[400px]
            bg-white/95 md:bg-white/88
            backdrop-blur-3xl
            border-l border-stone-200/60
            shadow-[-20px_0_60px_rgba(0,0,0,0.04)]
            transition-transform duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)]
            z-10 overflow-y-auto
            ${isConfirmed ? 'translate-x-full' : 'translate-x-0'}
          `}
        >
          <div className="p-6 md:p-10 pb-28 max-w-lg mx-auto">
            <AvatarForm />
          </div>
        </div>

      </main>
    </div>
  );
};

export default AvatarPage;
