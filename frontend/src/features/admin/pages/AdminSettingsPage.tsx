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

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <RotateCw className="w-8 h-8 text-plum-400 animate-spin" />
            <p className="text-sm text-gray-400">Loading system telemetry...</p>
          </div>
        ) : settingsData ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
