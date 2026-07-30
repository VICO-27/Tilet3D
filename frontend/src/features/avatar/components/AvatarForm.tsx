import React from 'react';
import { useAvatarStore } from '../store/useAvatarStore';
import { Gender, BodyType, AvatarData } from '../types/avatar.types';

export const AvatarForm = () => {
  const store = useAvatarStore();

  const measurementFields: (keyof AvatarData)[] = [
    'height', 'weight', 'chest', 'waist', 'shoulder_width', 'hips'
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-700">
      <div>
        <h2 className="text-3xl font-semibold tracking-tight text-ink">Studio Measurements</h2>
        <p className="text-ink/50 text-sm mt-2 font-medium">Calibrate your avatar for the perfect couture fit.</p>
      </div>
      
      <section className="space-y-5">
        <div>
          <label className="block text-[10px] font-bold tracking-widest text-ink/40 uppercase mb-2">Identity</label>
          <input 
            type="text" value={store.nickname} 
            onChange={(e) => store.setAvatarData({ nickname: e.target.value })}
            className="w-full bg-stone-100/50 border border-stone-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-plum-500/20 focus:border-plum-500 transition-all outline-none"
            placeholder="What should we call you?"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold tracking-widest text-ink/40 uppercase mb-2">Age</label>
            <input 
              type="number" value={store.age} 
              onChange={(e) => store.setAvatarData({ age: +e.target.value })} 
              className="w-full bg-stone-100/50 border border-stone-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-plum-500/20 focus:border-plum-500 transition-all outline-none" 
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold tracking-widest text-ink/40 uppercase mb-2">Gender</label>
            <select 
              value={store.gender} 
              onChange={(e) => store.setAvatarData({ gender: e.target.value as Gender })}
              className="w-full bg-stone-100/50 border border-stone-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-plum-500/20 focus:border-plum-500 transition-all outline-none appearance-none"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold tracking-widest text-ink/40 uppercase mb-2">Body Structure</label>
          <select 
            value={store.body_type} 
            onChange={(e) => store.setAvatarData({ body_type: e.target.value as BodyType })}
            className="w-full bg-stone-100/50 border border-stone-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-plum-500/20 focus:border-plum-500 transition-all outline-none capitalize appearance-none"
          >
            {['slim', 'athletic', 'average', 'plus', 'inverted_triangle', 'pear', 'rectangle'].map(type => (
              <option key={type} value={type}>{type.replace('_', ' ')}</option>
            ))}
          </select>
        </div>
      </section>

      <section className="pt-6 border-t border-stone-100 space-y-5">
        <label className="block text-[10px] font-bold tracking-widest text-ink/40 uppercase">Dimensions (cm & kg)</label>
        <div className="grid grid-cols-2 gap-4 gap-y-5">
          {measurementFields.map((key) => (
            <div key={key} className="relative">
              <span className="absolute -top-2 left-3 bg-white px-1 text-[9px] font-bold tracking-wider text-ink/40 uppercase z-10">
                {key.replace('_', ' ')}
              </span>
              <input 
                type="number" 
                value={store[key] as number}
                onChange={(e) => store.setAvatarData({ [key]: +e.target.value })}
                className="w-full bg-transparent border border-stone-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-plum-500/20 focus:border-plum-500 transition-all outline-none"
              />
            </div>
          ))}
        </div>
      </section>

      <section className="pt-6 border-t border-stone-100">
        <label className="block text-[10px] font-bold tracking-widest text-ink/40 uppercase mb-3">Complexion</label>
        <div className="flex gap-3">
          {(['fair', 'light', 'medium', 'tan', 'rich', 'deep'] as const).map((tone) => (
            <button 
              key={tone}
              onClick={() => store.setAvatarData({ skin_tone: tone })}
              className={`w-10 h-10 rounded-full transition-all duration-300 shadow-sm ${store.skin_tone === tone ? 'ring-2 ring-offset-2 ring-ink scale-110' : 'ring-1 ring-black/5 hover:scale-105'}`}
              style={{ backgroundColor: tone === 'fair' ? '#fdf0ea' : tone === 'light' ? '#f1c27d' : tone === 'medium' ? '#b18a66' : tone === 'tan' ? '#8d5524' : tone === 'rich' ? '#5c3816' : '#2d1606' }}
              title={tone}
            />
          ))}
        </div>
      </section>

      <button 
        onClick={store.confirmAvatar}
        disabled={store.isLoading}
        className="w-full bg-ink text-white py-4 rounded-xl text-sm font-semibold hover:bg-plum-600 transition-all duration-300 disabled:opacity-50 mt-8 shadow-lg shadow-ink/10 flex justify-center"
      >
        {store.isLoading ? (
           <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          'Confirm Calibration'
        )}
      </button>
    </div>
  );
};