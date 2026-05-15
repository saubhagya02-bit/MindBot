import { useState } from "react";
import {
  X,
  User,
  Lock,
  Palette,
  Check,
  Loader2,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

const THEMES = [
  { id: "dark", label: "Dark", bg: "#0b0d14", accent: "#4f8ef7", icon: Moon },
  {
    id: "darker",
    label: "Midnight",
    bg: "#050508",
    accent: "#8b5cf6",
    icon: Moon,
  },
  { id: "light", label: "Light", bg: "#f0f4f8", accent: "#2563eb", icon: Sun },
  {
    id: "teal",
    label: "Ocean",
    bg: "#081419",
    accent: "#14b8a6",
    icon: Monitor,
  },
  {
    id: "rose",
    label: "Rose",
    bg: "#120608",
    accent: "#f43f5e",
    icon: Monitor,
  },
  {
    id: "green",
    label: "Forest",
    bg: "#060e08",
    accent: "#22c55e",
    icon: Monitor,
  },
];

const ACCENT_COLORS = [
  { color: "#4f8ef7", label: "Blue" },
  { color: "#8b5cf6", label: "Purple" },
  { color: "#14b8a6", label: "Teal" },
  { color: "#f43f5e", label: "Rose" },
  { color: "#f59e0b", label: "Amber" },
  { color: "#22c55e", label: "Green" },
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
  const [selectedAccent, setSelectedAccent] = useState(
    localStorage.getItem("mindbot_accent") || "#4f8ef7",
  );

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
    else setSuccess("Profile updated!");
  };

  const handleChangePassword = async () => {
    if (!form.currentPassword) return setError("Enter your current password.");
    if (!form.newPassword) return setError("Enter a new password.");
    if (form.newPassword.length < 6) return setError("Min 6 characters.");
    if (form.newPassword !== form.confirmPassword)
      return setError("Passwords don't match.");
    setLoading(true);
    await new Promise((r) => setTimeout(r, 400));
    const result = updateProfile({
      currentPassword: form.currentPassword,
      newPassword: form.newPassword,
    });
    setLoading(false);
    if (result.error) setError(result.error);
    else {
      setSuccess("Password updated!");
      setForm((f) => ({
        ...f,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));
    }
  };

  const handleThemeChange = (themeId) => {
    setTheme(themeId);

    document.documentElement.setAttribute("data-theme", themeId);
    localStorage.setItem("mindbot_theme", themeId);
  };

  const handleAccentChange = (color) => {
    setSelectedAccent(color);
    document.documentElement.style.setProperty("--accent", color);

    document.documentElement.style.setProperty("--accent-color", color);
    localStorage.setItem("mindbot_accent", color);

    let styleEl = document.getElementById("accent-override");
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = "accent-override";
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = `
      .bg-gem-500, [class*="bg-gem-500"] { background-color: ${color} !important; }
      .text-gem-400, .text-gem-500 { color: ${color} !important; }
      .border-gem-500\\/50, .border-gem-500\\/20 { border-color: ${color}40 !important; }
      .focus-within\\:border-gem-500\\/50:focus-within { border-color: ${color}80 !important; }
      .gemini-gradient { background: linear-gradient(135deg, ${color}, #8b5cf6, #14b8a6) !important; -webkit-background-clip: text; background-clip: text; }
    `;
  };

  useState(() => {
    const saved = localStorage.getItem("mindbot_accent");
    if (saved) handleAccentChange(saved);
  });

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "security", label: "Security", icon: Lock },
    { id: "theme", label: "Appearance", icon: Palette },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backdropFilter: "blur(8px)", background: "rgba(7,8,16,0.88)" }}
    >
      <div
        className="w-full max-w-lg bg-base-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-fade-up"
        style={{ background: "var(--bg-900,#12151f)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gem-400 to-accent-purple flex items-center justify-center text-white font-bold text-sm">
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
            <div>
              <div
                className="text-slate-100 font-semibold text-[14px]"
                style={{ color: "var(--text)" }}
              >
                {user?.name}
              </div>
              <div
                className="text-[11px]"
                style={{ color: "var(--text-muted)" }}
              >
                {user?.email}
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowAccountSettings(false)}
            className="text-slate-500 hover:text-slate-300 p-1.5 rounded-lg hover:bg-white/5 transition-all"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex" style={{ minHeight: "340px" }}>
          {/* Tab sidebar */}
          <div
            className="w-40 border-r border-white/8 py-3 flex-shrink-0"
            style={{ background: "var(--bg-800,#191d2b)" }}
          >
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
                      ? "border-r-2 border-gem-500 font-medium"
                      : "hover:bg-white/5"
                  }`}
                  style={{
                    color:
                      tab === t.id
                        ? "var(--accent,#4f8ef7)"
                        : "var(--text-muted,#6b7494)",
                    background:
                      tab === t.id ? "rgba(79,142,247,0.08)" : undefined,
                  }}
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
          <div className="flex-1 p-5 overflow-y-auto">
            {/* Profile */}
            {tab === "profile" && (
              <div className="space-y-4">
                <div
                  className="font-semibold text-[13px] mb-1"
                  style={{ color: "var(--text)" }}
                >
                  Profile Information
                </div>
                {[
                  {
                    label: "Display Name",
                    key: "name",
                    type: "text",
                    placeholder: "Your name",
                  },
                  {
                    label: "Email Address",
                    key: "email",
                    type: "email",
                    placeholder: "you@example.com",
                  },
                ].map((f) => (
                  <div key={f.key}>
                    <label
                      className="block text-xs font-medium mb-1.5"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {f.label}
                    </label>
                    <input
                      type={f.type}
                      value={form[f.key]}
                      onChange={(e) => set(f.key, e.target.value)}
                      placeholder={f.placeholder}
                      className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none transition-colors"
                      style={{
                        background: "var(--bg-800)",
                        border: "1px solid var(--border2)",
                        color: "var(--text)",
                      }}
                    />
                  </div>
                ))}

                {/* Avatar preview */}
                <div
                  className="flex items-center gap-3 p-3 rounded-xl border"
                  style={{
                    background: "var(--bg-800)",
                    borderColor: "var(--border)",
                  }}
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gem-400 to-accent-purple flex items-center justify-center text-white font-bold">
                    {form.name?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                  <div>
                    <div
                      className="text-[13px] font-medium"
                      style={{ color: "var(--text)" }}
                    >
                      {form.name || "Your Name"}
                    </div>
                    <div
                      className="text-[11px]"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Auto-generated avatar
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
                  className="w-full py-2.5 rounded-xl text-sm font-medium text-white flex items-center justify-center gap-2 transition-all active:scale-95"
                  style={{ background: "var(--accent,#4f8ef7)" }}
                >
                  {loading && <Loader2 size={14} className="animate-spin" />}
                  Save Changes
                </button>
              </div>
            )}

            {/* Security */}
            {tab === "security" && (
              <div className="space-y-4">
                <div
                  className="font-semibold text-[13px] mb-1"
                  style={{ color: "var(--text)" }}
                >
                  Change Password
                </div>
                {[
                  {
                    label: "Current Password",
                    key: "currentPassword",
                    ph: "Enter current password",
                  },
                  {
                    label: "New Password",
                    key: "newPassword",
                    ph: "At least 6 characters",
                  },
                  {
                    label: "Confirm Password",
                    key: "confirmPassword",
                    ph: "Repeat new password",
                  },
                ].map((f) => (
                  <div key={f.key}>
                    <label
                      className="block text-xs font-medium mb-1.5"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {f.label}
                    </label>
                    <input
                      type="password"
                      value={form[f.key]}
                      onChange={(e) => set(f.key, e.target.value)}
                      placeholder={f.ph}
                      className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none"
                      style={{
                        background: "var(--bg-800)",
                        border: "1px solid var(--border2)",
                        color: "var(--text)",
                      }}
                    />
                  </div>
                ))}
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
                  className="w-full py-2.5 rounded-xl text-sm font-medium text-white flex items-center justify-center gap-2 transition-all active:scale-95"
                  style={{ background: "var(--accent,#4f8ef7)" }}
                >
                  {loading && <Loader2 size={14} className="animate-spin" />}
                  Update Password
                </button>
              </div>
            )}

            {/* Appearance */}
            {tab === "theme" && (
              <div className="space-y-5">
                <div
                  className="font-semibold text-[13px]"
                  style={{ color: "var(--text)" }}
                >
                  Theme
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  {THEMES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => handleThemeChange(t.id)}
                      className="relative flex flex-col items-center gap-2 p-2.5 rounded-xl border transition-all cursor-pointer"
                      style={{
                        border:
                          theme === t.id
                            ? `2px solid ${t.accent}`
                            : "1px solid rgba(255,255,255,0.1)",
                        background:
                          theme === t.id
                            ? `${t.accent}18`
                            : "rgba(255,255,255,0.03)",
                      }}
                    >
                      <div
                        className="w-full h-10 rounded-lg flex items-center px-2 gap-1.5"
                        style={{
                          background: t.bg,
                          border: "1px solid rgba(255,255,255,0.08)",
                        }}
                      >
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ background: t.accent }}
                        />
                        <div
                          className="flex-1 h-1.5 rounded-full"
                          style={{ background: "rgba(255,255,255,0.15)" }}
                        />
                        <div
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ background: "rgba(255,255,255,0.1)" }}
                        />
                      </div>
                      <span
                        className="text-[11px]"
                        style={{
                          color:
                            theme === t.id ? t.accent : "var(--text-muted)",
                        }}
                      >
                        {t.label}
                      </span>
                      {theme === t.id && (
                        <div
                          className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full flex items-center justify-center"
                          style={{ background: t.accent }}
                        >
                          <Check size={9} className="text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                <div>
                  <div
                    className="text-xs font-medium mb-2.5"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Accent Color
                  </div>
                  <div className="flex gap-2.5 flex-wrap">
                    {ACCENT_COLORS.map((c) => (
                      <button
                        key={c.color}
                        title={c.label}
                        onClick={() => handleAccentChange(c.color)}
                        className="w-8 h-8 rounded-full transition-all hover:scale-110 flex items-center justify-center"
                        style={{
                          background: c.color,
                          boxShadow:
                            selectedAccent === c.color
                              ? `0 0 0 3px rgba(255,255,255,0.3), 0 0 0 5px ${c.color}60`
                              : "none",
                          transform:
                            selectedAccent === c.color
                              ? "scale(1.15)"
                              : undefined,
                        }}
                      >
                        {selectedAccent === c.color && (
                          <Check size={12} className="text-white" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div
                  className="p-3 rounded-xl border text-xs"
                  style={{
                    background: "var(--bg-800)",
                    borderColor: "var(--border)",
                    color: "var(--text-muted)",
                  }}
                >
                  ✅ Theme and accent color are saved and applied instantly.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
