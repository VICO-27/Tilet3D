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
  signInWithGoogle: (idToken: string) => Promise<string | null>;
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
    status?: number;
    data?: Record<string, unknown> | string;
  };
}

function extractMessage(err: unknown, fallback: string): string {
  const e = err as AxiosErrorResponse;
  const data = e?.response?.data;
  if (!data) return fallback;

  // Sometimes DRF/Django returns a raw string or HTML (e.g. unhandled 500s)
  if (typeof data === "string") {
    return data.length < 200 ? data : fallback;
  }

  // detail / non_field_errors take priority
  if (typeof data.detail === "string") return data.detail;
  if (Array.isArray(data.non_field_errors) && data.non_field_errors.length) {
    return String(data.non_field_errors[0]);
  }

  // Otherwise grab the first error from whatever field DRF flagged
  for (const key of Object.keys(data)) {
    const value = data[key];
    if (Array.isArray(value) && value.length) {
      return String(value[0]);
    }
    if (typeof value === "string") {
      return value;
    }
  }

  return fallback;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: authService.getStoredUser(),
  loading: false,
  error: null,

  initialize: async () => {
    if (!authService.hasToken()) {
      set({ user: null });
      return;
    }

    try {
      set({ loading: true });
      const profile = await authService.getProfile();
      const current = authService.getStoredUser() || {};

      const user = { ...current, ...profile } as AuthUser;
      authService.storeUser(user);
      set({ user });
    } catch {
      await authService.logout();
      set({ user: null });
    } finally {
      set({ loading: false });
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

  signInWithGoogle: async (idToken) => {
    set({ loading: true, error: null });
    try {
      const user = await authService.googleLogin(idToken);
      authService.storeUser(user);
      set({ user });
      return null;
    } catch (err) {
      const message = extractMessage(err, "Google sign-in failed. Please try again.");
      set({ error: message });
      return message;
    } finally {
      set({ loading: false });
    }
  },

  signOut: async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.error("Error logging out from server:", err);
    } finally {
      // Complete client-side storage cleanup
      localStorage.removeItem("tilet3d_access_token");
      localStorage.removeItem("tilet3d_refresh_token");
      localStorage.removeItem("tilet3d_user");
      set({ user: null, error: null });
    }
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