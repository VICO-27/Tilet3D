import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  User,
  ShieldCheck,
  MapPin,
  Settings as SettingsIcon,
  Sliders,
  LogOut,
  ChevronRight,
} from "lucide-react";

import Navbar from "../../../shared/components/layout/Navbar";
import { useAuthStore } from "../../../app/store/useAuthStore";
import { useProfile } from "../hooks/useProfile";
import { useSecurity } from "../hooks/useSecurity";

import { AuthScreen } from "../components/AuthScreen";
import { VerifyEmailScreen } from "../components/VerifyEmailScreen";
import { Dashboard } from "../components/Dashboard";
import { ProfileEditor } from "../components/ProfileEditor";
import { AddressBookSetting } from "../components/settings/AddressBookSetting";
import { SecuritySetting } from "../components/settings/SecuritySetting";
import { PreferencesSetting } from "../components/settings/PreferencesSetting";

type SettingsTab =
  | "dashboard"
  | "profile"
  | "addresses"
  | "security"
  | "preferences";

const AccountPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<SettingsTab>("dashboard");
  // Controls whether the email verification card is shown for unverified users.
  // Defaults to true when the user is signed in but unverified.
  // Setting to false via the Back button dismisses the card without signing out.
  const [showVerify, setShowVerify] = useState(true);

  const user = useAuthStore((state) => state.user);
  const signOut = useAuthStore((state) => state.signOut);
  const { updateProfile } = useProfile();

  const {
    logs,
    sessions,
    handleChangePassword,
    handleRevokeSessions,
    handleDeleteAccount,
  } = useSecurity();

  const NAV_ITEMS: { key: SettingsTab; label: string; icon: React.ReactNode }[] = [
    { key: "dashboard", label: t("account.tabs.overview", "Overview"), icon: <User className="h-4 w-4" /> },
    { key: "profile", label: t("account.tabs.personalDetails", "Personal Details"), icon: <SettingsIcon className="h-4 w-4" /> },
    { key: "addresses", label: t("account.tabs.addresses", "Shipping Addresses"), icon: <MapPin className="h-4 w-4" /> },
    { key: "security", label: t("account.tabs.security", "Password & Security"), icon: <ShieldCheck className="h-4 w-4" /> },
    { key: "preferences", label: t("account.tabs.preferences", "Regional Preferences"), icon: <Sliders className="h-4 w-4" /> },
  ];

  if (!user) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <AuthScreen />
      </div>
    );
  }

  if (!user.is_verified) {
    if (!showVerify) {
      // User dismissed the verify card — show the auth screen so they can
      // sign out or navigate away without being locked in a verify loop.
      return (
        <div className="min-h-screen bg-white">
          <Navbar />
          <AuthScreen />
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <VerifyEmailScreen
          onBack={() => setShowVerify(false)}
          onDone={() => setShowVerify(true)}
        />
      </div>
    );
  }

  const displayName =
    user.full_name?.trim() || user.nickname?.trim() || user.email.split("@")[0];
  const initials = displayName
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const handleSignOut = async () => {
    await signOut();
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen bg-neutral-50/40">
      <Navbar />

      <div className="mx-auto max-w-[1240px] px-4 pt-[100px] pb-24 md:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[280px_1fr]">
          <aside className="lg:sticky lg:top-[100px] lg:self-start">
            <div className="rounded-[28px] border border-ink/[0.06] bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3 border-b border-ink/[0.06] pb-5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-ink text-sm font-black text-white">
                  {user.avatar_image ? (
                    <img
                      src={user.avatar_image}
                      alt={displayName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    initials
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">
                    {displayName}
                  </p>
                  <p className="truncate text-xs text-ink/45">{user.email}</p>
                </div>
              </div>

              <nav className="mt-4 space-y-1">
                {NAV_ITEMS.map((item) => {
                  const active = activeTab === item.key;
                  return (
                    <button
                      key={item.key}
                      onClick={() => setActiveTab(item.key)}
                      className={`group flex w-full items-center justify-between rounded-2xl px-3.5 py-3 text-sm font-semibold transition-all ${
                        active
                          ? "bg-ink text-white shadow-sm"
                          : "text-ink/60 hover:bg-neutral-50 hover:text-ink"
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        {item.icon}
                        {item.label}
                      </span>
                      <ChevronRight
                        className={`h-3.5 w-3.5 transition-opacity ${
                          active
                            ? "opacity-70"
                            : "opacity-0 group-hover:opacity-30"
                        }`}
                      />
                    </button>
                  );
                })}
              </nav>

              <div className="mt-4 border-t border-ink/[0.06] pt-4">
                <button
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-semibold text-rose-600/80 transition-colors hover:bg-rose-50 hover:text-rose-600"
                >
                  <LogOut className="h-4 w-4" />
                  {t("account.signOut", "Sign Out")}
                </button>
              </div>
            </div>
          </aside>

          <main>
            <div className="min-h-[560px] rounded-[28px] border border-ink/[0.06] bg-white shadow-sm">
              {activeTab === "dashboard" && (
                <Dashboard
                  user={user}
                  onSignOut={handleSignOut}
                  onNavigate={navigate}
                  onEditProfile={() => setActiveTab("profile")}
                />
              )}
              {activeTab === "profile" && (
                <ProfileEditor
                  user={user}
                  onCancel={() => setActiveTab("dashboard")}
                  onSave={async (data) => {
                    await updateProfile(data);
                    setActiveTab("dashboard");
                  }}
                />
              )}
              {activeTab === "addresses" && <AddressBookSetting />}
              {activeTab === "security" && (
                <SecuritySetting
                  securityLogs={logs}
                  sessions={sessions}
                  onChangePassword={handleChangePassword}
                  onRevokeSessions={handleRevokeSessions}
                  onDeleteAccount={handleDeleteAccount}
                />
              )}
              {activeTab === "preferences" && <PreferencesSetting />}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default AccountPage;