import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { Shield, Key, Smartphone, Laptop, AlertCircle, CheckCircle2 } from "lucide-react";
import { useOutletContext } from "react-router-dom";
import { changePasswordSchema } from "@/utils/validation";
import { putApi } from "@/services/api";
import FormAlert from "@/components/ui/FormAlert";
import { SAMPLE_SECURITY_DATA } from "./sampleData";

const Security = () => {
  const context = useOutletContext() || {};
  const isGuest = context.isGuest ?? true;

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(
    SAMPLE_SECURITY_DATA.twoFactorEnabled,
  );
  const [sessions, setSessions] = useState(SAMPLE_SECURITY_DATA.sessions);
  const [passwordError, setPasswordError] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(changePasswordSchema),
  });

  const onPasswordSubmit = async ({ currentPassword, newPassword }) => {
    setPasswordError("");

    if (isGuest) {
      // Simulated response in guest preview mode
      await new Promise((resolve) => setTimeout(resolve, 600));
      toast.success("Guest Preview: Password change simulated successfully!");
      reset();
      return;
    }

    try {
      await putApi("auth/change-password", { currentPassword, newPassword });
      toast.success("Password changed. Other sessions were signed out.");
      reset();
    } catch (err) {
      setPasswordError(err.message || "Could not change your password.");
    }
  };

  const toggleTwoFactor = () => {
    const nextState = !twoFactorEnabled;
    setTwoFactorEnabled(nextState);
    if (isGuest) {
      toast.success(
        nextState
          ? "Guest Preview: 2FA enabled (sample state)"
          : "Guest Preview: 2FA disabled",
      );
    } else {
      toast.success(
        nextState
          ? "Two-factor authentication requested"
          : "Two-factor authentication disabled",
      );
    }
  };

  const handleRevokeSession = (sessionId) => {
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    toast.success("Session revoked successfully.");
  };

  const handleRevokeAllOther = () => {
    setSessions((prev) => prev.filter((s) => s.current));
    toast.success("All other active sessions have been signed out.");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <section className="space-y-2 mb-4">
        <div className="flex items-center gap-3 text-gray-500">
          <Shield size={18} className="text-black" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em]">
            Access & Security
          </span>
          {isGuest && (
            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-amber-100 text-amber-800 border border-amber-200">
              Interactive Preview
            </span>
          )}
        </div>
        <h1 className="text-2xl lg:text-4xl font-black text-black tracking-tight uppercase leading-none">
          Security Settings
        </h1>
        <p className="text-gray-500 font-medium text-xs lg:text-sm max-w-xl">
          Manage your login credentials, multi-factor authentication, and monitor active
          browser sessions.
        </p>
      </section>

      {/* Password Management Card */}
      <section className="bg-white border border-gray-200 rounded-3xl p-6 lg:p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
          <div className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center">
            <Key size={18} />
          </div>
          <div>
            <h2 className="text-base lg:text-lg font-black uppercase tracking-tight text-black">
              Update Password
            </h2>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
              Last modified: {SAMPLE_SECURITY_DATA.lastPasswordChange}
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit(onPasswordSubmit)}
          className="space-y-5 max-w-xl"
          noValidate
        >
          <div className="space-y-1">
            <label
              htmlFor="currentPassword"
              className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-500"
            >
              Current Password
            </label>
            <input
              id="currentPassword"
              type="password"
              placeholder="••••••••••••"
              autoComplete="current-password"
              aria-invalid={Boolean(errors.currentPassword)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-black focus:border-black focus:bg-white focus:outline-none transition-all"
              {...register("currentPassword")}
            />
            {errors.currentPassword && (
              <p className="text-[10px] font-black uppercase tracking-widest text-red-600 mt-1">
                {errors.currentPassword.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label
                htmlFor="newPassword"
                className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-500"
              >
                New Password
              </label>
              <input
                id="newPassword"
                type="password"
                placeholder="Min. 8 characters"
                autoComplete="new-password"
                aria-invalid={Boolean(errors.newPassword)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-black focus:border-black focus:bg-white focus:outline-none transition-all"
                {...register("newPassword")}
              />
              {errors.newPassword && (
                <p className="text-[10px] font-black uppercase tracking-widest text-red-600 mt-1">
                  {errors.newPassword.message}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label
                htmlFor="confirmPassword"
                className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-500"
              >
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                placeholder="Re-enter password"
                autoComplete="new-password"
                aria-invalid={Boolean(errors.confirmPassword)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-black focus:border-black focus:bg-white focus:outline-none transition-all"
                {...register("confirmPassword")}
              />
              {errors.confirmPassword && (
                <p className="text-[10px] font-black uppercase tracking-widest text-red-600 mt-1">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>
          </div>

          <FormAlert message={passwordError} />

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center px-6 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-[0.25em] text-white bg-black hover:bg-gray-800 disabled:opacity-50 transition-all shadow-sm"
          >
            {isSubmitting ? "Updating..." : "Update Password"}
          </button>
        </form>
      </section>

      {/* Two-Factor Authentication Card */}
      <section className="bg-white border border-gray-200 rounded-3xl p-6 lg:p-8 shadow-sm space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-zinc-100 text-zinc-900 flex items-center justify-center">
              <Smartphone size={18} />
            </div>
            <div>
              <h2 className="text-base lg:text-lg font-black uppercase tracking-tight text-black">
                Two-Factor Authentication (2FA)
              </h2>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                TOTP Authenticator Apps (Google Authenticator, 1Password, Authy)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {twoFactorEnabled ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 size={12} /> Enabled
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-zinc-100 text-zinc-600 border border-zinc-200">
                <AlertCircle size={12} /> Disabled
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
          <p className="text-xs text-gray-600 font-medium max-w-md">
            Add an extra layer of protection to prevent unauthorized access even if your
            password is compromised.
          </p>
          <button
            type="button"
            onClick={toggleTwoFactor}
            className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border ${
              twoFactorEnabled
                ? "bg-white text-red-600 border-red-200 hover:bg-red-50"
                : "bg-black text-white border-black hover:bg-gray-800"
            }`}
          >
            {twoFactorEnabled ? "Disable 2FA" : "Enable 2FA"}
          </button>
        </div>
      </section>

      {/* Active Device Sessions */}
      <section className="bg-white border border-gray-200 rounded-3xl p-6 lg:p-8 shadow-sm space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-zinc-100 text-zinc-900 flex items-center justify-center">
              <Laptop size={18} />
            </div>
            <div>
              <h2 className="text-base lg:text-lg font-black uppercase tracking-tight text-black">
                Active Browser & Device Sessions
              </h2>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                Devices currently authenticated into this account
              </p>
            </div>
          </div>

          {sessions.some((s) => !s.current) && (
            <button
              type="button"
              onClick={handleRevokeAllOther}
              className="text-[10px] font-black uppercase tracking-widest text-red-600 hover:underline"
            >
              Sign out other sessions
            </button>
          )}
        </div>

        <div className="divide-y divide-gray-100">
          {sessions.map((sess) => (
            <div
              key={sess.id}
              className="py-4 flex items-center justify-between gap-4 flex-wrap"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-black">{sess.device}</span>
                  {sess.current && (
                    <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest bg-emerald-100 text-emerald-800">
                      This Device
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-gray-400 font-medium">
                  {sess.location} • <span className="text-gray-500">{sess.lastActive}</span>
                </p>
              </div>

              {!sess.current && (
                <button
                  type="button"
                  onClick={() => handleRevokeSession(sess.id)}
                  className="px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest text-gray-600 hover:text-red-600 hover:bg-gray-50 border border-gray-200 transition-colors"
                >
                  Revoke
                </button>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Security;
