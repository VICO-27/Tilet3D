// frontend/src/features/avatar/store/useAvatarStore.ts

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

const VALID_GENDERS: Gender[] = [
  'male',
  'female',
];

const VALID_BODY_TYPES: BodyType[] = [
  'slim',
  'athletic',
  'average',
  'plus',
  'inverted_triangle',
  'pear',
  'rectangle',
];

const VALID_SKIN_TONES: SkinTone[] = [
  'ivory',
  'fair',
  'light',
  'honey',
  'medium',
  'caramel',
  'tan',
  'chestnut',
  'rich',
  'espresso',
  'deep',
  'ebony',
];

// ─────────────────────────────────────────────────────────────────────────────
// Default avatar data
// ─────────────────────────────────────────────────────────────────────────────

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
// Numeric validation helper
// ─────────────────────────────────────────────────────────────────────────────

function safeNum(
  v: unknown,
  fallback: number,
  min: number,
  max: number,
): number {
  const n =
    typeof v === 'number'
      ? v
      : parseFloat(v as string);

  if (!Number.isFinite(n) || n < min || n > max) {
    return fallback;
  }

  return n;
}

// ─────────────────────────────────────────────────────────────────────────────
// Avatar sanitization
// ─────────────────────────────────────────────────────────────────────────────

function sanitize(
  raw: Record<string, unknown>,
  fb: AvatarData = DEFAULT,
): AvatarData {
  return {
    nickname:
      typeof raw.nickname === 'string'
        ? raw.nickname
        : fb.nickname,

    age: safeNum(
      raw.age,
      fb.age,
      1,
      120,
    ),

    gender:
      VALID_GENDERS.includes(raw.gender as Gender)
        ? (raw.gender as Gender)
        : fb.gender,

    body_type:
      VALID_BODY_TYPES.includes(raw.body_type as BodyType)
        ? (raw.body_type as BodyType)
        : fb.body_type,

    skin_tone:
      VALID_SKIN_TONES.includes(raw.skin_tone as SkinTone)
        ? (raw.skin_tone as SkinTone)
        : fb.skin_tone,

    height: safeNum(
      raw.height,
      fb.height,
      120,
      230,
    ),

    weight: safeNum(
      raw.weight,
      fb.weight,
      30,
      250,
    ),

    chest: safeNum(
      raw.chest,
      fb.chest,
      40,
      200,
    ),

    waist: safeNum(
      raw.waist,
      fb.waist,
      35,
      200,
    ),

    shoulder_width: safeNum(
      raw.shoulder_width,
      fb.shoulder_width,
      20,
      100,
    ),

    hips: safeNum(
      raw.hips,
      fb.hips,
      40,
      220,
    ),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Authentication
// ─────────────────────────────────────────────────────────────────────────────

const ACCESS_TOKEN_KEY = 'tilet3d_access_token';

function hasAuthToken(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  return Boolean(
    localStorage.getItem(ACCESS_TOKEN_KEY),
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Notification timer
// ─────────────────────────────────────────────────────────────────────────────

let notifTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleNotifClear(
  set: (
    partial: Partial<AvatarStore>,
  ) => void,
): void {
  if (notifTimer) {
    clearTimeout(notifTimer);
  }

  notifTimer = setTimeout(() => {
    set({
      notification: null,
      notificationType: null,
    });

    notifTimer = null;
  }, 4000);
}

// ─────────────────────────────────────────────────────────────────────────────
// Store interface
// ─────────────────────────────────────────────────────────────────────────────

interface AvatarStore extends AvatarState {
  hasAttemptedFetch: boolean;

  notification: string | null;

  notificationType:
    | 'success'
    | 'error'
    | 'info'
    | null;

  isInteracting: boolean;

  setAvatarData: (
    data: Partial<AvatarData>,
  ) => void;

  setAnimation: (
    animation: AnimationName,
  ) => void;

  setIsInteracting: (
    v: boolean,
  ) => void;

  fetchAvatar: () => Promise<void>;

  confirmAvatar: () => Promise<void>;

  enterEditMode: () => void;

  resetAvatar: () => Promise<void>;

  clearNotification: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Zustand store
// ─────────────────────────────────────────────────────────────────────────────

export const useAvatarStore =
  create<AvatarStore>((set, get) => ({

    // ────────────────────────────────────────────────────────────────────────
    // Initial avatar data
    // ────────────────────────────────────────────────────────────────────────

    ...DEFAULT,

    // ────────────────────────────────────────────────────────────────────────
    // Initial state
    // ────────────────────────────────────────────────────────────────────────

    isConfirmed: false,

    currentAnimation: 'idle',

    isLoading: false,

    hasAttemptedFetch: false,

    notification: null,

    notificationType: null,

    isInteracting: false,

    // ────────────────────────────────────────────────────────────────────────
    // Update avatar form data
    // ────────────────────────────────────────────────────────────────────────

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

        return sanitize(
          {
            ...current,
            ...data,
          } as Record<string, unknown>,
          current,
        );
      });
    },

    // ────────────────────────────────────────────────────────────────────────
    // Animation
    // ────────────────────────────────────────────────────────────────────────

    setAnimation: (
      animation,
    ) => {
      set({
        currentAnimation: animation,
      });
    },

    // ────────────────────────────────────────────────────────────────────────
    // Interaction state
    // ────────────────────────────────────────────────────────────────────────

    setIsInteracting: (
      v,
    ) => {
      set({
        isInteracting: v,
      });
    },

    // ────────────────────────────────────────────────────────────────────────
    // Fetch avatar profile
    // ────────────────────────────────────────────────────────────────────────

    fetchAvatar: async () => {

      if (
        get().hasAttemptedFetch ||
        get().isLoading
      ) {
        return;
      }

      set({
        hasAttemptedFetch: true,
        isLoading: true,
      });

      try {

        const res =
          await avatarApi.getProfile();

        const raw =
          res.data as unknown as Record<
            string,
            unknown
          >;

        const hasData =
          'height' in raw ||
          'weight' in raw ||
          'gender' in raw ||
          'nickname' in raw;

        if (hasData) {

          set({
            ...sanitize(raw),
            isConfirmed: true,
            currentAnimation: 'idle',
            isLoading: false,
          });

        } else {

          set({
            isConfirmed: false,
            isLoading: false,
          });

        }

      } catch {

        set({
          isConfirmed: false,
          currentAnimation: 'idle',
          isLoading: false,
        });

      }
    },

    // ────────────────────────────────────────────────────────────────────────
    // Confirm avatar
    // ────────────────────────────────────────────────────────────────────────

    confirmAvatar: async () => {

      if (get().isLoading) {
        return;
      }

      // ─────────────────────────────────────────────────────────────────────
      // Guest user
      //
      // Important:
      // The guest DOES NOT call the backend.
      //
      // The UI behaves like a confirmed avatar:
      //   1. Show sign-in notification.
      //   2. Collapse the form.
      //   3. Notification auto-hides.
      //   4. Edit Body reopens the form.
      if (!hasAuthToken()) {
        set({
          isConfirmed: true,
          isLoading: false,
          notification:
            'Previewing your avatar! Sign in to save these measurements permanently.',
          notificationType: 'info',
        });

        scheduleNotifClear(set);

        return;
      }

      // ─────────────────────────────────────────────────────────────────────
      // Authenticated user
      // ─────────────────────────────────────────────────────────────────────

      set({
        isLoading: true,
      });

      try {

        const state = get();

        const payload =
          sanitize({
            nickname: state.nickname,
            age: state.age,
            gender: state.gender,
            body_type: state.body_type,
            skin_tone: state.skin_tone,
            height: state.height,
            weight: state.weight,
            chest: state.chest,
            waist: state.waist,
            shoulder_width:
              state.shoulder_width,
            hips: state.hips,
          } as Record<string, unknown>);

        await avatarApi.saveProfile(
          payload,
        );

        set({
          ...payload,
          isConfirmed: true,
          currentAnimation: 'idle',
          isLoading: false,
          notification:
            'Measurements saved to your profile.',
          notificationType: 'success',
        });

        scheduleNotifClear(set);

      } catch (err) {

        const status = (
          err as {
            response?: {
              status?: number;
            };
          }
        ).response?.status;

        set({
          isLoading: false,

          notification:
            status === 401
              ? 'Your session has expired. Please sign in again.'
              : status === 500
                ? 'Server error. Please try again later.'
                : 'Failed to save avatar. Please try again.',

          notificationType: 'error',
        });

        scheduleNotifClear(set);
      }
    },

    // ────────────────────────────────────────────────────────────────────────
    // Edit avatar
    // ────────────────────────────────────────────────────────────────────────

    enterEditMode: () => {

      set({
        isConfirmed: false,
        currentAnimation: 'idle',
      });

    },

    // ────────────────────────────────────────────────────────────────────────
    // Reset avatar
    // ────────────────────────────────────────────────────────────────────────

    resetAvatar: async () => {

      try {

        await avatarApi.deleteProfile();

      } catch {

        // Profile may not exist.
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

    // ────────────────────────────────────────────────────────────────────────
    // Clear notification
    // ────────────────────────────────────────────────────────────────────────

    clearNotification: () => {

      if (notifTimer) {

        clearTimeout(
          notifTimer,
        );

        notifTimer = null;
      }

      set({
        notification: null,
        notificationType: null,
      });
    },

  }));