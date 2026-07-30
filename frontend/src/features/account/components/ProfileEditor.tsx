import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Camera, User as UserIcon } from "lucide-react";
import { type AuthUser, type UpdateProfilePayload } from "../types/auth";
import { GENDER_CHOICES, BODY_TYPE_CHOICES, SKIN_TONE_CHOICES } from "../constants/profileChoices";

interface ProfileEditorProps {
  user: AuthUser;
  onCancel: () => void;
  onSave: (data: UpdateProfilePayload) => Promise<void>;
}

export const ProfileEditor: React.FC<ProfileEditorProps> = ({ user, onCancel, onSave }) => {
  const [fullName, setFullName] = useState(user.full_name || "");
  const [nickname, setNickname] = useState(user.nickname || "");
  const [gender, setGender] = useState(user.gender || "");
  const [bodyType, setBodyType] = useState(user.body_type || "");
  const [skinTone, setSkinTone] = useState(user.skin_tone || "");

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user.avatar_image);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initials = (fullName || nickname || user.email)
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const handleAvatarPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5MB.");
      return;
    }

    setError(null);
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload: UpdateProfilePayload = {
        full_name: fullName,
        nickname,
        gender,
        body_type: bodyType,
        skin_tone: skinTone,
      };
      if (avatarFile) payload.avatar_image = avatarFile;

      await onSave(payload);
      onCancel();
    } catch (err) {
      console.error("Failed to update profile", err);
      setError("Couldn't save your changes. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-[640px] px-6 pb-20 pt-[100px]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-plum-600">
        Account Settings
      </p>
      <h2 className="display mt-2 mb-8 text-3xl font-semibold text-ink">Edit Profile</h2>

      <form onSubmit={handleSave} className="space-y-8">
        {/* Avatar */}
        <div className="flex items-center gap-5">
          <div className="relative">
            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-ink text-xl font-black text-white">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                initials || <UserIcon className="h-7 w-7" />
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1.5 -right-1.5 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-plum-600 text-white shadow-md transition-colors hover:bg-plum-700"
            >
              <Camera className="h-3.5 w-3.5" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarPick}
              className="hidden"
            />
          </div>
          <div>
            <p className="text-sm font-semibold text-ink">Profile photo</p>
            <p className="text-xs text-ink/45">JPG or PNG, up to 5MB.</p>
          </div>
        </div>

        {/* Identity */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Full Name">
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your full name"
              className={inputClass}
            />
          </Field>
          <Field label="Nickname">
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="What we'll call you"
              className={inputClass}
            />
          </Field>
        </div>

        {/* Avatar-fitting attributes */}
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink/40">
            Fit Profile
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Gender">
              <select value={gender} onChange={(e) => setGender(e.target.value)} className={inputClass}>
                <option value="">Select</option>
                {GENDER_CHOICES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Body Type">
              <select value={bodyType} onChange={(e) => setBodyType(e.target.value)} className={inputClass}>
                <option value="">Select</option>
                {BODY_TYPE_CHOICES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Skin Tone">
              <select value={skinTone} onChange={(e) => setSkinTone(e.target.value)} className={inputClass}>
                <option value="">Select</option>
                {SKIN_TONE_CHOICES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </Field>
          </div>
        </div>

        {error && (
          <p className="rounded-xl bg-rose-50 py-2.5 text-center text-xs font-medium text-rose-600">
            {error}
          </p>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 rounded-full border border-ink/15 py-3 text-sm font-semibold text-ink/70 transition-colors hover:bg-neutral-50"
          >
            Cancel
          </button>
          <motion.button
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="flex-1 rounded-full bg-ink py-3 text-sm font-semibold text-white transition-colors hover:bg-plum-600 disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save Changes"}
          </motion.button>
        </div>
      </form>
    </div>
  );
};

/* ────────────────────────────── Sub Components ──────────────────────────── */

const inputClass =
  "w-full rounded-xl border border-ink/10 bg-neutral-50 p-3 text-sm text-ink transition-colors focus:border-plum-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-plum-100";

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-ink/50">
      {label}
    </label>
    {children}
  </div>
);