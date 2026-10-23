import React, { useState, useEffect, useCallback } from "react";
import {
  Settings,
  Shield,
  Server,
  Database,
  Cloud,
  CreditCard,
  Mail,
  Lock,
  RotateCw,
  AlertCircle,
  Clock,
  CheckCircle2,
  KeyRound,
  Zap,
} from "lucide-react";
import adminApi from "../api/adminApi";
import type { AdminSettingsResponse } from "../types/admin";
import AdminLayout from "../components/AdminLayout";
import AccessDenied from "../components/AccessDenied";
import { useAuthStore } from "@/app/store/useAuthStore";

interface AxiosLikeError {
  response?: {
    status?: number;
    data?: {
      detail?: string;
    };
  };
  message?: string;
}

export const AdminSettingsPage: React.FC = () => {
  const user = useAuthStore((s) => s.user);

  const [settingsData, setSettingsData] = useState<AdminSettingsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isForbidden, setIsForbidden] = useState(false);
  const [isTogglingOtp, setIsTogglingOtp] = useState(false);
  const [toggleSuccess, setToggleSuccess] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    setIsForbidden(false);

    try {
      const data = await adminApi.getSettings();
      setSettingsData(data);
    } catch (err: unknown) {
      const axiosErr = err as AxiosLikeError;
      if (axiosErr?.response?.status === 403) {
        setIsForbidden(true);
      } else {
        setError(
          axiosErr?.response?.data?.detail ||
            axiosErr?.message ||
            "Failed to load system settings telemetry."
        );
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const handleToggleOtp = async () => {
    if (!settingsData || isTogglingOtp) return;
    const currentVal = settingsData.security_policy?.otp_verification_enabled ?? true;
    const nextVal = !currentVal;

    setIsTogglingOtp(true);
    setToggleSuccess(null);
    setError(null);

    try {
      const updated = await adminApi.updateSettings({ otp_verification_enabled: nextVal });
      setSettingsData(updated);
      setToggleSuccess(
        nextVal
          ? "OTP verification enabled: New registrations and sign-ins will require a 6-digit email OTP."
          : "OTP verification disabled: Users can now register and sign in instantly without email OTP codes."
      );
      setTimeout(() => setToggleSuccess(null), 6000);
    } catch (err: unknown) {
      const axiosErr = err as AxiosLikeError;
      setError(axiosErr?.response?.data?.detail || "Failed to update OTP verification policy.");
    } finally {
      setIsTogglingOtp(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  if (isForbidden) {
    return <AccessDenied userEmail={user?.email} />;
  }

  return (
    <AdminLayout
      title="System Settings & Telemetry"
      subtitle="Operational environment status, third-party integrations, and security enforcement policies"
    >
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Security Notice */}
        <div className="p-4 rounded-xl bg-plum-500/[0.04] border border-plum-500/20 text-xs flex items-center gap-3 text-gray-300">
          <Shield className="w-5 h-5 text-plum-400 shrink-0" />
          <div>
            <span className="font-semibold text-white block">
              Zero-Trust Configuration Policy
            </span>
            <span>
              Private credentials, database secrets, and Chapa API keys are injected exclusively via cloud deployment variables (Render/Vercel) and are intentionally never rendered or editable in the browser.
            </span>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={fetchSettings}
              className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <RotateCw className="w-3.5 h-3.5" /> Retry
            </button>
          </div>
        )}

        {toggleSuccess && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-2.5 animate-fade-in shadow-lg shadow-emerald-950/20">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
            <span>{toggleSuccess}</span>
          </div>
        )}

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <RotateCw className="w-8 h-8 text-plum-400 animate-spin" />
            <p className="text-sm text-gray-400">Loading system telemetry...</p>
          </div>
        ) : settingsData ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Dynamic Security Policy: OTP Verification Control */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-plum-950/30 via-stone-900/60 to-black/80 border border-plum-500/30 backdrop-blur-md space-y-5 md:col-span-2 shadow-xl shadow-plum-950/20">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-plum-500/20 text-plum-300 border border-plum-500/30">
                      <KeyRound className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white tracking-tight">
                        Email OTP Verification Policy
                      </h3>
                      <p className="text-xs text-gray-400">
                        Enable or disable the 6-digit one-time password requirement on user registration and sign-in.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-start sm:self-auto shrink-0">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                      settingsData.security_policy?.otp_verification_enabled
                        ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.2)]"
                        : "bg-amber-500/15 text-amber-300 border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.2)]"
                    }`}
                  >
                    {settingsData.security_policy?.otp_verification_enabled ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" /> OTP REQUIRED
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-3.5 h-3.5" /> OTP BYPASSED
                      </>
                    )}
                  </span>

                  {/* Luxury Animated Toggle Switch */}
                  <button
                    type="button"
                    role="switch"
                    aria-checked={settingsData.security_policy?.otp_verification_enabled ?? true}
                    disabled={isTogglingOtp}
                    onClick={handleToggleOtp}
                    title={
                      settingsData.security_policy?.otp_verification_enabled
                        ? "Click to disable OTP verification"
                        : "Click to enable OTP verification"
                    }
                    className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-plum-500 focus:ring-offset-2 focus:ring-offset-stone-900 ${
                      settingsData.security_policy?.otp_verification_enabled
                        ? "bg-plum-600 hover:bg-plum-500"
                        : "bg-stone-700 hover:bg-stone-600"
                    } ${isTogglingOtp ? "opacity-60 cursor-not-allowed" : ""}`}
                  >
                    <span className="sr-only">Toggle OTP Verification</span>
                    <span
                      className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow-lg ring-0 transition duration-300 ease-in-out flex items-center justify-center ${
                        settingsData.security_policy?.otp_verification_enabled ? "translate-x-6" : "translate-x-0"
                      }`}
                    >
                      {isTogglingOtp ? (
                        <RotateCw className="w-3.5 h-3.5 text-stone-700 animate-spin" />
                      ) : settingsData.security_policy?.otp_verification_enabled ? (
                        <span className="w-2 h-2 rounded-full bg-plum-600" />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-stone-400" />
                      )}
                    </span>
                  </button>
                </div>
              </div>

              {/* Policy explanation cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs">
                <div
                  className={`p-3.5 rounded-xl border transition-all ${
                    settingsData.security_policy?.otp_verification_enabled
                      ? "bg-plum-500/[0.08] border-plum-500/40 text-gray-200"
                      : "bg-white/[0.02] border-white/5 text-gray-400 opacity-60"
                  }`}
                >
                  <div className="font-semibold text-white mb-1 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-plum-400" />
                    Strict Verification Mode (Active)
                  </div>
                  <p className="leading-relaxed">
                    New users receive a 6-digit verification code sent via email upon registration and unverified sign-in. Protects your store against fake accounts and spam.
                  </p>
                </div>

                <div
                  className={`p-3.5 rounded-xl border transition-all ${
                    !settingsData.security_policy?.otp_verification_enabled
                      ? "bg-amber-500/[0.08] border-amber-500/40 text-gray-200"
                      : "bg-white/[0.02] border-white/5 text-gray-400 opacity-60"
                  }`}
                >
                  <div className="font-semibold text-white mb-1 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    Instant Access Mode (Active)
                  </div>
                  <p className="leading-relaxed">
                    Users are automatically verified upon sign-up and sign-in. No email OTP is sent or required. Ideal for rapid testing, presentations, or frictionless onboarding.
                  </p>
                </div>
              </div>

              {settingsData.security_policy?.updated_at && (
                <div className="text-[11px] text-gray-500 flex items-center gap-1.5 pt-1">
                  <Clock className="w-3 h-3 text-gray-500" />
                  <span>
                    Policy last updated: {new Date(settingsData.security_policy.updated_at).toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            {/* Platform Identity */}
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm space-y-4">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                <Server className="w-4 h-4 text-plum-400" />
                Platform Runtime
              </h3>
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between py-1.5 border-b border-white/5">
                  <span className="text-gray-400">Application:</span>
                  <span className="text-white font-medium">
                    {settingsData.platform.app_name}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-white/5">
                  <span className="text-gray-400">Version:</span>
                  <span className="text-plum-300 font-mono font-medium">
                    {settingsData.platform.version}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-white/5">
                  <span className="text-gray-400">Deployment Environment:</span>
                  <span className="text-white font-medium">
                    {settingsData.platform.environment}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-white/5">
                  <span className="text-gray-400">Debug Mode:</span>
                  <span
                    className={`font-mono font-semibold ${
                      settingsData.platform.debug_mode
                        ? "text-amber-400"
                        : "text-emerald-400"
                    }`}
                  >
                    {settingsData.platform.debug_mode ? "ACTIVE (Dev)" : "DISABLED (Prod)"}
                  </span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-gray-400">Python Engine:</span>
                  <span className="text-gray-300 font-mono">
                    {settingsData.platform.python_version}
                  </span>
                </div>
              </div>
            </div>

            {/* Third-Party Integrations */}
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm space-y-4">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                <Cloud className="w-4 h-4 text-plum-400" />
                Active Integrations
              </h3>
              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Database className="w-3.5 h-3.5 text-gray-500" />
                    <span>Database:</span>
                  </div>
                  <span className="text-white font-medium">
                    {settingsData.integrations.database}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Cloud className="w-3.5 h-3.5 text-gray-500" />
                    <span>Media Storage:</span>
                  </div>
                  <span className="text-white font-medium">
                    {settingsData.integrations.media_storage}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                  <div className="flex items-center gap-2 text-gray-400">
                    <CreditCard className="w-3.5 h-3.5 text-gray-500" />
                    <span>Payment Gateway:</span>
                  </div>
                  <span className="text-white font-medium">
                    {settingsData.integrations.payment_gateway}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Mail className="w-3.5 h-3.5 text-gray-500" />
                    <span>Email & OTP:</span>
                  </div>
                  <span className="text-white font-medium">
                    {settingsData.integrations.email_delivery}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Lock className="w-3.5 h-3.5 text-gray-500" />
                    <span>Authentication:</span>
                  </div>
                  <span className="text-white font-medium">
                    {settingsData.integrations.auth_system}
                  </span>
                </div>
              </div>
            </div>

            {/* Operational Policies */}
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm space-y-4 md:col-span-2">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-plum-400" />
                Store Security Policies
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                  <span className="text-gray-400 block">Token Rotation</span>
                  <span className="text-emerald-400 font-semibold block">
                    {settingsData.operational_policy.token_refresh_rotation}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                  <span className="text-gray-400 block">Currency Standard</span>
                  <span className="text-white font-mono font-semibold block">
                    {settingsData.operational_policy.currency} (Ethiopian Birr)
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                  <span className="text-gray-400 block">Staff Role Enforcement</span>
                  <span className="text-emerald-400 font-semibold block">
                    {settingsData.operational_policy.admin_role_enforcement}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                  <span className="text-gray-400 block">Payment Immutability</span>
                  <span className="text-emerald-400 font-semibold block">
                    {settingsData.operational_policy.payment_status_mutation}
                  </span>
                </div>
              </div>
              <div className="pt-2 text-[11px] text-gray-500 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-gray-500" />
                <span>Synchronized server time: {new Date(settingsData.server_time).toUTCString()}</span>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </AdminLayout>
  );
};

export default AdminSettingsPage;
