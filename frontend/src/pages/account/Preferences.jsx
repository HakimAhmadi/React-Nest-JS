import { useState } from "react";
import toast from "react-hot-toast";
import { Sliders, Bell, Mail, ShieldAlert, Monitor, Moon, Sun, Check } from "lucide-react";
import { useOutletContext } from "react-router-dom";
import { SAMPLE_PREFERENCES_DATA } from "./sampleData";

const Preferences = () => {
  const context = useOutletContext() || {};
  const isGuest = context.isGuest ?? true;

  const [prefs, setPrefs] = useState(SAMPLE_PREFERENCES_DATA);

  const togglePreference = (key) => {
    setPrefs((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      toast.success(
        isGuest
          ? `Guest Preview: ${key} updated`
          : "Preferences updated successfully",
      );
      return next;
    });
  };

  const setTheme = (mode) => {
    setPrefs((prev) => ({ ...prev, themeMode: mode }));
    toast.success(
      isGuest
        ? `Guest Preview: Theme set to ${mode}`
        : `Theme set to ${mode}`,
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <section className="space-y-2 mb-4">
        <div className="flex items-center gap-3 text-gray-500">
          <Sliders size={18} className="text-black" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em]">
            Preferences & Settings
          </span>
          {isGuest && (
            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-amber-100 text-amber-800 border border-amber-200">
              Interactive Preview
            </span>
          )}
        </div>
        <h1 className="text-2xl lg:text-4xl font-black text-black tracking-tight uppercase leading-none">
          User Preferences
        </h1>
        <p className="text-gray-500 font-medium text-xs lg:text-sm max-w-xl">
          Customize notifications, delivery channels, display themes, and workspace layout.
        </p>
      </section>

      {/* Notifications Card */}
      <section className="bg-white border border-gray-200 rounded-3xl p-6 lg:p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
          <div className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center">
            <Bell size={18} />
          </div>
          <div>
            <h2 className="text-base lg:text-lg font-black uppercase tracking-tight text-black">
              Communication & Notifications
            </h2>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
              Choose how and when the platform contacts you
            </p>
          </div>
        </div>

        <div className="divide-y divide-gray-100 space-y-2">
          {/* Email Notifications */}
          <div className="pt-3 pb-4 flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <Mail size={18} className="text-gray-400 mt-0.5 shrink-0" />
              <div>
                <h3 className="text-xs font-black text-black uppercase tracking-wide">
                  Transactional Emails
                </h3>
                <p className="text-[11px] text-gray-400 font-medium">
                  Receive email alerts regarding account activity, receipts, and order confirmations.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => togglePreference("emailNotifications")}
              aria-label="Toggle Transactional Emails"
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                prefs.emailNotifications ? "bg-black" : "bg-gray-200"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  prefs.emailNotifications ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Security Alerts */}
          <div className="pt-4 pb-4 flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <ShieldAlert size={18} className="text-gray-400 mt-0.5 shrink-0" />
              <div>
                <h3 className="text-xs font-black text-black uppercase tracking-wide">
                  Security Alerts
                </h3>
                <p className="text-[11px] text-gray-400 font-medium">
                  Instant notifications for logins from unfamiliar IP addresses or device changes.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => togglePreference("securityAlerts")}
              aria-label="Toggle Security Alerts"
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                prefs.securityAlerts ? "bg-black" : "bg-gray-200"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  prefs.securityAlerts ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Weekly Digest */}
          <div className="pt-4 pb-4 flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <Bell size={18} className="text-gray-400 mt-0.5 shrink-0" />
              <div>
                <h3 className="text-xs font-black text-black uppercase tracking-wide">
                  Weekly Activity Summary
                </h3>
                <p className="text-[11px] text-gray-400 font-medium">
                  A condensed summary email sent every Monday morning outlining account metrics.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => togglePreference("weeklyDigest")}
              aria-label="Toggle Weekly Activity Summary"
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                prefs.weeklyDigest ? "bg-black" : "bg-gray-200"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  prefs.weeklyDigest ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>
      </section>

      {/* Interface & Theme Card */}
      <section className="bg-white border border-gray-200 rounded-3xl p-6 lg:p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
          <div className="w-10 h-10 rounded-2xl bg-zinc-100 text-zinc-900 flex items-center justify-center">
            <Monitor size={18} />
          </div>
          <div>
            <h2 className="text-base lg:text-lg font-black uppercase tracking-tight text-black">
              Display & Appearance
            </h2>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
              Manage color mode and interface layout density
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
            Interface Theme
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { id: "light", label: "Light", icon: Sun },
              { id: "dark", label: "Dark", icon: Moon },
              { id: "system", label: "System Auto", icon: Monitor },
            ].map(({ id, label, icon: Icon }) => {
              const active = prefs.themeMode === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTheme(id)}
                  className={`flex items-center justify-between p-4 rounded-2xl border transition-all text-left ${
                    active
                      ? "border-black bg-zinc-900 text-white shadow-sm"
                      : "border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={16} />
                    <span className="text-xs font-bold uppercase tracking-wide">
                      {label}
                    </span>
                  </div>
                  {active && <Check size={16} className="text-white" />}
                </button>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Preferences;
