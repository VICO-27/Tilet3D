import { useAuthStore } from "@/app/store/useAuthStore";
import authService from "../services/authService";
import type { UpdateProfilePayload } from "../types/auth";

export const useProfile = () => {
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);

  const updateProfile = async (
    data: UpdateProfilePayload
  ) => {
    const updatedProfile =
      await authService.updateProfile(data);

    if (user) {
      const updatedUser = {
        ...user,
        ...updatedProfile,
      };

      updateUser(updatedUser);
      authService.storeUser(updatedUser);
    }

    return updatedProfile;
  };

  return {
    user,
    updateProfile,
  };
};