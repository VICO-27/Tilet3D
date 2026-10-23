import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  KeyRound,
  RotateCw,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../../app/store/useAuthStore";
import { GoogleSignInButton } from "./GoogleSignInButton";
import { OtpInput } from "./OtpInput";

export type AuthMode = "login" | "register" | "verify" | "forgot-password";

interface LocationState {
  from?: string;
}

interface AuthScreenProps {
  initialMode?: AuthMode;
  onVerified?: () => void;
  onDismissVerify?: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  initialMode = "login",
  onVerified,
  onDismissVerify,
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  const user = useAuthStore((s) => s.user);
  const signIn = useAuthStore((s) => s.signIn);
  const signUp = useAuthStore((s) => s.signUp);
  const requestOtp = useAuthStore((s) => s.requestOtp);
  const verifyEmailOtp = useAuthStore((s) => s.verifyEmailOtp);
  const resetPassword = useAuthStore((s) => s.resetPassword);
  const signOut = useAuthStore((s) => s.signOut);
  const storeError = useAuthStore((s) => s.error);
  const clearError = useAuthStore((s) => s.clearError);

  // Flow & form state
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);

  const [email, setEmail] = useState(user?.email || "");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [localSuccess, setLocalSuccess] = useState<string | null>(null);

  // OTP resend cooldown timer
  const [resendCooldown, setResendCooldown] = useState(0);

  // Update mode when initialMode prop changes (e.g. from routes /login, /register)
  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  // Synchronize email if user becomes available in store (e.g. unverified user)
  useEffect(() => {
    if (user?.email && !email) {
      setEmail(user.email);
    }
  }, [user, email]);

  // Handle resend countdown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const clearAlerts = () => {
    setLocalError(null);
    setLocalSuccess(null);
    clearError();
  };

  const switchMode = (nextMode: AuthMode) => {
    clearAlerts();
    setMode(nextMode);
    setForgotStep(1);
    setOtpCode("");
  };

  const redirectAfterAuth = () => {
    const state = location.state as LocationState;
    navigate(state?.from || "/");
  };

  const handleGuest = () => {
    redirectAfterAuth();
  };

  // ── 1. LOGIN SUBMIT ──────────────────────────────────────────────────────────
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAlerts();

    if (!email.trim() || !password) {
      setLocalError("Please enter your email and password.");
      return;
    }

    setIsSubmitting(true);
    const err = await signIn(email.trim(), password);
    setIsSubmitting(false);

    if (err) {
      setLocalError(err);
    } else {
      const currentUser = useAuthStore.getState().user;
      if (currentUser && !currentUser.is_verified) {
        setResendCooldown(60);
        setLocalSuccess("Please enter the verification code sent to your email.");
        setMode("verify");
      } else {
        redirectAfterAuth();
      }
    }
  };

  // ── 2. REGISTER SUBMIT ───────────────────────────────────────────────────────
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAlerts();

    if (!email.trim()) {
      setLocalError("Please provide an email address.");
      return;
    }
    if (password.length < 8) {
      setLocalError("Password must be at least 8 characters long.");
      return;
    }
    if (password !== password2) {
      setLocalError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    const err = await signUp(email.trim(), password, password2);
    setIsSubmitting(false);

    if (err) {
      setLocalError(err);
    } else {
      const currentUser = useAuthStore.getState().user;
      if (currentUser?.is_verified) {
        setLocalSuccess("Account created successfully. Welcome to Tilet3D!");
        setTimeout(() => {
          if (onVerified) {
            onVerified();
          } else {
            redirectAfterAuth();
          }
        }, 600);
      } else {
        setResendCooldown(60);
        setLocalSuccess("Verification code sent to your email.");
        setMode("verify");
      }
    }
  };

  // ── 3. VERIFY OTP SUBMIT ─────────────────────────────────────────────────────
  const handleVerifyOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAlerts();

    const targetEmail = email.trim() || user?.email || "";
    if (otpCode.length !== 6) {
      setLocalError("Please enter the complete 6-digit verification code.");
      return;
    }

    setIsSubmitting(true);
    const err = await verifyEmailOtp(targetEmail, otpCode);
    setIsSubmitting(false);

    if (err) {
      setLocalError(err);
    } else {
      setLocalSuccess("Your email has been verified. Welcome to Tilet3D.");
      setTimeout(() => {
        if (onVerified) {
          onVerified();
        } else {
          redirectAfterAuth();
        }
      }, 1200);
    }
  };

  // ── 4. RESEND OTP ────────────────────────────────────────────────────────────
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || isSubmitting) return;
    clearAlerts();

    const targetEmail = email.trim() || user?.email || "";
    if (!targetEmail) {
      setLocalError("No email address found to send code.");
      return;
    }

    setIsSubmitting(true);
    const err = await requestOtp(targetEmail, "email_verify");
    setIsSubmitting(false);

    if (err) {
      setLocalError(err);
    } else {
      setLocalSuccess("A fresh 6-digit code has been dispatched to your inbox.");
      setResendCooldown(60);
    }
  };

  // ── 5. FORGOT PASSWORD (REQUEST CODE) ────────────────────────────────────────
  const handleForgotRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAlerts();

    if (!email.trim()) {
      setLocalError("Please enter your account email address.");
      return;
    }

    setIsSubmitting(true);
    const err = await requestOtp(email.trim(), "password_reset");
    setIsSubmitting(false);

    if (err) {
      setLocalError(err);
    } else {
      setForgotStep(2);
      setResendCooldown(60);
      setLocalSuccess(`Recovery code sent to ${email.trim()}.`);
    }
  };

  // ── 6. FORGOT PASSWORD (VERIFY & RESET) ──────────────────────────────────────
  const handleForgotResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAlerts();

    if (otpCode.length !== 6) {
      setLocalError("Please enter the 6-digit recovery code.");
      return;
    }
    if (newPassword.length < 8) {
      setLocalError("New password must be at least 8 characters long.");
      return;
    }

    setIsSubmitting(true);
    try {
      await resetPassword(email.trim(), otpCode, newPassword);
      setIsSubmitting(false);
      setLocalSuccess("Password updated successfully. Please sign in.");
      setTimeout(() => {
        switchMode("login");
      }, 1500);
    } catch {
      setIsSubmitting(false);
      setLocalError("Password reset failed. The code may be invalid or expired.");
    }
  };

  const activeError = localError;

  return (
    <div className="min-h-screen w-full bg-[#FAF9F7] flex flex-col lg:flex-row font-sans selection:bg-[#F3EEFF] selection:text-[#6D28D9]">
      {/* ───────────────────────────────────────────────────────────────────────────
          DESKTOP LEFT PANEL: Haute Couture Editorial (56% width)
      ─────────────────────────────────────────────────────────────────────────── */}
      <div className="hidden lg:block lg:w-[56%] xl:w-[58%] min-h-screen relative overflow-hidden bg-black select-none">
        {/* Editorial Fashion Campaign Image */}
        <img
          src="/images/auth-editorial.jpg"
          alt="Tilet3D Ethiopian Haute Couture Atelier"
          className="absolute inset-0 w-full h-full object-cover object-center filter brightness-[0.96] contrast-[1.04]"
        />

        {/* Sophisticated Editorial Chiaroscuro Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/35 to-black/50 pointer-events-none" />
        <div className="absolute inset-0 bg-radial-gradient from-transparent via-transparent to-black/40 pointer-events-none" />

        {/* Top-Left: Tilet3D Wordmark */}
        <div className="absolute top-10 left-10 xl:top-14 xl:left-14 z-20 flex items-center gap-3.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-[11px] bg-plum-600/95 backdrop-blur-md text-white font-black text-base shadow-xl border border-white/25">
            ጥ
          </span>
          <div className="flex flex-col">
            <span className="font-serif tracking-[0.28em] text-white text-lg uppercase font-normal leading-none">
              TILET3D
            </span>
            <span className="text-[9px] font-mono tracking-[0.34em] text-white/55 uppercase mt-1">
              Atelier Addis Ababa
            </span>
          </div>
        </div>

        {/* Bottom-Left: Editorial Typography & Copy */}
        <div className="absolute bottom-12 left-10 xl:bottom-16 xl:left-14 right-10 xl:right-16 z-20 max-w-xl">
          <p className="text-[10px] font-mono tracking-[0.35em] text-[#C4B5FD] uppercase font-semibold mb-3.5">
            ETHIOPIAN COUTURE · REIMAGINED
          </p>
          <h1 className="text-4xl xl:text-5xl font-light text-white tracking-tight leading-[1.14]">
            Tradition, tailored to you.
          </h1>
          <div className="w-12 h-[2px] bg-[#8B5CF6] my-4 rounded-full" />
          <p className="text-sm xl:text-[15px] text-white/80 font-light leading-relaxed max-w-md">
            Discover Ethiopian couture, find your perfect fit, and experience your next look in three dimensions.
          </p>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────────────────────
          MOBILE TOP HERO (approx. 28% of initial viewport)
      ─────────────────────────────────────────────────────────────────────────── */}
      <div className="lg:hidden h-[27vh] min-h-[190px] max-h-[240px] relative w-full overflow-hidden bg-black shrink-0 select-none">
        <img
          src="/images/auth-editorial.jpg"
          alt="Tilet3D Ethiopian Haute Couture"
          className="w-full h-full object-cover object-top filter brightness-[0.92]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/60 pointer-events-none" />

        {/* Mobile Top Bar */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-plum-600 text-white font-black text-xs shadow-md">
              ጥ
            </span>
            <span className="font-serif tracking-[0.24em] text-white text-xs uppercase font-light">
              TILET3D
            </span>
          </div>

          <button
            onClick={() => navigate("/")}
            className="text-white/80 hover:text-white text-[11px] font-medium tracking-wider flex items-center gap-1.5 bg-white/10 hover:bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/15 transition-all"
            aria-label="Back to store"
          >
            <ArrowLeft className="w-3 h-3" />
            <span>Store</span>
          </button>
        </div>

        {/* Mobile Editorial Tagline */}
        <div className="absolute bottom-3.5 left-4 right-4 z-10">
          <p className="text-[9px] font-mono tracking-[0.3em] text-[#C4B5FD] uppercase font-medium">
            ETHIOPIAN COUTURE · REIMAGINED
          </p>
          <h2 className="text-lg font-light text-white tracking-tight leading-tight mt-0.5">
            Tradition, tailored to you.
          </h2>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────────────────────
          RIGHT PANEL: Authentication Atelier (44% width on desktop)
      ─────────────────────────────────────────────────────────────────────────── */}
      <div className="lg:w-[44%] xl:w-[42%] flex-1 flex flex-col justify-between bg-[#FAF9F7] px-6 sm:px-12 xl:px-16 py-8 sm:py-12 overflow-y-auto min-h-full">
        {/* Top return action (desktop only) */}
        <div className="hidden lg:flex items-center justify-between w-full max-w-[420px] mx-auto mb-4">
          <button
            onClick={() => navigate("/")}
            className="group flex items-center gap-2 text-xs font-medium text-[#686868] hover:text-[#111111] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5 transition-transform duration-200 group-hover:-translate-x-0.5" />
            <span>Return to collection</span>
          </button>
          <span className="text-[10px] font-mono tracking-[0.25em] text-[#686868]/60 uppercase">
            ATELIER SIGN-IN
          </span>
        </div>

        {/* Main Authentication Container */}
        <div className="w-full max-w-[420px] mx-auto my-auto py-2 sm:py-6">
          <AnimatePresence mode="wait">
            {/* ──────────────────────────────────────────────────────────────────
                VIEW A: LOGIN
            ────────────────────────────────────────────────────────────────── */}
            {mode === "login" && (
              <motion.div
                key="login-screen"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="w-full"
              >
                {/* Eyebrow & Headline */}
                <div className="mb-6">
                  <span className="text-[10.5px] font-bold tracking-[0.26em] text-[#6D28D9] uppercase block mb-1.5">
                    YOUR PERSONAL ATELIER
                  </span>
                  <h2 className="text-3xl sm:text-[32px] font-light tracking-tight text-[#111111] leading-tight">
                    Welcome back.
                  </h2>
                  <p className="text-[14px] text-[#686868] font-normal mt-1.5">
                    Your next perfect fit is waiting.
                  </p>
                </div>

                {/* Google Sign-In Button */}
                <GoogleSignInButton
                  onSuccess={redirectAfterAuth}
                  label="Continue with Google"
                />

                {/* Subtle Divider */}
                <div className="my-5 flex items-center gap-3">
                  <div className="h-px flex-1 bg-[#E8E5EC]" />
                  <span className="text-[11px] font-medium uppercase tracking-wider text-[#686868]">
                    or continue with email
                  </span>
                  <div className="h-px flex-1 bg-[#E8E5EC]" />
                </div>

                {/* Feedback Alerts */}
                {activeError && (
                  <div
                    className="mb-4 rounded-[14px] bg-rose-50 border border-rose-200/60 p-3.5 text-xs text-rose-700 flex items-start gap-2.5 animate-in fade-in duration-200"
                    role="alert"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                    <span className="leading-relaxed">{activeError}</span>
                  </div>
                )}

                {/* Login Form */}
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div>
                    <label
                      htmlFor="login-email"
                      className="block text-xs font-semibold text-[#111111] uppercase tracking-wider mb-1.5"
                    >
                      Email address
                    </label>
                    <input
                      id="login-email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      required
                      className="h-[52px] w-full rounded-[14px] border border-[#E8E5EC] bg-white px-4 text-[14.5px] text-[#111111] placeholder:text-stone-300 transition-all duration-200 focus:border-[#6D28D9] focus:outline-none focus:ring-4 focus:ring-[#F3EEFF]"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label
                        htmlFor="login-password"
                        className="block text-xs font-semibold text-[#111111] uppercase tracking-wider"
                      >
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => switchMode("forgot-password")}
                        className="text-xs font-medium text-[#6D28D9] hover:text-[#5B21B6] transition-colors"
                      >
                        Forgot password?
                      </button>
                    </div>

                    <div className="relative">
                      <input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="h-[52px] w-full rounded-[14px] border border-[#E8E5EC] bg-white px-4 pr-11 text-[14.5px] text-[#111111] placeholder:text-stone-300 transition-all duration-200 focus:border-[#6D28D9] focus:outline-none focus:ring-4 focus:ring-[#F3EEFF]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors p-1"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="h-[52px] w-full rounded-[14px] bg-[#6D28D9] hover:bg-[#5B21B6] active:scale-[0.99] text-white font-medium text-[15px] shadow-sm transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white block" />
                        <span>Signing in…</span>
                      </>
                    ) : (
                      <span>Sign in</span>
                    )}
                  </button>
                </form>

                {/* Account Prompt & Guest Option */}
                <div className="mt-7 text-center space-y-3">
                  <p className="text-sm text-[#686868]">
                    New to Tilet3D?{" "}
                    <button
                      type="button"
                      onClick={() => switchMode("register")}
                      className="font-semibold text-[#111111] hover:text-[#6D28D9] transition-colors underline-offset-4 hover:underline"
                    >
                      Create an account
                    </button>
                  </p>

                  <div>
                    <button
                      type="button"
                      onClick={handleGuest}
                      className="text-xs text-[#686868] hover:text-[#111111] transition-colors underline-offset-4 hover:underline"
                    >
                      Continue as guest
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ──────────────────────────────────────────────────────────────────
                VIEW B: REGISTRATION
            ────────────────────────────────────────────────────────────────── */}
            {mode === "register" && (
              <motion.div
                key="register-screen"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="w-full"
              >
                {/* Eyebrow & Headline */}
                <div className="mb-6">
                  <span className="text-[10.5px] font-bold tracking-[0.26em] text-[#6D28D9] uppercase block mb-1.5">
                    WELCOME TO THE ATELIER
                  </span>
                  <h2 className="text-3xl sm:text-[32px] font-light tracking-tight text-[#111111] leading-tight">
                    Make it yours.
                  </h2>
                  <p className="text-[14px] text-[#686868] font-normal mt-1.5">
                    Create your account and discover a more personal way to wear Ethiopian couture.
                  </p>
                </div>

                {/* Google Sign-In Button */}
                <GoogleSignInButton
                  onSuccess={redirectAfterAuth}
                  label="Continue with Google"
                />

                {/* Subtle Divider */}
                <div className="my-5 flex items-center gap-3">
                  <div className="h-px flex-1 bg-[#E8E5EC]" />
                  <span className="text-[11px] font-medium uppercase tracking-wider text-[#686868]">
                    or register with email
                  </span>
                  <div className="h-px flex-1 bg-[#E8E5EC]" />
                </div>

                {/* Feedback Alerts */}
                {activeError && (
                  <div
                    className="mb-4 rounded-[14px] bg-rose-50 border border-rose-200/60 p-3.5 text-xs text-rose-700 flex items-start gap-2.5 animate-in fade-in duration-200"
                    role="alert"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                    <span className="leading-relaxed">{activeError}</span>
                  </div>
                )}

                {/* Registration Form */}
                <form onSubmit={handleRegisterSubmit} className="space-y-4">
                  <div>
                    <label
                      htmlFor="register-email"
                      className="block text-xs font-semibold text-[#111111] uppercase tracking-wider mb-1.5"
                    >
                      Email address
                    </label>
                    <input
                      id="register-email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      required
                      className="h-[52px] w-full rounded-[14px] border border-[#E8E5EC] bg-white px-4 text-[14.5px] text-[#111111] placeholder:text-stone-300 transition-all duration-200 focus:border-[#6D28D9] focus:outline-none focus:ring-4 focus:ring-[#F3EEFF]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="register-password"
                      className="block text-xs font-semibold text-[#111111] uppercase tracking-wider mb-1.5"
                    >
                      Password
                    </label>
                    <div className="relative">
                      <input
                        id="register-password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="At least 8 characters"
                        required
                        className="h-[52px] w-full rounded-[14px] border border-[#E8E5EC] bg-white px-4 pr-11 text-[14.5px] text-[#111111] placeholder:text-stone-300 transition-all duration-200 focus:border-[#6D28D9] focus:outline-none focus:ring-4 focus:ring-[#F3EEFF]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors p-1"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="register-password2"
                      className="block text-xs font-semibold text-[#111111] uppercase tracking-wider mb-1.5"
                    >
                      Confirm Password
                    </label>
                    <div className="relative">
                      <input
                        id="register-password2"
                        type={showPassword2 ? "text" : "password"}
                        autoComplete="new-password"
                        value={password2}
                        onChange={(e) => setPassword2(e.target.value)}
                        placeholder="Re-enter password"
                        required
                        className="h-[52px] w-full rounded-[14px] border border-[#E8E5EC] bg-white px-4 pr-11 text-[14.5px] text-[#111111] placeholder:text-stone-300 transition-all duration-200 focus:border-[#6D28D9] focus:outline-none focus:ring-4 focus:ring-[#F3EEFF]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword2(!showPassword2)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors p-1"
                        aria-label={showPassword2 ? "Hide password" : "Show password"}
                      >
                        {showPassword2 ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="h-[52px] w-full rounded-[14px] bg-[#6D28D9] hover:bg-[#5B21B6] active:scale-[0.99] text-white font-medium text-[15px] shadow-sm transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white block" />
                        <span>Creating account…</span>
                      </>
                    ) : (
                      <span>Create account</span>
                    )}
                  </button>
                </form>

                {/* Prompt to switch back to login */}
                <div className="mt-7 text-center space-y-3">
                  <p className="text-sm text-[#686868]">
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => switchMode("login")}
                      className="font-semibold text-[#111111] hover:text-[#6D28D9] transition-colors underline-offset-4 hover:underline"
                    >
                      Sign in
                    </button>
                  </p>

                  <div>
                    <button
                      type="button"
                      onClick={handleGuest}
                      className="text-xs text-[#686868] hover:text-[#111111] transition-colors underline-offset-4 hover:underline"
                    >
                      Continue as guest
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ──────────────────────────────────────────────────────────────────
                VIEW C: EMAIL OTP VERIFICATION
            ────────────────────────────────────────────────────────────────── */}
            {mode === "verify" && (
              <motion.div
                key="verify-screen"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="w-full text-center"
              >
                <div className="mx-auto mb-4 flex h-13 w-13 items-center justify-center rounded-2xl bg-[#F3EEFF] text-[#6D28D9]">
                  <ShieldCheck className="h-7 w-7" />
                </div>

                <div className="mb-6">
                  <span className="text-[10.5px] font-bold tracking-[0.26em] text-[#6D28D9] uppercase block mb-1">
                    EMAIL VERIFICATION
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-light tracking-tight text-[#111111]">
                    Verify your email.
                  </h2>
                  <p className="text-sm text-[#686868] mt-2">
                    Enter the 6-digit verification code sent to{" "}
                    <span className="font-semibold text-[#111111]">{email || user?.email}</span>
                  </p>
                </div>

                {/* Feedback Alerts */}
                {activeError && (
                  <div
                    className="mb-4 text-left rounded-[14px] bg-rose-50 border border-rose-200/60 p-3.5 text-xs text-rose-700 flex items-start gap-2.5 animate-in fade-in duration-200"
                    role="alert"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                    <span className="leading-relaxed">{activeError}</span>
                  </div>
                )}

                {localSuccess && (
                  <div
                    className="mb-4 text-left rounded-[14px] bg-emerald-50 border border-emerald-200/60 p-3.5 text-xs text-emerald-700 flex items-start gap-2.5 animate-in fade-in duration-200"
                    role="alert"
                  >
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500 mt-0.5" />
                    <span className="leading-relaxed">{localSuccess}</span>
                  </div>
                )}

                <form onSubmit={handleVerifyOtpSubmit} className="space-y-6">
                  <div className="py-2">
                    <OtpInput value={otpCode} onChange={setOtpCode} />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || otpCode.length !== 6}
                    className="h-[52px] w-full rounded-[14px] bg-[#6D28D9] hover:bg-[#5B21B6] active:scale-[0.99] text-white font-medium text-[15px] shadow-sm transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white block" />
                        <span>Verifying…</span>
                      </>
                    ) : (
                      <span>Verify email</span>
                    )}
                  </button>
                </form>

                <div className="mt-6 flex flex-col items-center gap-3">
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resendCooldown > 0 || isSubmitting}
                    className="text-xs font-semibold text-[#6D28D9] hover:text-[#5B21B6] disabled:text-[#686868]/60 transition-colors"
                  >
                    {resendCooldown > 0 ? (
                      `Resend code in ${resendCooldown}s`
                    ) : (
                      "Resend verification code"
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      if (onDismissVerify) {
                        onDismissVerify();
                      } else {
                        await signOut();
                        switchMode("login");
                      }
                    }}
                    className="text-xs text-[#686868] hover:text-[#111111] transition-colors"
                  >
                    Switch account or sign out
                  </button>
                </div>
              </motion.div>
            )}

            {/* ──────────────────────────────────────────────────────────────────
                VIEW D: FORGOT PASSWORD
            ────────────────────────────────────────────────────────────────── */}
            {mode === "forgot-password" && (
              <motion.div
                key="forgot-screen"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="w-full"
              >
                <div className="mb-6">
                  <span className="text-[10.5px] font-bold tracking-[0.26em] text-[#6D28D9] uppercase block mb-1.5">
                    PASSWORD RECOVERY
                  </span>
                  <h2 className="text-3xl font-light tracking-tight text-[#111111] leading-tight">
                    {forgotStep === 1 ? "Reset your password." : "Create new password."}
                  </h2>
                  <p className="text-[14px] text-[#686868] font-normal mt-1.5">
                    {forgotStep === 1
                      ? "Enter your account email and we'll dispatch a 6-digit recovery code."
                      : `Enter the 6-digit code dispatched to ${email} and your new password.`}
                  </p>
                </div>

                {/* Feedback Alerts */}
                {activeError && (
                  <div
                    className="mb-4 rounded-[14px] bg-rose-50 border border-rose-200/60 p-3.5 text-xs text-rose-700 flex items-start gap-2.5 animate-in fade-in duration-200"
                    role="alert"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                    <span className="leading-relaxed">{activeError}</span>
                  </div>
                )}

                {localSuccess && (
                  <div
                    className="mb-4 rounded-[14px] bg-emerald-50 border border-emerald-200/60 p-3.5 text-xs text-emerald-700 flex items-start gap-2.5 animate-in fade-in duration-200"
                    role="alert"
                  >
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500 mt-0.5" />
                    <span className="leading-relaxed">{localSuccess}</span>
                  </div>
                )}

                {forgotStep === 1 ? (
                  <form onSubmit={handleForgotRequestSubmit} className="space-y-4">
                    <div>
                      <label
                        htmlFor="forgot-email"
                        className="block text-xs font-semibold text-[#111111] uppercase tracking-wider mb-1.5"
                      >
                        Email address
                      </label>
                      <input
                        id="forgot-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@example.com"
                        required
                        className="h-[52px] w-full rounded-[14px] border border-[#E8E5EC] bg-white px-4 text-[14.5px] text-[#111111] placeholder:text-stone-300 transition-all duration-200 focus:border-[#6D28D9] focus:outline-none focus:ring-4 focus:ring-[#F3EEFF]"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="h-[52px] w-full rounded-[14px] bg-[#6D28D9] hover:bg-[#5B21B6] active:scale-[0.99] text-white font-medium text-[15px] shadow-sm transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white block" />
                          <span>Sending code…</span>
                        </>
                      ) : (
                        <span>Send recovery code</span>
                      )}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleForgotResetSubmit} className="space-y-4">
                    <div className="py-2">
                      <label className="block text-center text-xs font-semibold text-[#111111] uppercase tracking-wider mb-2">
                        6-Digit Recovery Code
                      </label>
                      <OtpInput value={otpCode} onChange={setOtpCode} />
                    </div>

                    <div>
                      <label
                        htmlFor="forgot-new-password"
                        className="block text-xs font-semibold text-[#111111] uppercase tracking-wider mb-1.5"
                      >
                        New Password
                      </label>
                      <div className="relative">
                        <input
                          id="forgot-new-password"
                          type={showNewPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="At least 8 characters"
                          required
                          className="h-[52px] w-full rounded-[14px] border border-[#E8E5EC] bg-white px-4 pr-11 text-[14.5px] text-[#111111] placeholder:text-stone-300 transition-all duration-200 focus:border-[#6D28D9] focus:outline-none focus:ring-4 focus:ring-[#F3EEFF]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors p-1"
                          aria-label={showNewPassword ? "Hide password" : "Show password"}
                        >
                          {showNewPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting || otpCode.length !== 6}
                      className="h-[52px] w-full rounded-[14px] bg-[#6D28D9] hover:bg-[#5B21B6] active:scale-[0.99] text-white font-medium text-[15px] shadow-sm transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white block" />
                          <span>Updating password…</span>
                        </>
                      ) : (
                        <span>Update password</span>
                      )}
                    </button>
                  </form>
                )}

                <div className="mt-6 text-center">
                  <button
                    type="button"
                    onClick={() => switchMode("login")}
                    className="text-xs font-semibold text-[#686868] hover:text-[#111111] transition-colors"
                  >
                    ← Back to sign in
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Discreet Footer Note */}
        <div className="w-full max-w-[420px] mx-auto pt-6 text-center">
          <p className="text-[11px] text-[#686868]/60 leading-relaxed">
            By proceeding, you agree to Tilet3D’s Bespoke Atelier Terms and acknowledge our Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
};
