import React from 'react';
import {
  Edit2,
  Play,
  RotateCw,
  Crown,
} from 'lucide-react';
import { useAvatarStore } from '../store/useAvatarStore';

export function AvatarControls() {
  const enterEditMode = useAvatarStore((s) => s.enterEditMode);
  const setAnimation = useAvatarStore((s) => s.setAnimation);
  const currentAnimation = useAvatarStore((s) => s.currentAnimation);
  const isSpinning = currentAnimation === 'spin';

  return (
    <div className="flex items-center gap-1 sm:gap-1.5 p-1 sm:p-1.5 bg-white/90 backdrop-blur-2xl rounded-full shadow-[0_10px_35px_rgba(0,0,0,0.14)] border border-stone-200/90 max-w-[calc(100vw-1.5rem)] overflow-x-auto no-scrollbar">

      {/* Edit Body */}
      <button
        id="avatar-edit-btn"
        type="button"
        onClick={enterEditMode}
        className="flex shrink-0 items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold text-stone-800 hover:bg-white hover:text-stone-900 active:scale-95 transition-all duration-200"
      >
        <Edit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-violet-600" />
        <span className="whitespace-nowrap">Edit Body</span>
      </button>

      <div className="w-px h-5 sm:h-6 bg-stone-200 mx-0.5 shrink-0" />

      {/* Walk Test - Premium */}
      <button
        id="avatar-walk-btn"
        type="button"
        disabled
        title="Walk Test is a Premium feature"
        className="flex shrink-0 items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold text-stone-400 cursor-not-allowed opacity-75"
      >
        <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        <span className="whitespace-nowrap">Walk Test</span>
        <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-700 text-[9px] sm:text-[10px] font-bold uppercase tracking-wide">
          <Crown className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
          <span className="hidden xs:inline">Premium</span>
        </span>
      </button>

      <div className="w-px h-5 sm:h-6 bg-stone-200 mx-0.5 shrink-0" />

      {/* 360 Spin */}
      <button
        id="avatar-spin-btn"
        type="button"
        onClick={() => setAnimation(isSpinning ? 'idle' : 'spin')}
        className={`flex shrink-0 items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold active:scale-95 transition-all duration-200 ${
          isSpinning
            ? 'bg-violet-100 text-violet-800 shadow-sm'
            : 'text-stone-800 hover:bg-white'
        }`}
      >
        <RotateCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-violet-600 ${isSpinning ? 'animate-spin' : ''}`} />
        <span className="whitespace-nowrap">360° Spin</span>
      </button>

    </div>
  );
}