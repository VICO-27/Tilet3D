import React, { useState } from "react";
import { Sliders, Check, Globe, Bell } from "lucide-react";
import { useTranslation } from "react-i18next";

export const PreferencesSetting: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [currency, setCurrency] = useState<"ETB" | "USD">("ETB");
  const [notifications, setNotifications] = useState({
    orders: true,
    promotions: false,
    fittingRoom: true,
  });
  const [isSaved, setIsSaved] = useState(false);

  const languageOptions = [
    { code: "en", label: "English", nativeLabel: "English" },
    { code: "am", label: t("settings.languages.am", "Amharic"), nativeLabel: "አማርኛ" },
    { code: "om", label: t("settings.languages.om", "Afaan Oromo"), nativeLabel: "Afaan Oromo" },
    { code: "fr", label: t("settings.languages.fr", "French"), nativeLabel: "Français" },
  ];

  const handleLanguageChange = (code: string) => {
    i18n.changeLanguage(code);
  };

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    localStorage.setItem("tilet3d_currency", currency);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between border-b border-ink/[0.06] pb-6">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-plum-50 text-plum-600">
            <Sliders className="h-5 w-5" />
          </span>
          <div>
            <h3 className="display text-xl font-semibold text-ink">
              {t("settings.preferencesTitle", "Regional & Preferences")}
            </h3>
            <p className="text-xs text-ink/45">
              {t("settings.preferencesDesc", "Customize your currency, language, and notification experience.")}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSave}
          className="rounded-xl bg-ink px-5 py-2.5 text-xs font-semibold text-white transition-all hover:bg-ink/80 active:scale-95"
        >
          {isSaved ? t("settings.saved", "Saved!") : t("settings.saveChanges", "Save Changes")}
        </button>
      </div>

      <div className="space-y-8">
        {/* SECTION 1: Currency & Language */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Preferred Currency */}
          <div className="rounded-2xl border border-ink/[0.06] bg-neutral-50/50 p-6">
            <div className="mb-4 flex items-center gap-2">
              <Sliders className="h-4 w-4 text-ink/40" />
              <label className="text-xs font-bold uppercase tracking-wider text-ink/60">
                {t("settings.currencyLabel", "Preferred Currency")}
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {(["ETB", "USD"] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCurrency(c)}
                  className={`flex items-center justify-between rounded-xl border p-4 text-left transition-all ${
                    currency === c
                      ? "border-plum-500 bg-white ring-2 ring-plum-100 shadow-sm"
                      : "border-ink/10 bg-white hover:border-ink/20"
                  }`}
                >
                  <span>
                    <span className="block text-sm font-semibold text-ink">{c}</span>
                    <span className="block text-xs text-ink/45">
                      {c === "ETB" ? "Ethiopian Birr (ብር)" : "US Dollar ($)"}
                    </span>
                  </span>
                  {currency === c && <Check className="h-4 w-4 text-plum-600" />}
                </button>
              ))}
            </div>
          </div>

          {/* Interface Language */}
          <div className="rounded-2xl border border-ink/[0.06] bg-neutral-50/50 p-6">
            <div className="mb-4 flex items-center gap-2">
              <Globe className="h-4 w-4 text-ink/40" />
              <label className="text-xs font-bold uppercase tracking-wider text-ink/60">
                {t("settings.languageLabel", "Display Language")}
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {languageOptions.map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`flex items-center justify-between rounded-xl border p-4 text-left transition-all ${
                    i18n.language === lang.code
                      ? "border-plum-500 bg-white ring-2 ring-plum-100 shadow-sm"
                      : "border-ink/10 bg-white hover:border-ink/20"
                  }`}
                >
                  <span>
                    <span className="block text-sm font-semibold text-ink">
                      {lang.nativeLabel}
                    </span>
                    <span className="block text-xs text-ink/45">{lang.label}</span>
                  </span>
                  {i18n.language === lang.code && (
                    <Check className="h-4 w-4 text-plum-600" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* SECTION 2: Notifications */}
        <div className="rounded-2xl border border-ink/[0.06] bg-neutral-50/50 p-6">
          <div className="mb-4 flex items-center gap-2">
            <Bell className="h-4 w-4 text-ink/40" />
            <label className="text-xs font-bold uppercase tracking-wider text-ink/60">
              {t("settings.notificationsTitle", "Notification Preferences")}
            </label>
          </div>

          <div className="divide-y divide-ink/[0.06] rounded-xl border border-ink/[0.06] bg-white">
            <div className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm font-semibold text-ink">{t("settings.orderUpdates", "Order Updates")}</p>
                <p className="text-xs text-ink/45">
                  {t("settings.orderUpdatesDesc", "Receive email alerts regarding delivery & payment status.")}
                </p>
              </div>
              <input
                type="checkbox"
                checked={notifications.orders}
                onChange={() => toggleNotification("orders")}
                className="h-4 w-4 rounded border-ink/20 text-plum-600 focus:ring-plum-500"
              />
            </div>

            <div className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm font-semibold text-ink">{t("settings.fittingRoomAlerts", "3D Fitting Room Alerts")}</p>
                <p className="text-xs text-ink/45">
                  {t("settings.fittingRoomAlertsDesc", "Get notified when customized Habesha avatars or 3D meshes update.")}
                </p>
              </div>
              <input
                type="checkbox"
                checked={notifications.fittingRoom}
                onChange={() => toggleNotification("fittingRoom")}
                className="h-4 w-4 rounded border-ink/20 text-plum-600 focus:ring-plum-500"
              />
            </div>

            <div className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm font-semibold text-ink">{t("settings.promotions", "Promotions & Collections")}</p>
                <p className="text-xs text-ink/45">
                  {t("settings.promotionsDesc", "Occasional updates on new designer drops and traditional wear sales.")}
                </p>
              </div>
              <input
                type="checkbox"
                checked={notifications.promotions}
                onChange={() => toggleNotification("promotions")}
                className="h-4 w-4 rounded border-ink/20 text-plum-600 focus:ring-plum-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};