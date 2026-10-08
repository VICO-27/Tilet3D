import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Ruler, Package, Heart, Mail, ArrowRight, User } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { GoogleSignInButton } from "./GoogleSignInButton";

interface LocationState {
  from?: string;
}

export const AuthScreen: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const redirectIfVerified = () => {
    const state = location.state as LocationState;
    navigate(state?.from || "/");
  };

  const handleGuest = () => {
    redirectIfVerified();
  };

  return (
    <div className="flex min-h-screen bg-stone-50">
      {/* LEFT: Branding / Features (Hidden on mobile) */}
      <div className="hidden w-[40%] flex-col justify-between bg-ink p-12 text-white lg:flex">
        <div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-plum-600 text-sm font-black shadow-lg">
            ጥ
          </div>
          <h1 className="display mt-10 text-4xl leading-tight">
            Step into the future of<br />Habesha couture.
          </h1>
        </div>

        <div className="space-y-6">
          <Feature icon={<Ruler />} title="Save your 3D avatar" text="Get pixel-perfect sizing on every order." />
          <Feature icon={<Package />} title="Track atelier progress" text="Real-time updates from sketch to delivery." />
          <Feature icon={<Heart />} title="Curate your collection" text="Save and share your favorite styles." />
        </div>
      </div>

      {/* RIGHT: Auth Box */}
      <div className="flex flex-1 items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-[380px]">
          {/* Mobile Logo */}
          <div className="mb-10 flex h-10 w-10 items-center justify-center rounded-lg bg-plum-600 text-sm font-black text-white shadow-lg lg:hidden">
            ጥ
          </div>

          <h2 className="display mb-2 text-2xl font-semibold text-ink">Welcome to Tilet3D</h2>
          <p className="mb-8 text-sm text-ink/60">Log in or create an account to continue.</p>

          <div className="space-y-3">
            {/* 1. Google (Active) */}
            <GoogleSignInButton
              onSuccess={redirectIfVerified}
              label="Continue with Google"
            />

            {/* 2. Apple (Coming Soon) */}
            <AuthButton
              icon={
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16.365 21.43c-1.39.954-2.822.997-4.113.064-1.282-.934-2.618-1.02-4.047-.07-2.612 1.705-5.362-2.128-6.326-4.71-1.34-3.61-.836-8.232 2.7-10.22 1.455-.815 3.018-.742 4.167.062 1.15.79 1.787.87 2.898.136 1.43-.923 3.036-.723 4.298.3 2.115 1.748 1.41 4.542.84 5.385-1.558.74-2.164 2.924-.707 4.385 1.05 1.056 2.502 1.258 2.502 1.258-.088.36-1.127 2.47-2.212 3.41zM14.996 5.86c-1.352 1.572-3.415 1.583-3.69.015-.054-.316.035-.744.257-1.144.59-1.042 1.734-1.74 2.802-1.79.055.334-.022.784-.253 1.2-.284.5-.783 1.186-1.116 1.719z" />
                </svg>
              }
              label="Continue with Apple"
              disabled
            />

            {/* 3. Facebook (Coming Soon) */}
            <AuthButton
              icon={
                <svg className="h-5 w-5 text-[#1877F2]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              }
              label="Continue with Facebook"
              disabled
            />

            {/* 4. Email / OTP (Coming Soon) */}
            <AuthButton
              icon={<Mail className="h-5 w-5 text-ink/70" />}
              label="Continue with Email / OTP"
              disabled
            />

            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-ink/10" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-ink/40">or</span>
              <div className="h-px flex-1 bg-ink/10" />
            </div>

            {/* 5. As Guest (Active) */}
            <button
              onClick={handleGuest}
              className="flex w-full items-center justify-center gap-3 rounded-full border border-ink/20 bg-white py-3.5 px-4 text-sm font-semibold text-ink transition-all hover:bg-stone-50 hover:border-ink/30 active:scale-[0.98]"
            >
              <User className="h-5 w-5 text-ink/60" />
              Continue as Guest
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const AuthButton = ({ icon, label, disabled }: { icon: React.ReactNode; label: string; disabled?: boolean }) => (
  <button
    disabled={disabled}
    className={`group relative flex w-full items-center justify-center gap-3 rounded-full border border-ink/20 bg-white py-3.5 px-4 text-sm font-semibold text-ink transition-all ${
      disabled ? "opacity-60 cursor-not-allowed" : "hover:bg-stone-50 hover:border-ink/30 active:scale-[0.98]"
    }`}
  >
    <div className="absolute left-4 flex h-5 w-5 items-center justify-center">
      {icon}
    </div>
    {label}
    {disabled && (
      <span className="absolute right-4 rounded-md bg-stone-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-stone-500">
        Coming Soon
      </span>
    )}
  </button>
);

const Feature = ({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) => (
  <div className="flex gap-4">
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10">
      {icon}
    </div>
    <div>
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-white/60">{text}</p>
    </div>
  </div>
);
