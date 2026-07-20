/**
 * ==========================================================
 * TILET3D AUTH TYPES
 * ==========================================================
 * Mirrors the Django authentication API.
 */

export type OTPPurpose = "email_verify" | "password_reset";

export interface User {
  id: string;
  email: string;
  is_verified: boolean;
}

export interface Profile {
  id: string;
  full_name: string | null;
  nickname: string | null;
  avatar_image: string | null;
  gender: string | null;
  body_type: string | null;
  skin_tone: string | null;

  created_at: string;
  updated_at: string;
}

export interface AuthUser extends User, Profile {}

export interface LoginResponse {
  user: User;
  tokens: {
    access: string;
    refresh: string;
  };
}

export interface RegisterResponse {
  user: User;
  tokens: {
    access: string;
    refresh: string;
  };
}

export interface RegisterPayload {
  email: string;
  password: string;
  password2: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface UpdateProfilePayload {
  full_name?: string;
  nickname?: string;
  gender?: string;
  body_type?: string;
  skin_tone?: string;
  avatar_image?: File;
}

export interface RequestOtpPayload {
  email: string;
  purpose: OTPPurpose;
}

export interface VerifyOtpPayload {
  email: string;
  code: string;
  purpose: OTPPurpose;
}

export interface PasswordResetPayload {
  email: string;
  code: string;
  new_password: string;
}