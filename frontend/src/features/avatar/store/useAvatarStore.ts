import { create } from 'zustand';
import { avatarApi } from '../api/avatarApi';
import type {
  AvatarState,
  AvatarData,
  Gender,
  BodyType,
  SkinTone,
  AnimationName,
} from '../types/avatar.types';

// ─────────────────────────────────────────────────────────────────────────────
// Validation constants
// ─────────────────────────────────────────────────────────────────────────────
const VALID_GENDERS: Gender[] = ['male', 'female'];
const VALID_BODY_TYPES: BodyType[] = [
  'slim', 'athletic', 'average', 'plus', 'inverted_triangle', 'pear', 'rectangle',
];
const VALID_SKIN_TONES: SkinTone[] = ['fair', 'light', 'medium', 'tan', 'rich', 'deep'];

const DEFAULT: AvatarData = {
  nickname: '',
  age: 25,
  gender: 'male',
  body_type: 'average',
  skin_tone: 'medium',
  height: 170,
  weight: 70,
  chest: 90,
  waist: 80,
  shoulder_width: 45,
  hips: 95,
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function safeNum(v: unknown, fallback: number, min: number, max: number): number {
  const n = typeof v === 'number' ? v : parseFloat(v as string);
  if (!isFinite(n) || n < min || n > max) return fallback;
  return n;
}

function sanitize(raw: Record<string, unknown>, fb: AvatarData = DEFAULT): AvatarData {
  return {
    nickname: typeof raw.nickname === 'string' ? raw.nickname : fb.nickname,
    age: safeNum(raw.age, fb.age, 1, 120),
    gender: VALID_GENDERS.includes(raw.gender as Gender) ? (raw.gender as Gender) : fb.gender,
    body_type: VALID_BODY_TYPES.includes(raw.body_type as BodyType) ? (raw.body_type as BodyType) : fb.body_type,
    skin_tone: VALID_SKIN_TONES.includes(raw.skin_tone as SkinTone) ? (raw.skin_tone as SkinTone) : fb.skin_tone,
    height: safeNum(raw.height, fb.height, 120, 230),
    weight: safeNum(raw.weight, fb.weight, 30, 250),
    chest: safeNum(raw.chest, fb.chest, 40, 200),
    waist: safeNum(raw.waist, fb.waist, 35, 200),
    shoulder_width: safeNum(raw.shoulder_width, fb.shoulder_width, 20, 100),
    hips: safeNum(raw.hips, fb.hips, 40, 220),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Notification timer — module-level but explicitly cleared on each mutation
// ─────────────────────────────────────────────────────────────────────────────
let notifTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleNotifClear(set: (p: Partial<AvatarStore>) => void) {
  if (notifTimer) clearTimeout(notifTimer);
  notifTimer = setTimeout(() => {
    set({ notification: null, notificationType: null });
    notifTimer = null;
  }, 4000);
}

// ─────────────────────────────────────────────────────────────────────────────
// Store shape
// ─────────────────────────────────────────────────────────────────────────────
interface AvatarStore extends AvatarState {
  // Extra UI state
  hasAttemptedFetch: boolean;
  notification: string | null;
  notificationType: 'success' | 'error' | null;
  isInteracting: boolean;

  // Actions
  setAvatarData: (data: Partial<AvatarData>) => void;
  setAnimation: (animation: AnimationName) => void;
  setIsInteracting: (v: boolean) => void;

  fetchAvatar: () => Promise<void>;
  confirmAvatar: () => Promise<void>;
  enterEditMode: () => void;
  resetAvatar: () => Promise<void>;
  clearNotification: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Store
// ─────────────────────────────────────────────────────────────────────────────
export const useAvatarStore = create<AvatarStore>((set, get) => ({
  // Avatar data — flat into the store so AvatarModel can subscribe to slices
  ...DEFAULT,

  // Status flags
  isConfirmed: false,
  currentAnimation: 'idle',
  isLoading: false,
  hasAttemptedFetch: false,
  notification: null,
  notificationType: null,
  isInteracting: false,

  // ── setAvatarData ──────────────────────────────────────────────────────────
  setAvatarData: (data) => {
    set((state) => {
      const current: AvatarData = {
        nickname: state.nickname,
        age: state.age,
        gender: state.gender,
        body_type: state.body_type,
        skin_tone: state.skin_tone,
        height: state.height,
        weight: state.weight,
        chest: state.chest,
        waist: state.waist,
        shoulder_width: state.shoulder_width,
        hips: state.hips,
      };
      return sanitize({ ...current, ...data } as Record<string, unknown>, current);
    });
  },

  // ── setAnimation ──────────────────────────────────────────────────────────
  setAnimation: (animation) => set({ currentAnimation: animation }),

  // ── setIsInteracting ──────────────────────────────────────────────────────
  setIsInteracting: (v) => set({ isInteracting: v }),

  // ── fetchAvatar ───────────────────────────────────────────────────────────
  // FIX: uses hasAttemptedFetch (not hasAttempted) and resets correctly on
  // navigation — the guard only prevents duplicate concurrent fetches, not
  // re-fetches after the user navigates away and back.
  fetchAvatar: async () => {
    if (get().hasAttemptedFetch || get().isLoading) return;

    // Single set() call — prevents multiple Zustand notifications
    set({ hasAttemptedFetch: true, isLoading: true });

    try {
      const res = await avatarApi.getProfile();
      const raw = res.data as unknown as Record<string, unknown>;

      const hasData =
        'height' in raw || 'weight' in raw || 'gender' in raw || 'nickname' in raw;

      if (hasData) {
        set({
          ...sanitize(raw),
          isConfirmed: true,
          currentAnimation: 'idle',
          isLoading: false,
        });
      } else {
        set({ isConfirmed: false, isLoading: false });
      }
    } catch {
      // 404 means a new user — show the calibration form
      set({ isConfirmed: false, currentAnimation: 'idle', isLoading: false });
    }
  },

  // ── confirmAvatar ─────────────────────────────────────────────────────────
  confirmAvatar: async () => {
    if (get().isLoading) return;
    set({ isLoading: true });

    try {
      const s = get();
      const payload = sanitize({
        nickname: s.nickname, age: s.age, gender: s.gender,
        body_type: s.body_type, skin_tone: s.skin_tone,
        height: s.height, weight: s.weight, chest: s.chest,
        waist: s.waist, shoulder_width: s.shoulder_width, hips: s.hips,
      } as Record<string, unknown>);

      await avatarApi.saveProfile(payload);

      set({
        ...payload,
        isConfirmed: true,
        currentAnimation: 'idle',
        isLoading: false,
        notification: 'Measurements saved to your profile.',
        notificationType: 'success',
      });
      scheduleNotifClear(set);
    } catch (err) {
      const status = (err as { response?: { status?: number } }).response?.status;
      set({
        isLoading: false,
        notification:
          status === 500
            ? 'Server error. Please try again later.'
            : 'Failed to save avatar. Please try again.',
        notificationType: 'error',
      });
      scheduleNotifClear(set);
    }
  },

  // ── enterEditMode ──────────────────────────────────────────────────────────
  enterEditMode: () => set({ isConfirmed: false, currentAnimation: 'idle' }),

  // ── resetAvatar ────────────────────────────────────────────────────────────
  resetAvatar: async () => {
    try {
      await avatarApi.deleteProfile();
    } catch {
      // Ignore — profile may not exist yet
    }
    set({
      ...DEFAULT,
      isConfirmed: false,
      currentAnimation: 'idle',
      hasAttemptedFetch: false,
      notification: null,
      notificationType: null,
    });
  },

  // ── clearNotification ─────────────────────────────────────────────────────
  clearNotification: () => {
    if (notifTimer) { clearTimeout(notifTimer); notifTimer = null; }
    set({ notification: null, notificationType: null });
  },
}));
