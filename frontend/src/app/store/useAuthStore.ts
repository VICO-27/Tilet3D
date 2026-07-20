import { create } from "zustand";

import authService from "../../features/account/services/authService";
import type { AuthUser, OTPPurpose } from "../../features/account/types/auth";

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;

  initialize: () => Promise<void>;

  signUp: (email: string, password: string, password2: string) => Promise<string | null>;
  signIn: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;

  requestOtp: (email: string, purpose: OTPPurpose) => Promise<string | null>;
  verifyEmailOtp: (email: string, code: string) => Promise<string | null>;
  resetPassword: (email: string, code: string, newPassword: string) => Promise<string | null>;

  updateUser: (user: AuthUser) => void;
  clearError: () => void;
  isAuthenticated: () => boolean;
}

interface AxiosErrorResponse {
  response?: {
    data?: {
      detail?: string;
      email?: string[];
      code?: string[];
      password2?: string[];
      new_password?: string[];
      non_field_errors?: string[];
    };
  };
}

function extractMessage(err: unknown, fallback: string): string {
  const e = err as AxiosErrorResponse;
  return (
    e?.response?.data?.non_field_errors?.[0] ||
    e?.response?.data?.detail ||
    e?.response?.data?.email?.[0] ||
    e?.response?.data?.code?.[0] ||
    e?.response?.data?.password2?.[0] ||
    e?.response?.data?.new_password?.[0] ||
    fallback
  );
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: authService.getStoredUser(),
  loading: false,
  error: null,

  initialize: async () => {
    if (!authService.hasToken()) return;

    try {
      const profile = await authService.getProfile();
      const current = authService.getStoredUser();
      if (!current) return;

      const user = { ...current, ...profile };
      authService.storeUser(user);
      set({ user });
    } catch {
      await authService.logout();
      set({ user: null });
    }
  },

  signUp: async (email, password, password2) => {
    set({ loading: true, error: null });

    try {
      const user = await authService.register({ email, password, password2 });
      authService.storeUser(user);
      set({ user });
      return null;
    } catch (err) {
      const message = extractMessage(err, "Registration failed.");
      set({ error: message });
      return message;
    } finally {
      set({ loading: false });
    }
  },

  signIn: async (email, password) => {
    set({ loading: true, error: null });

    try {
      const user = await authService.login({ email, password });
      authService.storeUser(user);
      set({ user });
      return null;
    } catch (err) {
      const message = extractMessage(err, "Invalid email or password.");
      set({ error: message });
      return message;
    } finally {
      set({ loading: false });
    }
  },

  signOut: async () => {
    await authService.logout();
    set({ user: null, error: null });
  },

  requestOtp: async (email, purpose) => {
    set({ loading: true, error: null });
    try {
      await authService.requestOtp({ email, purpose });
      return null;
    } catch (err) {
      const message = extractMessage(err, "Could not send code.");
      set({ error: message });
      return message;
    } finally {
      set({ loading: false });
    }
  },

  verifyEmailOtp: async (email, code) => {
    set({ loading: true, error: null });
    try {
      await authService.verifyOtp({ email, code, purpose: "email_verify" });

      const current = get().user;
      if (current && current.email === email) {
        const user = { ...current, is_verified: true };
        authService.storeUser(user);
        set({ user });
      }
      return null;
    } catch (err) {
      const message = extractMessage(err, "Invalid or expired code.");
      set({ error: message });
      return message;
    } finally {
      set({ loading: false });
    }
  },

  resetPassword: async (email, code, newPassword) => {
    set({ loading: true, error: null });
    try {
      await authService.resetPassword({ email, code, new_password: newPassword });
      return null;
    } catch (err) {
      const message = extractMessage(err, "Could not reset password.");
      set({ error: message });
      return message;
    } finally {
      set({ loading: false });
    }
  },

  updateUser: (user) => {
    authService.storeUser(user);
    set({ user });
  },

  clearError: () => set({ error: null }),
  isAuthenticated: () => !!get().user,
}));