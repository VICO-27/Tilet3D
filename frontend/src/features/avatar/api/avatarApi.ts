import apiClient from '../../../shared/api/apiClient';
import type { AvatarData } from '../types/avatar.types';

export const avatarApi = {
  /** Fetch the current user's avatar profile. Returns 404 if none exists. */
  getProfile: () => apiClient.get<AvatarData>('/avatars/me/'),

  /** Create or fully replace the avatar profile (upsert via POST). */
  saveProfile: (data: AvatarData) => apiClient.post<AvatarData>('/avatars/me/', data),

  /** Partial update — used by edit mode. */
  patchProfile: (data: Partial<AvatarData>) => apiClient.patch<AvatarData>('/avatars/me/', data),

  /** Delete/reset the avatar profile. */
  deleteProfile: () => apiClient.delete('/avatars/me/'),
};
