import React from 'react';
import { useAvatarStore } from '../store/useAvatarStore';
import type { Gender, BodyType, SkinTone } from '../types/avatar.types';

const SKIN_SWATCHES: { tone: SkinTone; hex: string }[] = [
  { tone: 'fair', hex: '#fdf0ea' },
  { tone: 'light', hex: '#f1c27d' },
  { tone: 'medium', hex: '#b18a66' },
  { tone: 'tan', hex: '#8d5524' },
  { tone: 'rich', hex: '#5c3816' },
  { tone: 'deep', hex: '#2d1606' },
];

const BODY_TYPES: BodyType[] = [
  'slim', 'athletic', 'average', 'plus', 'inverted_triangle', 'pear', 'rectangle',
];

const MEASUREMENT_FIELDS: { key: keyof import('../types/avatar.types').AvatarData; label: string; unit: string; min: number; max: number }[] = [
  { key: 'height', label: 'Height', unit: 'cm', min: 120, max: 230 },
  { key: 'weight', label: 'Weight', unit: 'kg', min: 30, max: 250 },
  { key: 'chest', label: 'Chest', unit: 'cm', min: 40, max: 200 },
  { key: 'waist', label: 'Waist', unit: 'cm', min: 35, max: 200 },
  { key: 'shoulder_width', label: 'Shoulder', unit: 'cm', min: 20, max: 100 },
  { key: 'hips', label: 'Hips', unit: 'cm', min: 40, max: 220 },
];

export function AvatarForm() {
  // Granular subscriptions — each field only causes its own row to re-render
  const nickname = useAvatarStore((s) => s.nickname);
  const age = useAvatarStore((s) => s.age);
  const gender = useAvatarStore((s) => s.gender);
  const body_type = useAvatarStore((s) => s.body_type);
  const skin_tone = useAvatarStore((s) => s.skin_tone);
  const height = useAvatarStore((s) => s.height);
  const weight = useAvatarStore((s) => s.weight);
  const chest = useAvatarStore((s) => s.chest);
  const waist = useAvatarStore((s) => s.waist);
  const shoulder_width = useAvatarStore((s) => s.shoulder_width);
  const hips = useAvatarStore((s) => s.hips);
  const isLoading = useAvatarStore((s) => s.isLoading);
  const setAvatarData = useAvatarStore((s) => s.setAvatarData);
  const confirmAvatar = useAvatarStore((s) => s.confirmAvatar);

  const values: Record<string, number> = { height, weight, chest, waist, shoulder_width, hips };

  return (
    <div className="space-y-8">

      {/* Header */}
      <div>
        <h2 className="text-3xl font-semibold tracking-tight text-[#161616]">
          Studio Measurements
        </h2>
        <p className="text-[#161616]/50 text-sm mt-2 font-medium">
          Calibrate your avatar for the perfect couture fit.
        </p>
      </div>

      {/* Identity section */}
      <section className="space-y-5">
        <label className="block text-[10px] font-bold tracking-[0.2em] text-[#161616]/40 uppercase">
          Identity
        </label>

        <input
          id="avatar-nickname"
          type="text"
          value={nickname}
          onChange={(e) => setAvatarData({ nickname: e.target.value })}
          placeholder="What should we call you?"
          className="w-full bg-stone-100/50 border border-stone-200 rounded-xl px-4 py-3 text-sm text-[#161616] placeholder-[#161616]/30 focus:bg-white focus:ring-2 focus:ring-[#a21caf]/20 focus:border-[#a21caf] transition-all outline-none"
        />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold tracking-[0.15em] text-[#161616]/40 uppercase mb-2">
              Age
            </label>
            <input
              id="avatar-age"
              type="number"
              value={age}
              min={1}
              max={120}
              onChange={(e) => setAvatarData({ age: +e.target.value })}
              className="w-full bg-stone-100/50 border border-stone-200 rounded-xl px-4 py-3 text-sm text-[#161616] focus:bg-white focus:ring-2 focus:ring-[#a21caf]/20 focus:border-[#a21caf] transition-all outline-none"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold tracking-[0.15em] text-[#161616]/40 uppercase mb-2">
              Gender
            </label>
            <select
              id="avatar-gender"
              value={gender}
              onChange={(e) => setAvatarData({ gender: e.target.value as Gender })}
              className="w-full bg-stone-100/50 border border-stone-200 rounded-xl px-4 py-3 text-sm text-[#161616] focus:bg-white focus:ring-2 focus:ring-[#a21caf]/20 focus:border-[#a21caf] transition-all outline-none appearance-none"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold tracking-[0.15em] text-[#161616]/40 uppercase mb-2">
            Body Structure
          </label>
          <select
            id="avatar-body-type"
            value={body_type}
            onChange={(e) => setAvatarData({ body_type: e.target.value as BodyType })}
            className="w-full bg-stone-100/50 border border-stone-200 rounded-xl px-4 py-3 text-sm text-[#161616] focus:bg-white focus:ring-2 focus:ring-[#a21caf]/20 focus:border-[#a21caf] transition-all outline-none capitalize appearance-none"
          >
            {BODY_TYPES.map((t) => (
              <option key={t} value={t}>{t.replace('_', ' ')}</option>
            ))}
          </select>
        </div>
      </section>

      {/* Measurements section */}
      <section className="pt-6 border-t border-stone-100 space-y-5">
        <label className="block text-[10px] font-bold tracking-[0.2em] text-[#161616]/40 uppercase">
          Dimensions
        </label>
        <div className="grid grid-cols-2 gap-x-4 gap-y-6">
          {MEASUREMENT_FIELDS.map(({ key, label, unit, min, max }) => (
            <div key={key} className="relative">
              <span className="absolute -top-2 left-3 bg-white px-1 text-[9px] font-bold tracking-wider text-[#161616]/40 uppercase z-10">
                {label} ({unit})
              </span>
              <input
                id={`avatar-${key}`}
                type="number"
                value={values[key]}
                min={min}
                max={max}
                onChange={(e) => setAvatarData({ [key]: +e.target.value })}
                className="w-full bg-transparent border border-stone-200 rounded-xl px-4 py-3 text-sm text-[#161616] focus:bg-white focus:ring-2 focus:ring-[#a21caf]/20 focus:border-[#a21caf] transition-all outline-none"
              />
            </div>
          ))}
        </div>
      </section>

      {/* Complexion section */}
      <section className="pt-6 border-t border-stone-100">
        <label className="block text-[10px] font-bold tracking-[0.2em] text-[#161616]/40 uppercase mb-4">
          Complexion
        </label>
        <div className="flex gap-3 flex-wrap">
          {SKIN_SWATCHES.map(({ tone, hex }) => (
            <button
              key={tone}
              id={`avatar-skin-${tone}`}
              title={tone}
              onClick={() => setAvatarData({ skin_tone: tone })}
              style={{ backgroundColor: hex }}
              className={`w-10 h-10 rounded-full transition-all duration-300 ${
                skin_tone === tone
                  ? 'ring-2 ring-offset-2 ring-[#161616] scale-110 shadow-md'
                  : 'ring-1 ring-black/10 hover:scale-105 hover:shadow-sm'
              }`}
            />
          ))}
        </div>
      </section>

      {/* Confirm button */}
      <button
        id="avatar-confirm-btn"
        onClick={confirmAvatar}
        disabled={isLoading}
        className="w-full bg-[#161616] text-white py-4 rounded-xl text-sm font-semibold hover:bg-[#a21caf] transition-all duration-300 disabled:opacity-50 mt-4 shadow-lg shadow-black/10 flex justify-center items-center gap-2"
      >
        {isLoading ? (
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          'Confirm Calibration'
        )}
      </button>
    </div>
  );
}
