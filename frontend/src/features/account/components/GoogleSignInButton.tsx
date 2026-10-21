// features/account/components/GoogleSignInButton.tsx
//
// Official Google Identity Services (GIS) Sign-In component.
// Compliant with Google Branding Guidelines and OAuth2 Security Standards.
//
// GIS flow:
//   1. Dynamically load the Google Identity Services script on mount.
//   2. Initialize GIS with VITE_GOOGLE_CLIENT_ID + credential callback.
//   3. Render Google's official Sign-In button via window.google.accounts.id.renderButton.
//   4. On user click, Google opens the account chooser modal without popup suppression.
//   5. Google executes our callback with a cryptographically signed ID token JWT.
//   6. Backend verifies the JWT against Google's public keys and signs the user in.
//
// SECURITY: The Google client SECRET is never present here or anywhere in the frontend.

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
  renderButton(
    parent: HTMLElement,
    options: {
      type?: "standard" | "icon";
      theme?: "outline" | "filled_blue" | "filled_black";
      size?: "large" | "medium" | "small";
      text?: "signin_with" | "signup_with" | "continue_with" | "signin";
      shape?: "rectangular" | "pill" | "circle" | "square";
      logo_alignment?: "left" | "center";
      width?: number;
      locale?: string;
    }
  ): void;
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
  /** Optional label override (unused with GIS renderButton standard layout). */
  label?: string;
  /** Optional custom class name */
  className?: string;
}

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  onSuccess,
}) => {
  const [scriptReady, setScriptReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const buttonContainerRef = useRef<HTMLDivElement>(null);
  const gisInitialized = useRef(false);

  const signInWithGoogle = useAuthStore((s) => s.signInWithGoogle);
  const storeError = useAuthStore((s) => s.error);
  const clearError = useAuthStore((s) => s.clearError);

  const displayError = localError ?? (storeError && !isLoading ? storeError : null);

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
      setLocalError("Unable to load Google Sign-In. Please check your connection or ad-blocker.");
    document.head.appendChild(script);
  }, []);

  // ── Initialize and render official Google Sign-In button ─────────────────
  useEffect(() => {
    if (!scriptReady || !window.google?.accounts?.id || !buttonContainerRef.current) return;
    if (!GOOGLE_CLIENT_ID) {
      setLocalError("Google Client ID is not configured (VITE_GOOGLE_CLIENT_ID).");
      return;
    }

    try {
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

      const renderGoogleBtn = () => {
        if (!buttonContainerRef.current || !window.google?.accounts?.id) return;
        buttonContainerRef.current.innerHTML = "";

        const containerWidth = buttonContainerRef.current.offsetWidth || 360;
        const buttonWidth = Math.min(Math.max(containerWidth, 220), 400);

        window.google.accounts.id.renderButton(buttonContainerRef.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          text: "continue_with",
          shape: "rectangular",
          logo_alignment: "left",
          width: buttonWidth,
        });
      };

      renderGoogleBtn();

      // Ambient One Tap for supported platforms
      try {
        window.google.accounts.id.prompt(() => {});
      } catch {
        // Silently catch One Tap prompt warnings
      }

      gisInitialized.current = true;

      const handleResize = () => {
        renderGoogleBtn();
      };
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    } catch (e) {
      console.error("GIS initialization error:", e);
    }
  }, [scriptReady, signInWithGoogle, onSuccess, clearError]);

  return (
    <div className="w-full space-y-2">
      <div className="relative w-full flex justify-center items-center min-h-[44px]">
        {/* Render container for Google Identity Services */}
        <div
          ref={buttonContainerRef}
          className="w-full flex justify-center [&>div]:w-full [&>div>iframe]:!w-full [&>div>iframe]:!max-w-[400px]"
          style={{ minHeight: "44px" }}
        />

        {/* Loading overlay when authenticating with backend */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-[14px] backdrop-blur-[1px] z-10">
            <div className="flex items-center gap-2.5 text-sm text-[#111111] font-medium">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-purple-200 border-t-purple-600 block" />
              <span>Verifying with Google…</span>
            </div>
          </div>
        )}

        {/* Fallback skeleton before script finishes loading */}
        {!scriptReady && !localError && (
          <div className="flex h-[44px] w-full items-center justify-center gap-3 rounded-[14px] border border-[#E8E5EC] bg-stone-50 px-4 text-[14px] font-medium text-[#686868] animate-pulse">
            <GoogleLogo />
            <span>Loading Google Sign-In…</span>
          </div>
        )}
      </div>

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
