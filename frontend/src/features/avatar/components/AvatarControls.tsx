import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit2, RotateCw, Play, Square, ShoppingBag } from 'lucide-react';
import { useAvatarStore } from '../store/useAvatarStore';

export const AvatarControls = () => {
  const store = useAvatarStore();
  const navigate = useNavigate();

  const isWalking = store.currentAnimation === 'walk';
  const isSpinning = store.currentAnimation === 'spin';

  return (
    <div className="flex items-center gap-1.5 p-2 bg-white/70 backdrop-blur-2xl rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.08)] border border-white/60">
      
      <button 
        onClick={store.enterEditMode} 
        className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-stone-700 hover:bg-white hover:text-stone-900 transition-all"
      >
        <Edit2 className="w-4 h-4" />
        Edit Body
      </button>

      <div className="w-px h-6 bg-stone-300/50 mx-1" />

      <button 
        onClick={() => store.setAnimation(isWalking ? 'idle' : 'walk')}
        className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${
          isWalking ? 'bg-plum-50 text-plum-700' : 'text-stone-700 hover:bg-white'
        }`}
      >
        {isWalking ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        {isWalking ? 'Stop' : 'Walk Test'}
      </button>

      <button 
        onClick={() => store.setAnimation(isSpinning ? 'idle' : 'spin')}
        className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${
          isSpinning ? 'bg-plum-50 text-plum-700' : 'text-stone-700 hover:bg-white'
        }`}
      >
        <RotateCw className={`w-4 h-4 ${isSpinning ? 'animate-spin-slow' : ''}`} />
        360° Spin
      </button>

      <div className="w-px h-6 bg-stone-300/50 mx-1" />

      <button 
        onClick={() => navigate('/products')}
        className="flex items-center gap-2 px-6 py-2.5 bg-ink text-white rounded-full text-sm font-semibold hover:bg-plum-600 transition-colors shadow-md"
      >
        <ShoppingBag className="w-4 h-4" />
        View Collections
      </button>

    </div>
  );
};