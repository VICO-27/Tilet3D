import React, { useState } from "react";
import {
  ShieldCheck,
  Lock,
  Smartphone,
  Laptop,
  CheckCircle2,
  AlertTriangle,
  LogOut,
  KeyRound,
  Eye,
  EyeOff,
  History,
  Trash2,
  Clock,
} from "lucide-react";

interface Session {
  id: string;
  device: string;
  location: string;
  ip: string;
  lastActive: string;
  isCurrent: boolean;
}

interface ActivityLog {
  id: string;
  event: string;
  date: string;
  ip: string;
}

interface SecuritySettingProps {
  sessions?: Session[];
  securityLogs?: ActivityLog[];
  onDeleteAccount?: () => Promise<void>;
  onChangePassword?: (data: { currentPass: string; newPass: string }) => Promise<void>;
  onRevokeSessions?: () => Promise<void>;
}

export const SecuritySetting: React.FC<SecuritySettingProps> = ({
  sessions = [],
  securityLogs = [],
  onDeleteAccount,
  onChangePassword,
  onRevokeSessions,
}) => {
  // Password State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);

  // Status States
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Delete Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Password Change Handler
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (newPassword.length < 8) {
      setFeedback({ type: "error", message: "New password must be at least 8 characters long." });
      return;
    }

    if (newPassword !== confirmPassword) {
      setFeedback({ type: "error", message: "New passwords do not match." });
      return;
    }

    setLoading(true);

    try {
      if (onChangePassword) {
        await onChangePassword({ currentPass: currentPassword, newPass: newPassword });
      }
      setFeedback({ type: "success", message: "Your password has been updated successfully." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      let errorMessage = "Failed to update password. Please check current password.";

      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === "object" && err !== null && "response" in err) {
        const responseErr = err as { response?: { data?: { detail?: string } } };
        if (responseErr.response?.data?.detail) {
          errorMessage = responseErr.response.data.detail;
        }
      }

      setFeedback({
        type: "error",
        message: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle Real Account Deletion
  const handleConfirmDelete = async () => {
    setDeleting(true);
    try {
      if (onDeleteAccount) {
        await onDeleteAccount();
      }
    } catch {
      alert("Failed to delete account. Please try again or contact support.");
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-10">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-ink/[0.06] pb-6">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-plum-50 text-plum-600">
          <ShieldCheck className="h-5 w-5" />
        </span>
        <div>
          <h3 className="display text-xl font-semibold text-ink">Password & Security</h3>
          <p className="text-xs text-ink/45">Manage your credentials, active sessions, and security activity.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* LEFT COLUMN: Password Change */}
        <section className="rounded-2xl border border-ink/[0.06] bg-neutral-50/50 p-6 space-y-5">
          <div className="flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-ink/60" />
            <h4 className="text-sm font-semibold text-ink">Change Password</h4>
          </div>

          {feedback && (
            <div
              className={`flex items-center gap-2 rounded-xl p-3 text-xs font-medium ${
                feedback.type === "success"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-rose-50 text-rose-700 border border-rose-200"
              }`}
            >
              {feedback.type === "success" ? (
                <CheckCircle2 className="h-4 w-4 shrink-0" />
              ) : (
                <AlertTriangle className="h-4 w-4 shrink-0" />
              )}
              {feedback.message}
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <Field label="Current Password">
              <input
                type={showPasswords ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className={inputClass}
                required
              />
            </Field>

            <Field label="New Password">
              <input
                type={showPasswords ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={inputClass}
                placeholder="At least 8 characters"
                required
              />
            </Field>

            <Field label="Confirm New Password">
              <input
                type={showPasswords ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={inputClass}
                required
              />
            </Field>

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => setShowPasswords(!showPasswords)}
                className="flex items-center gap-1.5 text-xs text-ink/50 hover:text-ink transition-colors"
              >
                {showPasswords ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                {showPasswords ? "Hide Passwords" : "Show Passwords"}
              </button>

              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 rounded-full bg-ink px-6 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-plum-600 disabled:opacity-50"
              >
                <Lock className="h-3.5 w-3.5" />
                {loading ? "Updating..." : "Update Password"}
              </button>
            </div>
          </form>
        </section>

        {/* RIGHT COLUMN: 2FA & Audit Log */}
        <div className="space-y-6">
          {/* Two-Factor Authentication (Coming Soon) */}
          <section className="rounded-2xl border border-ink/[0.06] bg-neutral-50/50 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-ink/60" />
                <h4 className="text-sm font-semibold text-ink">Two-Factor Authentication (2FA)</h4>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-800">
                <Clock className="h-3 w-3" />
                Coming Soon
              </span>
            </div>

            <p className="text-xs text-ink/50">
              Multi-factor verification via SMS and Authenticator apps will be available in an upcoming system update.
            </p>

            <button
              disabled
              className="rounded-full bg-neutral-200 px-5 py-2 text-xs font-semibold text-ink/40 cursor-not-allowed"
            >
              Enable 2FA
            </button>
          </section>

          {/* Security Log */}
          <section className="rounded-2xl border border-ink/[0.06] bg-neutral-50/50 p-6 space-y-4">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-ink/60" />
              <h4 className="text-sm font-semibold text-ink">Recent Security Activity</h4>
            </div>

            {securityLogs.length === 0 ? (
              <p className="text-xs text-ink/40">No recent security events recorded.</p>
            ) : (
              <div className="space-y-3">
                {securityLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between text-xs border-b border-ink/[0.04] pb-2 last:border-0 last:pb-0">
                    <div>
                      <p className="font-medium text-ink">{log.event}</p>
                      <p className="text-[10px] text-ink/40">IP: {log.ip}</p>
                    </div>
                    <span className="text-[11px] text-ink/40">{log.date}</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Active Sessions */}
      <section className="rounded-2xl border border-ink/[0.06] bg-neutral-50/50 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Laptop className="h-4 w-4 text-ink/60" />
            <h4 className="text-sm font-semibold text-ink">Active Sessions</h4>
          </div>

          {sessions.length > 1 && onRevokeSessions && (
            <button
              onClick={onRevokeSessions}
              className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign Out Other Devices
            </button>
          )}
        </div>

        {sessions.length === 0 ? (
          <p className="text-xs text-ink/40">Your current active session is active on this browser.</p>
        ) : (
          <div className="divide-y divide-ink/[0.06]">
            {sessions.map((session) => (
              <div key={session.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white border border-ink/10 text-ink/70">
                    {session.device.includes("Mobile") ? (
                      <Smartphone className="h-4 w-4" />
                    ) : (
                      <Laptop className="h-4 w-4" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-semibold text-ink">{session.device}</p>
                      {session.isCurrent && (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-bold text-emerald-800">
                          This Device
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-ink/40">
                      {session.location} • {session.ip}
                    </p>
                  </div>
                </div>

                <span className="text-xs text-ink/45">{session.lastActive}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Danger Zone */}
      <section className="rounded-2xl border border-rose-200/60 bg-rose-50/30 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h4 className="text-sm font-semibold text-rose-900">Delete Account</h4>
            <p className="text-xs text-rose-700/70 mt-0.5">
              Permanently delete your account, profile details, and saved preferences.
            </p>
          </div>

          <button
            onClick={() => setShowDeleteModal(true)}
            className="self-start sm:self-auto rounded-full bg-rose-600 px-5 py-2 text-xs font-semibold text-white transition-colors hover:bg-rose-700"
          >
            Delete Account
          </button>
        </div>
      </section>

      {/* Confirmation Modal for Account Deletion */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
              <Trash2 className="h-6 w-6" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-ink">Are you absolutely sure?</h3>
              <p className="text-xs text-ink/60 mt-1">
                This action cannot be undone. All your saved models, custom measurements, and order history will be deleted.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="rounded-full border border-ink/10 px-5 py-2.5 text-xs font-semibold text-ink hover:bg-neutral-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="rounded-full bg-rose-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Yes, Delete Account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const inputClass =
  "w-full rounded-xl border border-ink/10 bg-white p-3 text-sm text-ink transition-colors focus:border-plum-500 focus:outline-none focus:ring-2 focus:ring-plum-100";

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-ink/50">{label}</label>
    {children}
  </div>
);