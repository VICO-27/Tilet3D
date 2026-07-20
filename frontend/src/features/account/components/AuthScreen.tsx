// frontend/src/features/account/components/AuthScreen.tsx
// cspell:words Tilet Tilet3D
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, Ruler, Package, Heart, ArrowRight } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

interface AuthScreenProps {
  onSignUp: (email: string, password: string) => Promise<string | null>;
  onSignIn: (email: string, password: string) => Promise<string | null>;
}

// Define explicit shape for expected navigation states
interface LocationState {
  from?: string;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onSignUp, onSignIn }) => {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState<string | null>(null);

  const location = useLocation();
  const navigate = useNavigate();

  const submit = async () => {
    if (!form.email.trim()) return setError("Enter your email.");
    if (form.password.length < 4)
      return setError("Password must be at least 4 characters.");
    
    const err =
      mode === "up"
        ? await onSignUp(form.email, form.password)
        : await onSignIn(form.email, form.password);

    if (err) {
      setError(err);
    } else {
      setError(null);
      // Safely type cast the state using our defined interface instead of 'any'
      const state = location.state as LocationState;
      const fromPath = state?.from || "/";
      navigate(fromPath, { replace: true });
    }
  };

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
          <div className="mb-6 flex rounded-full bg-ink/[0.04] p-1">
            {(["in", "up"] as const).map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMode(m);
                  setError(null);
                }}
                className={`flex-1 rounded-full py-2.5 text-xs font-bold uppercase tracking-wider transition-colors ${
                  mode === m ? "bg-ink text-white" : "text-ink/50"
                }`}
              >
                {m === "in" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-3.5"
            >
              <h2 className="display text-2xl font-semibold text-ink">
                {mode === "in" ? "Welcome back" : "Create your account"}
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
                onEnter={submit}
              />

              {error && (
                <p className="rounded-xl bg-rose-50 py-2 text-center text-xs font-medium text-rose-600">
                  {error}
                </p>
              )}

              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={submit}
                className="mt-1 flex w-full items-center justify-center gap-2 rounded-full bg-ink py-3.5 text-sm font-semibold text-white transition-colors hover:bg-plum-600"
              >
                {mode === "in" ? "Sign In" : "Create Account"}
                <ArrowRight className="h-4 w-4" />
              </motion.button>
            </motion.div>
          </AnimatePresence>
        </div>
        <p className="mt-4 text-center text-xs text-ink/40">
          Secure authentication powered by Django & JWT.
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