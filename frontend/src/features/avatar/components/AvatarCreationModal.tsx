import React, { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import type {
  AvatarProfile,
  BodyType,
  Gender,
  SkinTone,
} from "../types/avatar.types";
import { SKIN_TONE_SWATCHES } from "../utils/skinTones";

interface Props {
  onComplete: (profile: AvatarProfile) => void;
}

const BODY_TYPES: { value: BodyType; label: string }[] = [
  { value: "slim", label: "Slim" },
  { value: "athletic", label: "Athletic" },
  { value: "average", label: "Average" },
  { value: "plus", label: "Plus" },
];

export const AvatarCreationModal: React.FC<Props> = ({ onComplete }) => {
  const [form, setForm] = useState<Partial<AvatarProfile>>({
    gender: "male",
    bodyType: "average",
    skinTone: "medium",
    nickname: "",
  });

  const update = <K extends keyof AvatarProfile>(key: K, val: AvatarProfile[K]) =>
    setForm((p) => ({ ...p, [key]: val }));

  const canCreate = !!(
    form.nickname?.trim() &&
    form.age &&
    form.age >= 10 &&
    form.age <= 100 &&
    form.height &&
    form.height >= 120 &&
    form.height <= 220 &&
    form.weight &&
    form.weight >= 30 &&
    form.weight <= 200 &&
    form.gender &&
    form.bodyType &&
    form.skinTone
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 280, damping: 28 }}
        className="w-full max-w-[440px] overflow-hidden rounded-[26px] bg-white shadow-2xl shadow-violet-900/20"
      >
        <div className="px-8 pb-7 pt-8">
          {/* Header */}
          <div className="mb-6 text-center">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600 to-purple-500 text-lg font-black text-white shadow-lg shadow-violet-300/40">
              ጥ
            </div>
            <h2 className="mt-4 font-serif text-2xl font-semibold tracking-tight text-slate-900">
              Create your avatar
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              A few details to tailor your virtual fitting model.
            </p>
          </div>

          <div className="space-y-5">
            {/* Row: Nickname + Age */}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Nickname">
                <input
                  id="nickname-input"
                  type="text"
                  maxLength={16}
                  placeholder="Yohannes"
                  value={form.nickname ?? ""}
                  onChange={(e) => update("nickname", e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="Age">
                <input
                  id="age-input"
                  type="number"
                  placeholder="25"
                  value={form.age ?? ""}
                  onChange={(e) =>
                    update(
                      "age",
                      e.target.value ? Number(e.target.value) : (undefined as never),
                    )
                  }
                  className={inputCls}
                />
              </Field>
            </div>

            {/* Row: Height + Weight */}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Height · cm">
                <input
                  id="height-input"
                  type="number"
                  placeholder="170"
                  value={form.height ?? ""}
                  onChange={(e) =>
                    update(
                      "height",
                      e.target.value ? Number(e.target.value) : (undefined as never),
                    )
                  }
                  className={inputCls}
                />
              </Field>
              <Field label="Weight · kg">
                <input
                  id="weight-input"
                  type="number"
                  placeholder="65"
                  value={form.weight ?? ""}
                  onChange={(e) =>
                    update(
                      "weight",
                      e.target.value ? Number(e.target.value) : (undefined as never),
                    )
                  }
                  className={inputCls}
                />
              </Field>
            </div>

            {/* Gender */}
            <Field label="Model base">
              <div className="grid grid-cols-2 gap-2.5">
                {(["female", "male"] as Gender[]).map((g) => (
                  <Chip
                    key={g}
                    id={`gender-button-${g}`}
                    active={form.gender === g}
                    onClick={() => update("gender", g)}
                  >
                    {g === "male" ? "♂ Male" : "♀ Female"}
                  </Chip>
                ))}
              </div>
            </Field>

            {/* Body type */}
            <Field label="Body type">
              <div className="grid grid-cols-4 gap-2">
                {BODY_TYPES.map((bt) => (
                  <Chip
                    key={bt.value}
                    id={`bodytype-button-${bt.value}`}
                    active={form.bodyType === bt.value}
                    onClick={() => update("bodyType", bt.value)}
                    small
                  >
                    {bt.label}
                  </Chip>
                ))}
              </div>
            </Field>

            {/* Skin tone */}
            <Field label="Skin tone">
              <div className="flex gap-2.5">
                {SKIN_TONE_SWATCHES.map((t) => (
                  <button
                    key={t.value}
                    id={`skintone-button-${t.value}`}
                    type="button"
                    title={t.label}
                    onClick={() => update("skinTone", t.value as SkinTone)}
                    className={`aspect-square flex-1 rounded-xl border-2 transition-all duration-200 ${
                      form.skinTone === t.value
                        ? "scale-105 border-slate-900 shadow-md"
                        : "border-transparent hover:border-slate-300"
                    }`}
                    style={{ backgroundColor: t.hex }}
                  />
                ))}
              </div>
            </Field>

            {/* CTA */}
            <motion.button
              id="create-avatar-button"
              type="button"
              disabled={!canCreate}
              onClick={() => onComplete(form as AvatarProfile)}
              whileHover={canCreate ? { scale: 1.015 } : undefined}
              whileTap={canCreate ? { scale: 0.985 } : undefined}
              className="mt-1 flex w-full items-center justify-center gap-2 rounded-full bg-slate-900 py-3.5 text-sm font-bold uppercase tracking-wider text-white transition-colors hover:bg-violet-600 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
            >
              Create My Avatar
              <ArrowRight className="h-4 w-4" />
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-violet-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-100";

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({
  label,
  children,
}) => (
  <div>
    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
      {label}
    </label>
    {children}
  </div>
);

const Chip: React.FC<{
  id?: string;
  active: boolean;
  small?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ id, active, small, onClick, children }) => (
  <button
    id={id}
    type="button"
    onClick={onClick}
    className={`rounded-xl border font-bold transition-all duration-200 ${
      small ? "py-2 text-[11px]" : "py-2.5 text-sm"
    } ${
      active
        ? "border-slate-900 bg-slate-900 text-white shadow-sm"
        : "border-slate-200 bg-white text-slate-500 hover:border-slate-400 hover:text-slate-800"
    }`}
  >
    {children}
  </button>
);
