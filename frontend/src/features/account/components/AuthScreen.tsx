// features/account/components/AuthScreen.tsx
// cspell:words Tilet Tilet3D
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, Ruler, Package, Heart, ArrowRight } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../../app/store/useAuthStore";
import { OtpInput } from "./OtpInput";
import { BackButton } from "./BackButton";

type Step = "in" | "up" | "forgot-email" | "forgot-otp" | "forgot-password";

interface LocationState {
  from?: string;
}

export const AuthScreen: React.FC = () => {
  const [step, setStep] = useState<Step>("in");
  const [form, setForm] = useState({ email: "", password: "", password2: "" });
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [localMsg, setLocalMsg] = useState<string | null>(null);

  const { signIn, signUp, requestOtp, resetPassword, error, loading, clearError } = useAuthStore();

  const location = useLocation();
  const navigate = useNavigate();

  const goto = (s: Step) => {
    clearError();
    setLocalMsg(null);
    setStep(s);
  };

  const submitAuth = async () => {
    if (!form.email.trim()) return;

    if (step === "up") {
      if (form.password !== form.password2) {
        setLocalMsg("Passwords do not match.");
        return;
      }
      const err = await signUp(form.email, form.password, form.password2);
      if (!err) redirectIfVerified();
      return;
    }

    const err = await signIn(form.email, form.password);
    if (!err) redirectIfVerified();
  };

  const redirectIfVerified = () => {
    const user = useAuthStore.getState().user;
    if (user?.is_verified) {
      redirectHome();
    }
    // Note: If unverified, stay mounted. AccountPage detects !user.is_verified 
    // and swaps the view directly to VerifyEmailScreen.
  };

  const redirectHome = () => {
    const state = location.state as LocationState;
    navigate(state?.from || "/", { replace: true });
  };

  const submitForgotEmail = async () => {
    if (!form.email.trim()) return;
    const err = await requestOtp(form.email, "password_reset");
    if (!err) goto("forgot-otp");
  };

  const submitForgotOtp = () => {
    if (otp.length !== 6) {
      setLocalMsg("Enter the 6-digit code.");
      return;
    }
    setLocalMsg(null);
    goto("forgot-password");
  };

  const submitNewPassword = async () => {
    if (newPassword.length < 8) {
      setLocalMsg("Password must be at least 8 characters.");
      return;
    }
    const err = await resetPassword(form.email, otp, newPassword);
    if (!err) {
      setLocalMsg("Password updated — sign in below.");
      setOtp("");
      setNewPassword("");
      goto("in");
    }
  };

  const displayError = error || localMsg;

  return (
    <div className="mx-auto grid min-h-screen max-w-[1400px] grid-cols-1 items-center gap-12 px-6 pt-[68px] md:px-10 lg:grid-cols-2">
      {/* Editorial side */}
      <div className="hidden lg:block">
        <span className="text-[11px] font-semibold uppercase tracking-[0.35em] text-plum-600">
          Your Atelier Account
        </span>
        <h1 className="display mt-5 text-5xl font-semibold leading-[1.02] text-ink">
          Your measurements,
          <br />
          <span className="italic text-plum-600">remembered.</span>
        </h1>
        <p className="mt-6 max-w-md text-lg leading-relaxed text-ink/55">
          Save your 3D avatar, track bespoke orders, and keep the pieces you love
          — all in one place.
        </p>
        <div className="mt-10 flex gap-8">
          <Perk icon={<Ruler className="h-5 w-5" />} label="Saved avatar" />
          <Perk icon={<Package className="h-5 w-5" />} label="Order tracking" />
          <Perk icon={<Heart className="h-5 w-5" />} label="Saved pieces" />
        </div>
      </div>

      {/* Form card */}
      <div className="mx-auto w-full max-w-md">
        <div className="rounded-[26px] border border-ink/[0.07] bg-white p-8 shadow-2xl shadow-ink/5">
          {(step === "in" || step === "up") && (
            <>
              <BackButton onClick={() => navigate("/")} label="Back to shop" />
              <div className="mb-6 flex rounded-full bg-ink/[0.04] p-1">
                {(["in", "up"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => {
                      setForm({ email: "", password: "", password2: "" });
                      goto(m);
                    }}
                    className={`flex-1 rounded-full py-2.5 text-xs font-bold uppercase tracking-wider transition-colors ${
                      step === m ? "bg-ink text-white" : "text-ink/50"
                    }`}
                  >
                    {m === "in" ? "Sign In" : "Sign Up"}
                  </button>
                ))}
              </div>
            </>
          )}

          <AnimatePresence mode="wait">
            {/* ---------------- SIGN IN / SIGN UP ---------------- */}
            {(step === "in" || step === "up") && (
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-3.5"
              >
                <h2 className="display text-2xl font-semibold text-ink">
                  {step === "in" ? "Welcome back" : "Create your account"}
                </h2>

                <InputRow
                  icon={<Mail className="h-4 w-4" />}
                  placeholder="Email"
                  type="email"
                  value={form.email}
                  onChange={(v) => setForm({ ...form, email: v })}
                />
                <InputRow
                  icon={<Lock className="h-4 w-4" />}
                  placeholder="Password"
                  type="password"
                  value={form.password}
                  onChange={(v) => setForm({ ...form, password: v })}
                  onEnter={submitAuth}
                />
                {step === "up" && (
                  <InputRow
                    icon={<Lock className="h-4 w-4" />}
                    placeholder="Confirm password"
                    type="password"
                    value={form.password2}
                    onChange={(v) => setForm({ ...form, password2: v })}
                    onEnter={submitAuth}
                  />
                )}

                {step === "in" && (
                  <button
                    type="button"
                    onClick={() => goto("forgot-email")}
                    className="block text-right text-xs font-medium text-ink/45 transition-colors hover:text-plum-600"
                  >
                    Forgot password?
                  </button>
                )}

                {displayError && <ErrorMsg text={displayError} />}

                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={submitAuth}
                  disabled={loading}
                  className="mt-1 flex w-full items-center justify-center gap-2 rounded-full bg-ink py-3.5 text-sm font-semibold text-white transition-colors hover:bg-plum-600 disabled:opacity-50"
                >
                  {loading ? "Please wait..." : step === "in" ? "Sign In" : "Create Account"}
                  {!loading && <ArrowRight className="h-4 w-4" />}
                </motion.button>
              </motion.div>
            )}

            {/* ---------------- FORGOT: EMAIL ---------------- */}
            {step === "forgot-email" && (
              <motion.div
                key="forgot-email"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-3.5"
              >
                <BackButton onClick={() => goto("in")} />
                <h2 className="display text-2xl font-semibold text-ink">Reset your password</h2>
                <p className="text-sm text-ink/50">We'll send a 6-digit code to your email.</p>

                <InputRow
                  icon={<Mail className="h-4 w-4" />}
                  placeholder="Email"
                  type="email"
                  value={form.email}
                  onChange={(v) => setForm({ ...form, email: v })}
                  onEnter={submitForgotEmail}
                />

                {displayError && <ErrorMsg text={displayError} />}

                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={submitForgotEmail}
                  disabled={loading}
                  className="mt-1 flex w-full items-center justify-center gap-2 rounded-full bg-ink py-3.5 text-sm font-semibold text-white transition-colors hover:bg-plum-600 disabled:opacity-50"
                >
                  {loading ? "Sending..." : "Send Code"}
                </motion.button>
              </motion.div>
            )}

            {/* ---------------- FORGOT: OTP ---------------- */}
            {step === "forgot-otp" && (
              <motion.div
                key="forgot-otp"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <BackButton onClick={() => goto("forgot-email")} />
                <h2 className="display text-2xl font-semibold text-ink">Enter the code</h2>
                <p className="text-sm text-ink/50">Sent to {form.email}</p>

                <OtpInput value={otp} onChange={setOtp} />

                {displayError && <ErrorMsg text={displayError} />}

                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={submitForgotOtp}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-ink py-3.5 text-sm font-semibold text-white transition-colors hover:bg-plum-600"
                >
                  Continue
                </motion.button>

                <button
                  type="button"
                  onClick={submitForgotEmail}
                  disabled={loading}
                  className="w-full text-center text-xs font-medium text-ink/45 transition-colors hover:text-plum-600"
                >
                  Resend code
                </button>
              </motion.div>
            )}

            {/* ---------------- FORGOT: NEW PASSWORD ---------------- */}
            {step === "forgot-password" && (
              <motion.div
                key="forgot-password"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-3.5"
              >
                <BackButton onClick={() => goto("forgot-otp")} />
                <h2 className="display text-2xl font-semibold text-ink">Set a new password</h2>

                <InputRow
                  icon={<Lock className="h-4 w-4" />}
                  placeholder="New password"
                  type="password"
                  value={newPassword}
                  onChange={setNewPassword}
                  onEnter={submitNewPassword}
                />

                {displayError && <ErrorMsg text={displayError} />}

                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={submitNewPassword}
                  disabled={loading}
                  className="mt-1 flex w-full items-center justify-center gap-2 rounded-full bg-ink py-3.5 text-sm font-semibold text-white transition-colors hover:bg-plum-600 disabled:opacity-50"
                >
                  {loading ? "Saving..." : "Update Password"}
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <p className="mt-4 text-center text-xs text-ink/40">
          Secure authentication powered by Django &amp; JWT.
        </p>
      </div>
    </div>
  );
};

/* ────────────────────────────── Sub Components ──────────────────────────── */

const InputRow: React.FC<{
  icon: React.ReactNode;
  placeholder: string;
  value: string;
  type?: string;
  onChange: (v: string) => void;
  onEnter?: () => void;
}> = ({ icon, placeholder, value, type = "text", onChange, onEnter }) => (
  <div className="relative">
    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/35">
      {icon}
    </span>
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => e.key === "Enter" && onEnter?.()}
      className="w-full rounded-xl border border-ink/10 bg-neutral-50 py-3 pl-10 pr-4 text-sm text-ink placeholder-ink/35 transition-colors focus:border-plum-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-plum-100"
    />
  </div>
);

const Perk: React.FC<{ icon: React.ReactNode; label: string }> = ({ icon, label }) => (
  <div className="flex flex-col items-center gap-2 text-center">
    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-plum-50 text-plum-600">
      {icon}
    </span>
    <span className="text-xs font-medium text-ink/55">{label}</span>
  </div>
);

const ErrorMsg: React.FC<{ text: string }> = ({ text }) => (
  <p className="rounded-xl bg-rose-50 py-2 text-center text-xs font-medium text-rose-600">{text}</p>
);