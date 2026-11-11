import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { Camera, Shield } from "lucide-react";
import { useOutletContext } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { postApi, putApi } from "@/services/api";
import { changePasswordSchema, profileSchema } from "@/utils/validation";
import FormAlert from "@/components/ui/FormAlert";
import { SAMPLE_GUEST_USER } from "./sampleData";

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const ACCEPTED_AVATAR_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

const FIELDS = [
  { name: "name", label: "Full name", required: true },
  { name: "address", label: "Address" },
  { name: "city", label: "City" },
  { name: "zipCode", label: "Postal code" },
  { name: "country", label: "Country" },
];

const ProfileForm = ({ user, updateUser, isGuest = false }) => {
  const fileInputRef = useRef(null);

  const [avatarError, setAvatarError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [previewAvatar, setPreviewAvatar] = useState(null);

  const avatar = previewAvatar || (user?.avatar ?? "");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name ?? "",
      address: user?.address ?? "",
      city: user?.city ?? "",
      zipCode: user?.zipCode ?? "",
      country: user?.country ?? "",
    },
  });

  const handleAvatarChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setAvatarError("");

    if (!ACCEPTED_AVATAR_TYPES.includes(file.type)) {
      setAvatarError("Choose a JPG, PNG, GIF or WebP image.");
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setAvatarError("Image must be 5 MB or smaller.");
      return;
    }

    if (isGuest) {
      setUploading(true);
      await new Promise((r) => setTimeout(r, 400));
      const objectUrl = URL.createObjectURL(file);
      setPreviewAvatar(objectUrl);
      setUploading(false);
      toast.success("Guest Preview: Avatar updated locally!");
      event.target.value = "";
      return;
    }

    const body = new FormData();
    body.append("file", file);

    setUploading(true);
    try {
      const { url } = await postApi("upload/image", body);
      const updated = await putApi("users/me", { avatar: url });
      updateUser(updated);
      toast.success("Profile picture updated");
    } catch (error) {
      setAvatarError(error.message || "Upload failed.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const onSubmitProfile = async (values) => {
    setProfileError("");

    if (isGuest) {
      await new Promise((r) => setTimeout(r, 400));
      toast.success("Guest Preview: Profile changes simulated successfully!");
      return;
    }

    try {
      const updated = await putApi("users/me", values);
      updateUser(updated);
      toast.success("Profile saved");
    } catch (error) {
      setProfileError(error.message || "Could not save your profile.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 lg:space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <section className="space-y-2 lg:space-y-4 mb-4">
        <div className="flex items-center gap-4 text-gray-400">
          <Shield size={16} aria-hidden="true" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em]">
            Secure profile
          </span>
          {isGuest && (
            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-amber-100 text-amber-800 border border-amber-200">
              Interactive Preview
            </span>
          )}
        </div>
        <h1 className="text-2xl lg:text-4xl font-black text-black tracking-tight uppercase leading-none">
          Personal details
        </h1>
        <p className="text-gray-400 font-medium text-xs lg:text-sm max-w-lg">
          Manage your personal details, public profile, and identity information.
        </p>
      </section>

      <section className="flex flex-col items-center sm:items-start gap-8">
        <div className="relative">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            aria-label="Change profile picture"
            className="group relative w-32 h-32 lg:w-40 lg:h-40 rounded-full bg-black flex items-center justify-center text-white text-4xl lg:text-5xl font-black ring-8 ring-white shadow-2xl overflow-hidden border-4 border-gray-100 disabled:opacity-60"
          >
            {avatar ? (
              <img src={avatar} alt="" className="w-full h-full object-cover" />
            ) : (
              <span aria-hidden="true">{user?.name?.charAt(0) ?? "U"}</span>
            )}
            <span className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity">
              <Camera size={32} className="text-white" aria-hidden="true" />
            </span>
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleAvatarChange}
            accept={ACCEPTED_AVATAR_TYPES.join(",")}
            className="hidden"
          />
        </div>

        <div className="text-center sm:text-left space-y-1">
          <h2 className="text-lg font-black text-black uppercase tracking-tight">
            Profile picture
          </h2>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
            JPG, PNG, GIF or WebP • max 5 MB
          </p>
          {uploading && (
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">
              Uploading…
            </p>
          )}
          {avatarError && (
            <p
              role="alert"
              className="text-[10px] font-black uppercase tracking-widest text-red-600"
            >
              {avatarError}
            </p>
          )}
        </div>
      </section>

      <form onSubmit={handleSubmit(onSubmitProfile)} className="space-y-8" noValidate>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
          {FIELDS.map(({ name, label, required }) => (
            <div key={name} className="space-y-2">
              <label
                htmlFor={`profile-${name}`}
                className="block text-[10px] font-black uppercase tracking-[0.3em] text-gray-400"
              >
                {label}
              </label>
              <input
                id={`profile-${name}`}
                required={required}
                aria-invalid={Boolean(errors[name])}
                className="w-full border-b-2 border-gray-100 py-3 text-sm font-bold text-black focus:border-black focus:outline-none transition-colors"
                {...register(name)}
              />
              {errors[name] && (
                <p className="text-[10px] font-black uppercase tracking-widest text-red-600">
                  {errors[name].message}
                </p>
              )}
            </div>
          ))}

          <div className="space-y-2">
            <label
              htmlFor="profile-email"
              className="block text-[10px] font-black uppercase tracking-[0.3em] text-gray-400"
            >
              Email
            </label>
            <input
              id="profile-email"
              value={user?.email ?? ""}
              readOnly
              disabled
              className="w-full border-b-2 border-gray-100 py-3 text-sm font-bold text-gray-400 bg-transparent"
            />
          </div>
        </div>

        <FormAlert message={profileError} />

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex justify-center py-5 px-10 rounded-full text-[10px] font-black uppercase tracking-[0.4em] text-white bg-black hover:bg-gray-800 disabled:opacity-50 transition-all"
        >
          {isSubmitting ? "Saving…" : "Save changes"}
        </button>
      </form>

      <PasswordSection isGuest={isGuest} />
    </div>
  );
};

const PasswordSection = ({ isGuest = false }) => {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(changePasswordSchema) });

  const onSubmit = async ({ currentPassword, newPassword }) => {
    setError("");

    if (isGuest) {
      await new Promise((r) => setTimeout(r, 400));
      toast.success("Guest Preview: Password change simulated successfully!");
      reset();
      setOpen(false);
      return;
    }

    try {
      await putApi("auth/change-password", { currentPassword, newPassword });
      toast.success("Password changed. Other sessions were signed out.");
      reset();
      setOpen(false);
    } catch (err) {
      setError(err.message || "Could not change your password.");
    }
  };

  return (
    <section className="border-t border-gray-100 pt-10 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-black uppercase tracking-tight">
            Password
          </h2>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
            Changing it signs out every other device
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="text-[10px] font-black uppercase tracking-widest text-black underline underline-offset-4 hover:text-gray-600"
        >
          {open ? "Cancel" : "Change password"}
        </button>
      </div>

      {open && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-md" noValidate>
          {[
            {
              name: "currentPassword",
              label: "Current password",
              autoComplete: "current-password",
            },
            { name: "newPassword", label: "New password", autoComplete: "new-password" },
            {
              name: "confirmPassword",
              label: "Confirm new password",
              autoComplete: "new-password",
            },
          ].map(({ name, label, autoComplete }) => (
            <div key={name} className="space-y-2">
              <label
                htmlFor={`pw-${name}`}
                className="block text-[10px] font-black uppercase tracking-[0.3em] text-gray-400"
              >
                {label}
              </label>
              <input
                id={`pw-${name}`}
                type="password"
                autoComplete={autoComplete}
                aria-invalid={Boolean(errors[name])}
                className="w-full border-b-2 border-gray-100 py-3 text-sm font-bold text-black focus:border-black focus:outline-none transition-colors"
                {...register(name)}
              />
              {errors[name] && (
                <p className="text-[10px] font-black uppercase tracking-widest text-red-600">
                  {errors[name].message}
                </p>
              )}
            </div>
          ))}

          <FormAlert message={error} />

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex justify-center py-5 px-10 rounded-full text-[10px] font-black uppercase tracking-[0.4em] text-white bg-black hover:bg-gray-800 disabled:opacity-50 transition-all"
          >
            {isSubmitting ? "Updating…" : "Update password"}
          </button>
        </form>
      )}
    </section>
  );
};

const Profile = () => {
  const context = useOutletContext() || {};
  const { user, updateUser, isAuthenticated } = useAuth();

  const isGuest = context.isGuest ?? !isAuthenticated;
  const effectiveUser = isAuthenticated && user ? user : (context.user ?? SAMPLE_GUEST_USER);

  return (
    <ProfileForm
      key={effectiveUser?.id ?? "sample-guest"}
      user={effectiveUser}
      updateUser={updateUser}
      isGuest={isGuest}
    />
  );
};

export default Profile;
