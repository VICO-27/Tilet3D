import apiClient from '../../../shared/api/apiClient';
import { AvatarData } from '../types/avatar.types';

export const avatarApi = {
  getProfile: () => apiClient.get<AvatarData>('/avatars/me/'),
  saveProfile: (data: AvatarData) => apiClient.post<AvatarData>('/avatars/me/', data),
};