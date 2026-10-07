import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Edit2,
  Play,
  RotateCw,
  ShoppingBag,
  Crown,
} from 'lucide-react';
import { useAvatarStore } from '../store/useAvatarStore';

export function AvatarControls() {
  const navigate = useNavigate();

  const enterEditMode =
    useAvatarStore(
      (s) => s.enterEditMode,
    );

  const setAnimation =
    useAvatarStore(
      (s) => s.setAnimation,
    );

  const currentAnimation =
    useAvatarStore(
      (s) => s.currentAnimation,
    );

  const isSpinning =
    currentAnimation === 'spin';

  return (
    <div className="flex items-center gap-1 p-1.5 bg-white/70 backdrop-blur-2xl rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.08)] border border-white/60 max-w-[95vw] overflow-x-auto no-scrollbar">

      {/* Edit Body */}
      <button
        id="avatar-edit-btn"
        type="button"
        onClick={enterEditMode}
        className="flex shrink-0 items-center gap-1.5 md:gap-2 px-3 md:px-5 py-2 md:py-2.5 rounded-full text-xs md:text-sm font-semibold text-stone-700 hover:bg-white hover:text-stone-900 transition-all duration-200"
      >
        <Edit2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
        <span className="whitespace-nowrap">Edit Body</span>
      </button>

      <div className="w-px h-6 bg-stone-200 mx-0.5 md:mx-1 shrink-0" />

      {/* Walk Test - Premium */}
      <button
        id="avatar-walk-btn"
        type="button"
        disabled
        title="Walk Test is a Premium feature"
        className="flex shrink-0 items-center gap-1.5 md:gap-2 px-3 md:px-5 py-2 md:py-2.5 rounded-full text-xs md:text-sm font-semibold text-stone-400 cursor-not-allowed opacity-80"
      >
        <Play className="w-3.5 h-3.5 md:w-4 md:h-4" />
        <span className="hidden sm:inline whitespace-nowrap">Walk Test</span>
        <span className="flex items-center gap-1 px-1.5 md:px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-700 text-[9px] md:text-[10px] font-bold uppercase tracking-wide">
          <Crown className="w-2.5 h-2.5 md:w-3 md:h-3" />
          Premium
        </span>
      </button>

      {/* 360 Spin */}
      <button
        id="avatar-spin-btn"
        type="button"
        onClick={() => setAnimation(isSpinning ? 'idle' : 'spin')}
        className={`flex shrink-0 items-center gap-1.5 md:gap-2 px-3 md:px-5 py-2 md:py-2.5 rounded-full text-xs md:text-sm font-semibold transition-all duration-200 ${
          isSpinning ? 'bg-plum-50 text-plum-700' : 'text-stone-700 hover:bg-white'
        }`}
      >
        <RotateCw className={`w-3.5 h-3.5 md:w-4 md:h-4 ${isSpinning ? 'animate-spin' : ''}`} />
        <span className="whitespace-nowrap">360° Spin</span>
      </button>

    </div>
  );
}