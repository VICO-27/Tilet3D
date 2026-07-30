import { create } from 'zustand';

import {
  AvatarState,
  AvatarData,
  BodyType,
  Gender,
  SkinTone,
} from '../types/avatar.types';

import { avatarApi } from '../api/avatarApi';

interface AvatarStore extends AvatarState {
  hasAttempted: boolean;
  notification: string | null;
  notificationType: 'success' | 'error' | null;
  isInteracting: boolean;

  setIsInteracting: (value: boolean) => void;
  setAvatarData: (data: Partial<AvatarData>) => void;
  confirmAvatar: () => Promise<void>;
  setAnimation: (
    animation: 'idle' | 'walk' | 'spin'
  ) => void;
  enterEditMode: () => void;
  fetchAvatar: () => Promise<void>;
  clearNotification: () => void;
}

const DEFAULT_AVATAR_DATA: AvatarData = {
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
  'fair',
  'light',
  'medium',
  'tan',
  'rich',
  'deep',
];

const parseSafeNumber = (
  value: unknown,
  fallback: number,
  minimum: number,
  maximum: number
): number => {
  const parsed =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
        ? Number.parseFloat(value)
        : Number.NaN;

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  if (parsed < minimum || parsed > maximum) {
    return fallback;
  }

  return parsed;
};

const extractAvatarPayload = (
  responseData: unknown
): Record<string, unknown> | null => {
  if (
    !responseData ||
    typeof responseData !== 'object' ||
    Array.isArray(responseData)
  ) {
    return null;
  }

  const response = responseData as Record<
    string,
    unknown
  >;

  if (
    response.avatar &&
    typeof response.avatar === 'object' &&
    !Array.isArray(response.avatar)
  ) {
    return response.avatar as Record<string, unknown>;
  }

  if (
    response.data &&
    typeof response.data === 'object' &&
    !Array.isArray(response.data)
  ) {
    return response.data as Record<string, unknown>;
  }

  return response;
};

const sanitizeAvatarData = (
  raw: Record<string, unknown>,
  fallback: AvatarData = DEFAULT_AVATAR_DATA
): AvatarData => {
  const gender = VALID_GENDERS.includes(
    raw.gender as Gender
  )
    ? (raw.gender as Gender)
    : fallback.gender;

  const bodyType = VALID_BODY_TYPES.includes(
    raw.body_type as BodyType
  )
    ? (raw.body_type as BodyType)
    : fallback.body_type;

  const skinTone = VALID_SKIN_TONES.includes(
    raw.skin_tone as SkinTone
  )
    ? (raw.skin_tone as SkinTone)
    : fallback.skin_tone;

  return {
    nickname:
      typeof raw.nickname === 'string'
        ? raw.nickname
        : fallback.nickname,

    age: parseSafeNumber(
      raw.age,
      fallback.age,
      1,
      120
    ),

    gender,
    body_type: bodyType,
    skin_tone: skinTone,

    height: parseSafeNumber(
      raw.height,
      fallback.height,
      120,
      230
    ),

    weight: parseSafeNumber(
      raw.weight,
      fallback.weight,
      30,
      250
    ),

    chest: parseSafeNumber(
      raw.chest,
      fallback.chest,
      40,
      200
    ),

    waist: parseSafeNumber(
      raw.waist,
      fallback.waist,
      35,
      200
    ),

    shoulder_width: parseSafeNumber(
      raw.shoulder_width,
      fallback.shoulder_width,
      20,
      100
    ),

    hips: parseSafeNumber(
      raw.hips,
      fallback.hips,
      40,
      220
    ),
  };
};

let notificationTimer:
  | ReturnType<typeof setTimeout>
  | null = null;

const scheduleNotificationClear = (
  set: (
    partial:
      | Partial<AvatarStore>
      | ((
          state: AvatarStore
        ) => Partial<AvatarStore>)
  ) => void
): void => {
  if (notificationTimer) {
    clearTimeout(notificationTimer);
  }

  notificationTimer = setTimeout(() => {
    set({
      notification: null,
      notificationType: null,
    });

    notificationTimer = null;
  }, 4000);
};

export const useAvatarStore =
  create<AvatarStore>((set, get) => ({
    ...DEFAULT_AVATAR_DATA,

    isConfirmed: false,
    currentAnimation: 'idle',
    isLoading: false,
    hasAttempted: false,
    notification: null,
    notificationType: null,
    isInteracting: false,

    setIsInteracting: (value) => {
      set({ isInteracting: value });
    },

    setAvatarData: (data) => {
      set((state) => {
        const currentAvatarData: AvatarData = {
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

        const sanitized = sanitizeAvatarData(
          {
            ...currentAvatarData,
            ...data,
          },
          currentAvatarData
        );

        return sanitized;
      });
    },

    confirmAvatar: async () => {
      if (get().isLoading) {
        return;
      }

      set({ isLoading: true });

      try {
        const state = get();

        const currentData: AvatarData = {
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

        const payload = sanitizeAvatarData(
          currentData as unknown as Record<
            string,
            unknown
          >
        );

        await avatarApi.saveProfile(payload);

        set({
          ...payload,
          isConfirmed: true,
          currentAnimation: 'idle',
          notification:
            'Measurements securely saved to your profile.',
          notificationType: 'success',
        });

        scheduleNotificationClear(set);
      } catch (error) {
        console.error(
          'Backend avatar save failed:',
          error
        );

        const apiError = error as {
          response?: {
            status?: number;
          };
        };

        set({
          notification:
            apiError.response?.status === 500
              ? 'Server error. Check the backend configuration.'
              : 'Failed to save the avatar. Please try again.',
          notificationType: 'error',
        });

        scheduleNotificationClear(set);
      } finally {
        set({ isLoading: false });
      }
    },

    setAnimation: (animation) => {
      set({ currentAnimation: animation });
    },

    enterEditMode: () => {
      set({
        isConfirmed: false,
        currentAnimation: 'idle',
      });
    },

    fetchAvatar: async () => {
      if (get().hasAttempted) {
        return;
      }

      set({
        hasAttempted: true,
        isLoading: true,
      });

      try {
        const response =
          await avatarApi.getProfile();

        const payload = extractAvatarPayload(
          response.data
        );

        if (!payload) {
          throw new Error(
            'The avatar API returned an invalid payload.'
          );
        }

        /*
         * Do not treat an empty object as a saved profile.
         */
        const hasAvatarProfile =
          'height' in payload ||
          'weight' in payload ||
          'gender' in payload ||
          'nickname' in payload;

        if (!hasAvatarProfile) {
          return;
        }

        const normalizedData =
          sanitizeAvatarData(payload);

        set({
          ...normalizedData,
          isConfirmed: true,
          currentAnimation: 'idle',
        });
      } catch (error) {
        /*
         * A missing avatar profile is acceptable for a new user.
         * Keep the safe defaults and display the calibration form.
         */
        console.info(
          'No saved avatar profile was loaded.',
          error
        );

        set({
          isConfirmed: false,
          currentAnimation: 'idle',
        });
      } finally {
        set({ isLoading: false });
      }
    },

    clearNotification: () => {
      if (notificationTimer) {
        clearTimeout(notificationTimer);
        notificationTimer = null;
      }

      set({
        notification: null,
        notificationType: null,
      });
    },
  }));