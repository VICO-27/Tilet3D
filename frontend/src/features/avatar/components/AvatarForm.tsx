// frontend/src/features/avatar/components/AvatarForm.tsx
import React, { useState } from 'react';
import type { Gender, BodyType, SkinTone } from '../types/avatar.types';
import { useAvatarStore } from '../store/useAvatarStore';

const SKIN_TONES: Array<{ value: SkinTone; label: string; color: string }> = [
  { value: 'ivory', label: 'Ivory', color: '#FFF6EE' },
  { value: 'fair', label: 'Fair', color: '#FDF0EA' },
  { value: 'light', label: 'Light', color: '#F1C27D' },
  { value: 'honey', label: 'Honey', color: '#DBA463' },
  { value: 'medium', label: 'Medium', color: '#B18A66' },
  { value: 'caramel', label: 'Caramel', color: '#9C7148' },
  { value: 'tan', label: 'Tan', color: '#8D5524' },
  { value: 'chestnut', label: 'Chestnut', color: '#74421F' },
  { value: 'rich', label: 'Rich', color: '#5C3816' },
  { value: 'espresso', label: 'Espresso', color: '#452710' },
  { value: 'deep', label: 'Deep', color: '#2D1606' },
  { value: 'ebony', label: 'Ebony', color: '#180B03' },
];

const BODY_TYPES: Array<{ value: BodyType; label: string }> = [
  { value: 'slim', label: 'Slim' },
  { value: 'athletic', label: 'Athletic' },
  { value: 'average', label: 'Average' },
  { value: 'plus', label: 'Plus' },
  { value: 'inverted_triangle', label: 'Inverted Triangle' },
  { value: 'pear', label: 'Pear' },
  { value: 'rectangle', label: 'Rectangle' },
];

interface EditableNumberInputProps {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  onCommit: (value: number) => void;
}

function EditableNumberInput({ id, label, value, min, max, step = 1, suffix, onCommit }: EditableNumberInputProps) {
  const [draft, setDraft] = useState(String(value));

  const commitValue = (rawValue: string) => {
    const trimmed = rawValue.trim();
    if (trimmed === '') { setDraft(String(value)); return; }
    
    const parsed = Number(trimmed);
    if (!Number.isFinite(parsed)) { setDraft(String(value)); return; }
    
    const clamped = Math.min(max, Math.max(min, parsed));
    setDraft(String(clamped));
    onCommit(clamped);
  };

  return (
    <div className="min-w-0">
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-stone-500">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={id}
          type="number"
          inputMode="decimal"
          min={min}
          max={max}
          step={step}
          value={draft}
          onChange={(event) => {
            const nextValue = event.target.value;
            setDraft(nextValue);
            if (nextValue === '' || nextValue === '-' || nextValue === '.' || nextValue === '-.') return;
            const parsed = Number(nextValue);
            if (Number.isFinite(parsed) && parsed >= min && parsed <= max) onCommit(parsed);
          }}
          onBlur={(event) => commitValue(event.currentTarget.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              commitValue(event.currentTarget.value);
              event.currentTarget.blur();
            }
          }}
          className="h-12 w-full rounded-xl border border-stone-200 bg-white/80 px-4 text-base font-medium text-stone-800 outline-none transition-all duration-200 focus:border-stone-400 focus:ring-2 focus:ring-stone-200"
        />
        {suffix && (
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-stone-400">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

export function AvatarForm() {
  const {
    nickname, age, gender, body_type: bodyType, skin_tone: skinTone, 
    height, weight, chest, waist, shoulder_width: shoulderWidth, hips, 
    isLoading, notification, notificationType, setAvatarData, confirmAvatar
  } = useAvatarStore();

  const selectedSkinTone = SKIN_TONES.find((tone) => tone.value === skinTone);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await confirmAvatar();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex h-full min-h-0 w-full flex-col overflow-y-auto rounded-[2rem] bg-white/70 p-7 backdrop-blur-2xl"
    >
      <div className="flex shrink-0 items-center justify-between mb-3">
        <div>
          <h2 className="text-2xl font-semibold text-stone-900">Create Your Avatar</h2>
          <p className="mt-1 text-base text-stone-500">Customize your body profile</p>
        </div>
        {isLoading && <div className="h-7 w-7 animate-spin rounded-full border-2 border-stone-200 border-t-stone-700" />}
      </div>

      {notification && (
        <div className={`mt-3 shrink-0 rounded-xl px-4 py-3 text-base font-medium ${notificationType === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
          {notification}
        </div>
      )}

      <div className="min-h-0 flex-1 pt-5">
        <div className="grid content-start gap-5">
          
          <div className="grid grid-cols-[1.5fr_1fr] gap-5">
            <div className="min-w-0">
              <label htmlFor="avatar-nickname" className="mb-2 block text-sm font-medium text-stone-500">
                Nickname
              </label>
              <input
                id="avatar-nickname"
                name="nickname"
                type="text"
                value={nickname}
                onChange={(event) => setAvatarData({ nickname: event.target.value })}
                placeholder="Your avatar name"
                className="h-12 w-full rounded-xl border border-stone-200 bg-white/80 px-4 text-base font-medium text-stone-800 outline-none transition-all duration-200 placeholder:text-stone-300 focus:border-stone-400 focus:ring-2 focus:ring-stone-200"
              />
            </div>
            <EditableNumberInput id="avatar-age" label="Age" value={age} min={1} max={120} onCommit={(value) => setAvatarData({ age: value })} />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-stone-500">Gender</label>
            <div className="grid grid-cols-2 gap-3">
              {(['male', 'female'] as Gender[]).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setAvatarData({ gender: option })}
                  className={`h-12 rounded-xl text-base font-semibold transition-all duration-200 ${gender === option ? 'bg-[#161616] text-white shadow-md' : 'bg-white/70 text-stone-600 hover:bg-white border border-stone-100'}`}
                >
                  {option === 'male' ? 'Male' : 'Female'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-stone-500">Body Type</label>
            <div className="grid grid-cols-4 gap-2.5">
              {BODY_TYPES.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setAvatarData({ body_type: option.value })}
                  className={`h-11 rounded-lg px-2 text-xs font-semibold transition-all duration-200 ${bodyType === option.value ? 'bg-plum-50 text-plum-700 ring-1 ring-plum-200' : 'bg-white/70 text-stone-600 hover:bg-white border border-stone-100'}`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <label className="text-sm font-medium text-stone-500">Skin Tone</label>
              <span className="text-sm font-medium text-stone-400">{selectedSkinTone?.label}</span>
            </div>
            <div className="grid grid-cols-12 gap-2">
              {SKIN_TONES.map((tone) => (
                <button
                  key={tone.value}
                  type="button"
                  title={tone.label}
                  aria-label={`Select ${tone.label} skin tone`}
                  onClick={() => setAvatarData({ skin_tone: tone.value })}
                  className={`relative aspect-square rounded-full transition-all duration-200 ${skinTone === tone.value ? 'scale-110 ring-2 ring-stone-900 ring-offset-2' : 'hover:scale-110'}`}
                  style={{ backgroundColor: tone.color }}
                >
                  {skinTone === tone.value && (
                    <span className="absolute inset-0 rounded-full border border-white/90" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <EditableNumberInput id="avatar-height" label="Height" value={height} min={120} max={230} suffix="cm" onCommit={(value) => setAvatarData({ height: value })} />
            <EditableNumberInput id="avatar-weight" label="Weight" value={weight} min={30} max={250} suffix="kg" onCommit={(value) => setAvatarData({ weight: value })} />
          </div>

          <div>
            <label className="mb-3 block text-sm font-medium text-stone-500">Measurements</label>
            <div className="grid grid-cols-4 gap-3.5">
              <EditableNumberInput id="avatar-chest" label="Chest" value={chest} min={40} max={200} suffix="cm" onCommit={(value) => setAvatarData({ chest: value })} />
              <EditableNumberInput id="avatar-waist" label="Waist" value={waist} min={35} max={200} suffix="cm" onCommit={(value) => setAvatarData({ waist: value })} />
              <EditableNumberInput id="avatar-shoulder" label="Shoulder" value={shoulderWidth} min={20} max={100} suffix="cm" onCommit={(value) => setAvatarData({ shoulder_width: value })} />
              <EditableNumberInput id="avatar-hips" label="Hips" value={hips} min={40} max={220} suffix="cm" onCommit={(value) => setAvatarData({ hips: value })} />
            </div>
          </div>
          
        </div>
      </div>

      <div className="mt-5 shrink-0 border-t border-stone-200/60 pt-5">
        <button
          type="submit"
          disabled={isLoading}
          className="h-14 w-full rounded-2xl bg-[#161616] px-6 text-lg font-semibold text-white shadow-md transition-all duration-200 hover:bg-plum-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? 'Saving...' : 'Confirm Avatar'}
        </button>
      </div>
    </form>
  );
}