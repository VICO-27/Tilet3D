import React, { useState } from "react";
import { type AuthUser } from "../types/auth";

interface ProfileEditorProps {
  user: AuthUser;
  onCancel: () => void;
  onSave: (updatedData: Partial<AuthUser>) => Promise<void>;
}

export const ProfileEditor: React.FC<ProfileEditorProps> = ({ user, onCancel, onSave }) => {
  const [fullName, setFullName] = useState(user.full_name || "");
  const [nickname, setNickname] = useState(user.nickname || "");
  const [loading, setLoading] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave({ full_name: fullName, nickname });
      onCancel();
    } catch (err) {
      console.error("Failed to update profile", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-[600px] px-6 pb-20 pt-[100px]">
      <h2 className="display mb-6 text-2xl font-semibold text-ink">Edit Profile</h2>
      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-ink/50 mb-1">
            Full Name
          </label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full rounded-xl border border-ink/10 bg-neutral-50 p-3 text-sm text-ink focus:outline-none focus:border-plum-500 focus:bg-white"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-ink/50 mb-1">
            Nickname
          </label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className="w-full rounded-xl border border-ink/10 bg-neutral-50 p-3 text-sm text-ink focus:outline-none focus:border-plum-500 focus:bg-white"
          />
        </div>
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 rounded-full border border-ink/15 py-3 text-sm font-semibold text-ink/70 hover:bg-neutral-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 rounded-full bg-ink py-3 text-sm font-semibold text-white hover:bg-plum-600 disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
};