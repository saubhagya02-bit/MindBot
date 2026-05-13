import { useState } from "react";
import {
  X,
  User,
  Mail,
  Lock,
  Palette,
  Check,
  Loader2,
  ChevronRight,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

const THEMES = [
  { id: "dark", label: "Dark", icon: Moon, bg: "#0b0d14", accent: "#4f8ef7" },
  {
    id: "darker",
    label: "Midnight",
    icon: Moon,
    bg: "#050508",
    accent: "#8b5cf6",
  },
  { id: "light", label: "Light", icon: Sun, bg: "#f8fafc", accent: "#2563eb" },
  {
    id: "teal",
    label: "Ocean",
    icon: Monitor,
    bg: "#0d1f2d",
    accent: "#14b8a6",
  },
  {
    id: "rose",
    label: "Rose",
    icon: Monitor,
    bg: "#1a0d0f",
    accent: "#f43f5e",
  },
  {
    id: "green",
    label: "Forest",
    icon: Monitor,
    bg: "#0d1a0f",
    accent: "#22c55e",
  },
];

const ACCENT_COLORS = [
  { id: "blue", color: "#4f8ef7", label: "Blue" },
  { id: "purple", color: "#8b5cf6", label: "Purple" },
  { id: "teal", color: "#14b8a6", label: "Teal" },
  { id: "rose", color: "#f43f5e", label: "Rose" },
  { id: "amber", color: "#f59e0b", label: "Amber" },
  { id: "green", color: "#22c55e", label: "Green" },
];

export default function AccountSettings() {
  const {
    user,
    updateProfile,
    logout,
    setShowAccountSettings,
    theme,
    setTheme,
  } = useAuth();
  const [tab, setTab] = useState("profile");
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    setError("");
    setSuccess("");
  };

  const handleSaveProfile = async () => {
    if (!form.name.trim()) return setError("Name cannot be empty.");
    if (!form.email.trim()) return setError("Email cannot be empty.");
    setLoading(true);
    await new Promise((r) => setTimeout(r, 400));
    const result = updateProfile({
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
    });
    setLoading(false);
    if (result.error) setError(result.error);
    else setSuccess("Profile updated successfully!");
  };

  const handleChangePassword = async () => {
    if (!form.currentPassword) return setError("Enter your current password.");
    if (!form.newPassword) return setError("Enter a new password.");
    if (form.newPassword.length < 6)
      return setError("New password must be at least 6 characters.");
    if (form.newPassword !== form.confirmPassword)
      return setError("Passwords do not match.");
    setLoading(true);
    await new Promise((r) => setTimeout(r, 400));
    const result = updateProfile({
      currentPassword: form.currentPassword,
      newPassword: form.newPassword,
    });
    setLoading(false);
    if (result.error) setError(result.error);
    else {
      setSuccess("Password changed!");
      setForm((f) => ({
        ...f,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));
    }
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "security", label: "Security", icon: Lock },
    { id: "theme", label: "Appearance", icon: Palette },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backdropFilter: "blur(8px)", background: "rgba(7,8,16,0.85)" }}
    >
      <div className="w-full max-w-lg bg-[#12151f] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-fade-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gem-400 to-accent-purple flex items-center justify-center text-white font-bold text-sm">
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
            <div>
              <div className="text-slate-100 font-semibold text-[14px]">
                {user?.name}
              </div>
              <div className="text-slate-500 text-[11px]">{user?.email}</div>
            </div>
          </div>
          <button
            onClick={() => setShowAccountSettings(false)}
            className="text-slate-500 hover:text-slate-300 p-1.5 rounded-lg hover:bg-white/5 transition-all"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex">
          <div className="w-40 border-r border-white/8 py-3 flex-shrink-0">
            {tabs.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    setTab(t.id);
                    setError("");
                    setSuccess("");
                  }}
                  className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] transition-all ${
                    tab === t.id
                      ? "text-slate-100 bg-white/5 border-r-2 border-gem-500"
                      : "text-slate-500 hover:text-slate-300 hover:bg-white/3"
                  }`}
                >
                  <Icon size={14} />
                  {t.label}
                </button>
              );
            })}
            <div className="mx-3 my-2 border-t border-white/8" />
            <button
              onClick={logout}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-red-400 hover:bg-red-500/10 transition-all"
            >
              <X size={14} />
              Sign out
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 p-5 min-h-[320px]">
            {tab === "profile" && (
              <div className="space-y-4">
                <div className="text-slate-300 font-semibold text-[13px] mb-4">
                  Profile Information
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => set("name", e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-slate-200 text-sm outline-none focus:border-gem-500/60 transition-colors placeholder-slate-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => set("email", e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-slate-200 text-sm outline-none focus:border-gem-500/60 transition-colors"
                  />
                </div>

                {/* Avatar preview */}
                <div className="flex items-center gap-3 p-3 bg-white/3 rounded-xl border border-white/8">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gem-400 to-accent-purple flex items-center justify-center text-white font-bold">
                    {form.name?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                  <div>
                    <div className="text-slate-300 text-[13px] font-medium">
                      {form.name || "Your Name"}
                    </div>
                    <div className="text-slate-600 text-[11px]">
                      Avatar is auto-generated from your name
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="px-3 py-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs">
                    {error}
                  </div>
                )}
                {success && (
                  <div className="px-3 py-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs flex items-center gap-2">
                    <Check size={13} />
                    {success}
                  </div>
                )}

                <button
                  onClick={handleSaveProfile}
                  disabled={loading}
                  className="w-full py-2.5 bg-gem-500 hover:bg-gem-600 disabled:opacity-60 text-white rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  {loading && <Loader2 size={14} className="animate-spin" />}
                  Save Changes
                </button>
              </div>
            )}

            {tab === "security" && (
              <div className="space-y-4">
                <div className="text-slate-300 font-semibold text-[13px] mb-4">
                  Change Password
                </div>

                {["currentPassword", "newPassword", "confirmPassword"].map(
                  (field, i) => (
                    <div key={field}>
                      <label className="block text-xs font-medium text-slate-400 mb-1.5">
                        {
                          [
                            "Current Password",
                            "New Password",
                            "Confirm New Password",
                          ][i]
                        }
                      </label>
                      <input
                        type="password"
                        value={form[field]}
                        onChange={(e) => set(field, e.target.value)}
                        placeholder={
                          [
                            "Enter current password",
                            "At least 6 characters",
                            "Repeat new password",
                          ][i]
                        }
                        className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-slate-200 text-sm outline-none focus:border-gem-500/60 transition-colors placeholder-slate-600"
                      />
                    </div>
                  ),
                )}

                {error && (
                  <div className="px-3 py-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs">
                    {error}
                  </div>
                )}
                {success && (
                  <div className="px-3 py-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs flex items-center gap-2">
                    <Check size={13} />
                    {success}
                  </div>
                )}

                <button
                  onClick={handleChangePassword}
                  disabled={loading}
                  className="w-full py-2.5 bg-gem-500 hover:bg-gem-600 disabled:opacity-60 text-white rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  {loading && <Loader2 size={14} className="animate-spin" />}
                  Update Password
                </button>
              </div>
            )}

            {tab === "theme" && (
              <div className="space-y-5">
                <div className="text-slate-300 font-semibold text-[13px]">
                  Theme
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {THEMES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTheme(t.id)}
                      className={`relative flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${
                        theme === t.id
                          ? "border-gem-500 bg-gem-500/10"
                          : "border-white/10 bg-white/3 hover:border-white/20"
                      }`}
                    >
                      <div
                        className="w-full h-8 rounded-lg border border-white/10 flex items-center justify-center gap-1"
                        style={{ background: t.bg }}
                      >
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ background: t.accent }}
                        />
                        <div className="w-6 h-1.5 rounded-full bg-white/20" />
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {t.label}
                      </span>
                      {theme === t.id && (
                        <div className="absolute top-1.5 right-1.5 w-4 h-4 bg-gem-500 rounded-full flex items-center justify-center">
                          <Check size={9} className="text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                <div>
                  <div className="text-slate-400 text-xs font-medium mb-2">
                    Accent Color
                  </div>
                  <div className="flex gap-2">
                    {ACCENT_COLORS.map((c) => (
                      <button
                        key={c.id}
                        title={c.label}
                        onClick={() => {
                          document.documentElement.style.setProperty(
                            "--accent-color",
                            c.color,
                          );
                          localStorage.setItem("mindbot_accent", c.color);
                        }}
                        className="w-7 h-7 rounded-full border-2 border-transparent hover:border-white/40 transition-all hover:scale-110"
                        style={{ background: c.color }}
                      />
                    ))}
                  </div>
                </div>

                <div className="p-3 bg-white/3 border border-white/8 rounded-xl">
                  <div className="text-slate-500 text-xs">
                    Theme is saved automatically and persists across sessions.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
