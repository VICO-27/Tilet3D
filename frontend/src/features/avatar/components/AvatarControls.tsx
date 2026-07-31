import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit2, Play, Square, RotateCw, ShoppingBag } from 'lucide-react';
import { useAvatarStore } from '../store/useAvatarStore';

export function AvatarControls() {
  const navigate = useNavigate();
  const enterEditMode = useAvatarStore((s) => s.enterEditMode);
  const setAnimation = useAvatarStore((s) => s.setAnimation);
  const currentAnimation = useAvatarStore((s) => s.currentAnimation);

  const isWalking = currentAnimation === 'walk';
  const isSpinning = currentAnimation === 'spin';

  return (
    <div className="flex items-center gap-1 p-1.5 bg-white/70 backdrop-blur-2xl rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.08)] border border-white/60">

      <button
        id="avatar-edit-btn"
        onClick={enterEditMode}
        className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-stone-700 hover:bg-white hover:text-stone-900 transition-all duration-200"
      >
        <Edit2 className="w-4 h-4" />
        Edit Body
      </button>

      <div className="w-px h-6 bg-stone-200 mx-1" />

      <button
        id="avatar-walk-btn"
        onClick={() => setAnimation(isWalking ? 'idle' : 'walk')}
        className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 ${
          isWalking ? 'bg-plum-50 text-plum-700' : 'text-stone-700 hover:bg-white'
        }`}
      >
        {isWalking ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        {isWalking ? 'Stop' : 'Walk Test'}
      </button>

      <button
        id="avatar-spin-btn"
        onClick={() => setAnimation(isSpinning ? 'idle' : 'spin')}
        className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 ${
          isSpinning ? 'bg-plum-50 text-plum-700' : 'text-stone-700 hover:bg-white'
        }`}
      >
        <RotateCw className={`w-4 h-4 ${isSpinning ? 'animate-spin' : ''}`} />
        360° Spin
      </button>

      <div className="w-px h-6 bg-stone-200 mx-1" />

      <button
        id="avatar-collections-btn"
        onClick={() => navigate('/products')}
        className="flex items-center gap-2 px-6 py-2.5 bg-[#161616] text-white rounded-full text-sm font-semibold hover:bg-plum-600 transition-colors duration-200 shadow-md"
      >
        <ShoppingBag className="w-4 h-4" />
        View Collections
      </button>

    </div>
  );
}
