// features/account/components/GoogleSignInButton.tsx
//
// Custom "Continue with Google" button following Google's branding guidelines
// (official G logo + "Continue with Google" text) adapted to the site's
// luxury ink/white aesthetic.
//
// GIS flow:
//   1. Dynamically load the Google Identity Services script on mount.
//   2. Initialize GIS with the public VITE_GOOGLE_CLIENT_ID + a credential callback.
//   3. On button click, call google.accounts.id.prompt() → Google One Tap overlay.
//   4. Google calls our callback with a signed ID token (credential JWT).
//   5. We call signInWithGoogle(idToken) from the auth store which POSTs to
//      /api/auth/google/ and merges the result into the unified auth state.
//
// SECURITY: The Google client SECRET is never referenced here.
// Only the public client ID is used — this is intentional per Google's design.

import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { AlertCircle } from "lucide-react";
import { useAuthStore } from "../../../app/store/useAuthStore";

// ─── Google GIS type declarations ────────────────────────────────────────────
interface GISNotification {
  isNotDisplayed(): boolean;
  isSkippedMoment(): boolean;
}

interface GoogleAccountsId {
  initialize(config: {
    client_id: string;
    callback: (response: { credential: string }) => void;
    auto_select?: boolean;
    cancel_on_tap_outside?: boolean;
  }): void;
  prompt(notification?: (n: GISNotification) => void): void;
}

declare global {
  interface Window {
    google?: { accounts: { id: GoogleAccountsId } };
  }
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string;
const GIS_SRC = "https://accounts.google.com/gsi/client";

// ─── Official Google "G" SVG logo ────────────────────────────────────────────
const GoogleLogo: React.FC = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 18 18"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    focusable="false"
  >
    <path
      d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908C16.658 14.083 17.64 11.775 17.64 9.2z"
      fill="#4285F4"
    />
    <path
      d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
      fill="#34A853"
    />
    <path
      d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"
      fill="#FBBC05"
    />
    <path
      d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z"
      fill="#EA4335"
    />
  </svg>
);

interface GoogleSignInButtonProps {
  /** Called on successful authentication — parent handles redirect. */
  onSuccess: () => void;
  /** Optional label override. */
  label?: string;
}

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  onSuccess,
  label = "Continue with Google",
}) => {
  const [scriptReady, setScriptReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const gisInitialized = useRef(false);

  const signInWithGoogle = useAuthStore((s) => s.signInWithGoogle);
  const storeError = useAuthStore((s) => s.error);
  const clearError = useAuthStore((s) => s.clearError);

  // Show store errors (backend rejection) in the button's own error slot.
  const displayError = localError ?? (storeError && isLoading === false ? storeError : null);

  // ── Load GIS script ──────────────────────────────────────────────────────
  useEffect(() => {
    if (window.google?.accounts?.id) {
      setScriptReady(true);
      return;
    }

    const existingScript = document.getElementById("gis-script");
    if (existingScript) {
      existingScript.addEventListener("load", () => setScriptReady(true));
      return;
    }

    const script = document.createElement("script");
    script.id = "gis-script";
    script.src = GIS_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => setScriptReady(true);
    script.onerror = () =>
      setLocalError("Failed to load Google Sign-In. Check your connection.");
    document.head.appendChild(script);
  }, []);

  // ── Initialize GIS once script is ready ─────────────────────────────────
  useEffect(() => {
    if (!scriptReady || gisInitialized.current || !window.google?.accounts?.id) return;

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      auto_select: false,
      cancel_on_tap_outside: true,
      callback: async ({ credential }) => {
        setIsLoading(true);
        setLocalError(null);
        clearError();

        const err = await signInWithGoogle(credential);

        setIsLoading(false);

        if (err) {
          setLocalError(err);
        } else {
          onSuccess();
        }
      },
    });

    gisInitialized.current = true;
  }, [scriptReady, signInWithGoogle, onSuccess, clearError]);

  // ── Button click → trigger Google One Tap prompt ─────────────────────────
  const handleClick = () => {
    if (!window.google?.accounts?.id || !gisInitialized.current) {
      setLocalError("Google Sign-In is loading… please try again in a moment.");
      return;
    }

    setLocalError(null);
    clearError();

    window.google.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        // One Tap was suppressed (user dismissed it too many times in the
        // past 24 h, or third-party cookies are blocked). Inform user.
        setLocalError(
          "Google sign-in popup was blocked. Try again or use email & password."
        );
      }
    });
  };

  const isDisabled = isLoading || !scriptReady;

  return (
    <div className="w-full space-y-2.5">
      <motion.button
        id="google-signin-btn"
        type="button"
        onClick={handleClick}
        disabled={isDisabled}
        whileTap={{ scale: isDisabled ? 1 : 0.98 }}
        className="relative flex w-full items-center justify-center gap-3 rounded-full border border-ink/10 bg-white py-3 text-sm font-semibold text-ink shadow-sm transition-all hover:border-ink/20 hover:bg-neutral-50 hover:shadow disabled:cursor-not-allowed disabled:opacity-50"
        aria-label={label}
      >
        <span className="shrink-0 flex h-[18px] w-[18px] items-center justify-center">
          {isLoading ? (
            <span className="h-[16px] w-[16px] animate-spin rounded-full border-[1.5px] border-ink/20 border-t-ink/60 block" />
          ) : (
            <GoogleLogo />
          )}
        </span>
        <span>{isLoading ? "Signing in…" : label}</span>
      </motion.button>

      {displayError && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-2.5 text-xs font-medium text-rose-600"
          role="alert"
        >
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {displayError}
        </motion.div>
      )}
    </div>
  );
};
