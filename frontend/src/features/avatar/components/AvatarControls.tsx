import React from 'react';
import {
  Edit2,
  Play,
  RotateCw,
  Crown,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAvatarStore } from '../store/useAvatarStore';

export function AvatarControls() {
  const { t } = useTranslation();
  const enterEditMode = useAvatarStore((s) => s.enterEditMode);
  const setAnimation = useAvatarStore((s) => s.setAnimation);
  const currentAnimation = useAvatarStore((s) => s.currentAnimation);
  const isSpinning = currentAnimation === 'spin';

  const handleEditClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    enterEditMode();
  };

  return (
    <div className="flex items-center gap-0.5 sm:gap-1.5 p-1 sm:p-1.5 bg-white/95 backdrop-blur-2xl rounded-full shadow-[0_10px_35px_rgba(0,0,0,0.18)] border border-stone-200/90 max-w-[calc(100vw-1.5rem)] overflow-x-auto no-scrollbar pointer-events-auto">

      {/* Edit Body */}
      <button
        id="avatar-edit-btn"
        type="button"
        onClick={handleEditClick}
        onTouchEnd={handleEditClick}
        className="flex shrink-0 items-center gap-1 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold text-stone-800 hover:bg-stone-100 hover:text-stone-900 active:scale-95 transition-all duration-200 cursor-pointer touch-manipulation select-none"
      >
        <Edit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-violet-600 shrink-0" />
        <span className="whitespace-nowrap">{t("avatar.editBody", "Edit Body")}</span>
      </button>

      <div className="w-px h-4 sm:h-6 bg-stone-200 mx-0.5 shrink-0" />

      {/* Walk Test - Premium */}
      <button
        id="avatar-walk-btn"
        type="button"
        disabled
        title={t("avatar.walkTestPremium", "Walk Test is a Premium feature")}
        className="flex shrink-0 items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold text-stone-400 cursor-not-allowed opacity-75"
      >
        <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
        <span className="whitespace-nowrap">{t("avatar.walkTest", "Walk Test")}</span>
        <span className="flex items-center gap-1 px-1 sm:px-1.5 py-0.5 rounded-full bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-700 text-[9px] sm:text-[10px] font-bold uppercase tracking-wide shrink-0">
          <Crown className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
          <span className="hidden sm:inline">{t("avatar.premium", "Premium")}</span>
        </span>
      </button>

      <div className="w-px h-4 sm:h-6 bg-stone-200 mx-0.5 shrink-0" />

      {/* 360 Spin */}
      <button
        id="avatar-spin-btn"
        type="button"
        onClick={() => setAnimation(isSpinning ? 'idle' : 'spin')}
        className={`flex shrink-0 items-center gap-1 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold active:scale-95 transition-all duration-200 ${
          isSpinning
            ? 'bg-violet-100 text-violet-800 shadow-sm'
            : 'text-stone-800 hover:bg-white'
        }`}
      >
        <RotateCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-violet-600 ${isSpinning ? 'animate-spin' : ''} shrink-0`} />
        <span className="whitespace-nowrap">{t("avatar.spin360", "360° Spin")}</span>
      </button>

    </div>
  );
}