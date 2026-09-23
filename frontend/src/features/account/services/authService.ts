import apiClient from "@/shared/api/apiClient";
import type {
  AuthUser,
  LoginPayload,
  LoginResponse,
  PasswordResetPayload,
  Profile,
  RegisterPayload,
  RegisterResponse,
  RequestOtpPayload,
  UpdateProfilePayload,
  VerifyOtpPayload,
} from "../types/auth";

const ACCESS_TOKEN_KEY = "tilet3d_access_token";
const REFRESH_TOKEN_KEY = "tilet3d_refresh_token";
const USER_KEY = "tilet3d_user";

// apiClient.baseURL is http://.../api — media files are served from the
// origin root, so strip the trailing /api to build a media base.
const API_ORIGIN = (apiClient.defaults.baseURL || "").replace(/\/api\/?$/, "");

class AuthService {
  // ==========================================================
  // REGISTER  (now returns tokens — auto-signs the user in)
  // ==========================================================
  async register(data: RegisterPayload): Promise<AuthUser> {
    const response = await apiClient.post<RegisterResponse>("/auth/register/", data);
    const { user, tokens } = response.data;

    localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access);
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh);

    const profile = await this.getProfile();
    return { ...user, ...profile };
  }

  // ==========================================================
  // LOGIN
  // ==========================================================
  async login(data: LoginPayload): Promise<AuthUser> {
    const response = await apiClient.post<LoginResponse>("/auth/login/", data);
    const { user, tokens } = response.data;

    localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access);
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh);

    const profile = await this.getProfile();
    return { ...user, ...profile };
  }

  // ==========================================================
  // GOOGLE LOGIN
  // Accepts a Google ID token (from GIS credential callback).
  // POSTs to /api/auth/google/ which verifies it server-side.
  // Returns the same AuthUser shape as email login — no parallel auth path.
  // NOTE: The Google client SECRET is never referenced here or anywhere in
  // the frontend — it stays backend-only by design.
  // ==========================================================
  async googleLogin(idToken: string): Promise<AuthUser> {
    const response = await apiClient.post<{ access: string; refresh: string; email: string; created: boolean }>(
      "/auth/google/",
      { token: idToken }
    );
    const { access, refresh, email } = response.data;

    localStorage.setItem(ACCESS_TOKEN_KEY, access);
    localStorage.setItem(REFRESH_TOKEN_KEY, refresh);

    // Build AuthUser from profile — Google-authed users are always verified
    // since they've authenticated via Google's own account system.
    const profile = await this.getProfile();
    const user: AuthUser = {
      ...profile,
      email,
      is_verified: true,
    };

    return user;
  }

  // ==========================================================
  // OTP: REQUEST / VERIFY
  // ==========================================================
  async requestOtp(payload: RequestOtpPayload): Promise<void> {
    await apiClient.post("/auth/otp/request/", payload);
  }

  async verifyOtp(payload: VerifyOtpPayload): Promise<void> {
    const response = await apiClient.post<{
      message: string;
      user?: { id: string; email: string; is_verified: boolean };
      tokens?: { access: string; refresh: string };
    }>("/auth/otp/verify/", payload);

    // The email_verify endpoint returns fresh JWT tokens so the user's
    // session starts fresh from verification time (not registration time).
    // Storing them here prevents the ~15-min stale-token expiry bug.
    if (response.data.tokens) {
      localStorage.setItem(ACCESS_TOKEN_KEY, response.data.tokens.access);
      localStorage.setItem(REFRESH_TOKEN_KEY, response.data.tokens.refresh);
    }
  }

  // ==========================================================
  // PASSWORD RESET
  // ==========================================================
  async resetPassword(payload: PasswordResetPayload): Promise<void> {
    await apiClient.post("/auth/password/reset/", payload);
  }

  // ==========================================================
  // PROFILE
  // ==========================================================
  async getProfile(): Promise<Profile> {
    const response = await apiClient.get<Profile>("/auth/profile/");
    return this.resolveAvatarUrl(response.data);
  }

  async updateProfile(data: UpdateProfilePayload): Promise<Profile> {
    const hasFile = data.avatar_image instanceof File;

    if (hasFile) {
      const form = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined) form.append(key, value as string | Blob);
      });

      const response = await apiClient.patch<Profile>("/auth/profile/", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return this.resolveAvatarUrl(response.data);
    }

    const response = await apiClient.patch<Profile>("/auth/profile/", data);
    return this.resolveAvatarUrl(response.data);
  }

  private resolveAvatarUrl(profile: Profile): Profile {
    if (profile.avatar_image && profile.avatar_image.startsWith("/")) {
      return { ...profile, avatar_image: `${API_ORIGIN}${profile.avatar_image}` };
    }
    return profile;
  }

  // ==========================================================
  // LOGOUT
  // ==========================================================
  async logout(): Promise<void> {
    const refresh = localStorage.getItem(REFRESH_TOKEN_KEY);

    if (refresh) {
      try {
        await apiClient.post("/auth/logout/", { refresh });
      } catch {
        // Ignore server logout errors
      }
    }

    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  // ==========================================================
  // LOCAL STORAGE
  // ==========================================================
  getStoredUser(): AuthUser | null {
    const user = localStorage.getItem(USER_KEY);
    return user ? (JSON.parse(user) as AuthUser) : null;
  }

  storeUser(user: AuthUser) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  clearStoredUser() {
    localStorage.removeItem(USER_KEY);
  }

  hasToken(): boolean {
    return !!localStorage.getItem(ACCESS_TOKEN_KEY);
  }
}

export default new AuthService();