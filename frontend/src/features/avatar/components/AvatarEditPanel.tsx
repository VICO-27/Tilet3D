import React from "react";
import { motion } from "framer-motion";
import { X, Check } from "lucide-react";
import type { AvatarProfile, BodyType } from "../types/avatar.types";
import { SKIN_TONE_SWATCHES } from "../utils/skinTones";

interface Props {
  profile: AvatarProfile;
  onChange: (patch: Partial<AvatarProfile>) => void;
  onClose: () => void;
}

const BODY_TYPES: { value: BodyType; label: string }[] = [
  { value: "slim", label: "Slim" },
  { value: "athletic", label: "Athletic" },
  { value: "average", label: "Average" },
  { value: "plus", label: "Plus" },
];

export const AvatarEditPanel: React.FC<Props> = ({
  profile,
  onChange,
  onClose,
}) => {
  return (
    <>
      {/* Scrim */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 z-30 bg-slate-900/20 backdrop-blur-[2px]"
      />

      <motion.aside
        initial={{ x: 360, opacity: 0.6 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 360, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 32 }}
        className="absolute bottom-0 right-0 top-0 z-40 flex w-[340px] max-w-[88vw] flex-col border-l border-slate-200 bg-white shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-violet-500">
              Tailor
            </p>
            <h3 className="font-serif text-xl font-semibold text-slate-900">
              Body & Fit
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Controls */}
        <div className="flex-1 space-y-8 overflow-y-auto px-6 py-6">
          <SliderRow
            label="Height"
            value={profile.height}
            min={140}
            max={210}
            unit="cm"
            onChange={(v) => onChange({ height: v })}
          />
          <SliderRow
            label="Weight"
            value={profile.weight}
            min={40}
            max={160}
            unit="kg"
            onChange={(v) => onChange({ weight: v })}
          />

          {/* Body type */}
          <div>
            <p className="mb-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Body Type
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              {BODY_TYPES.map((bt) => {
                const active = profile.bodyType === bt.value;
                return (
                  <button
                    key={bt.value}
                    onClick={() => onChange({ bodyType: bt.value })}
                    className={`rounded-2xl border py-3 text-xs font-bold transition-all duration-200 ${
                      active
                        ? "border-violet-500 bg-violet-50 text-violet-700 shadow-sm"
                        : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                    }`}
                  >
                    {bt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Skin tone */}
          <div>
            <p className="mb-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Skin Tone
            </p>
            <div className="flex gap-2.5">
              {SKIN_TONE_SWATCHES.map((t) => {
                const active = profile.skinTone === t.value;
                return (
                  <button
                    key={t.value}
                    title={t.label}
                    onClick={() => onChange({ skinTone: t.value })}
                    className={`flex aspect-square flex-1 items-center justify-center rounded-xl border-2 transition-all duration-300 ${
                      active
                        ? "scale-105 border-violet-500 shadow-md shadow-violet-300/40"
                        : "border-transparent hover:border-slate-200"
                    }`}
                    style={{ backgroundColor: t.hex }}
                  >
                    {active && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/90 text-violet-600">
                        <Check className="h-3.5 w-3.5 stroke-[3]" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 p-5">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={onClose}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-slate-900 py-3.5 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-violet-600"
          >
            <Check className="h-4 w-4" />
            Done
          </motion.button>
        </div>
      </motion.aside>
    </>
  );
};

const SliderRow: React.FC<{
  label: string;
  value: number;
  min: number;
  max: number;
  unit: string;
  onChange: (v: number) => void;
}> = ({ label, value, min, max, unit, onChange }) => {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
          {label}
        </span>
        <span className="rounded-full border border-violet-100 bg-violet-50 px-2.5 py-0.5 font-mono text-xs font-bold tabular-nums text-violet-700">
          {value} {unit}
        </span>
      </div>
      <div className="relative flex h-5 items-center">
        <div className="absolute h-1.5 w-full rounded-full bg-slate-100" />
        <div
          className="absolute h-1.5 rounded-full bg-gradient-to-r from-violet-500 to-purple-600"
          style={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
        />
        <div
          className="pointer-events-none absolute h-4 w-4 -translate-x-1/2 rounded-full border-2 border-violet-500 bg-white shadow"
          style={{ left: `${Math.max(0, Math.min(100, pct))}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={1}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full cursor-pointer opacity-0"
        />
      </div>
    </div>
  );
};
