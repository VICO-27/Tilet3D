import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, CheckCircle2 } from "lucide-react";
import { useAuthStore } from "../../../app/store/useAuthStore";
import { OtpInput } from "./OtpInput";

interface VerifyEmailScreenProps {
  onDone?: () => void;
}

export const VerifyEmailScreen: React.FC<VerifyEmailScreenProps> = ({ onDone }) => {
  const { user, verifyEmailOtp, requestOtp, error, loading, clearError } = useAuthStore();
  const [otp, setOtp] = useState("");
  const [sent, setSent] = useState(false);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    if (user?.email) requestOtp(user.email, "email_verify").then(() => setSent(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!user) return null;

  const submit = async () => {
    if (otp.length !== 6) return;
    const err = await verifyEmailOtp(user.email, otp);
    if (!err) {
      setVerified(true);
      setTimeout(() => onDone?.(), 1800);
    }
  };

  const resend = () => {
    clearError();
    requestOtp(user.email, "email_verify").then(() => setSent(true));
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 pt-[68px] text-center">
      <AnimatePresence mode="wait">
        {verified ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="w-full rounded-[26px] border border-ink/[0.07] bg-white p-10 shadow-2xl shadow-ink/5"
          >
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 14, delay: 0.1 }}
              className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"
            >
              <CheckCircle2 className="h-7 w-7" />
            </motion.span>
            <h2 className="display text-2xl font-semibold text-ink">You're verified</h2>
            <p className="mt-2 text-sm text-ink/50">
              Welcome in — setting up your workspace now.
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="w-full rounded-[26px] border border-ink/[0.07] bg-white p-8 shadow-2xl shadow-ink/5"
          >
            <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-plum-50 text-plum-600">
              <ShieldCheck className="h-6 w-6" />
            </span>
            <h2 className="display text-2xl font-semibold text-ink">Verify your email</h2>
            <p className="mt-2 text-sm text-ink/50">
              {sent ? `We sent a code to ${user.email}` : "Sending code..."}
            </p>

            <div className="mt-6">
              <OtpInput value={otp} onChange={setOtp} />
            </div>

            {error && (
              <p className="mt-4 rounded-xl bg-rose-50 py-2 text-center text-xs font-medium text-rose-600">
                {error}
              </p>
            )}

            <button
              onClick={submit}
              disabled={loading || otp.length !== 6}
              className="mt-5 w-full rounded-full bg-ink py-3.5 text-sm font-semibold text-white transition-colors hover:bg-plum-600 disabled:opacity-50"
            >
              {loading ? "Verifying..." : "Verify Email"}
            </button>

            <button
              onClick={resend}
              disabled={loading}
              className="mt-3 text-xs font-medium text-ink/45 transition-colors hover:text-plum-600"
            >
              Resend code
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};