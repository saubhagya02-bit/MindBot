import { useState } from "react";
import { Sparkles, Eye, EyeOff, Loader2, X, MessageSquare } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

export default function AuthPrompt() {
  const { login, register, continueAsGuest, setShowAuthPrompt } = useAuth();
  const [mode, setMode] = useState("register");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    setError("");
  };

  const handleSubmit = async () => {
    setError("");
    if (mode === "register" && !form.name.trim())
      return setError("Name is required.");
    if (!form.email.trim()) return setError("Email is required.");
    if (!form.password) return setError("Password is required.");
    if (mode === "register" && form.password.length < 6)
      return setError("Min 6 characters.");

    setLoading(true);
    await new Promise((r) => setTimeout(r, 400));
    const result =
      mode === "login"
        ? login(form.email, form.password)
        : register(form.name, form.email, form.password);
    if (result.error) {
      setError(result.error);
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backdropFilter: "blur(8px)", background: "rgba(7,8,16,0.85)" }}
    >
      <div className="w-full max-w-md bg-base-900 border border-base-700/60 rounded-2xl shadow-2xl overflow-hidden animate-fade-up">
        {/* Header */}
        <div className="relative px-6 pt-6 pb-4 border-b border-base-800 text-center">
          <button
            onClick={() => setShowAuthPrompt(false)}
            className="absolute top-4 right-4 text-slate-600 hover:text-slate-400 transition-colors"
          >
            <X size={18} />
          </button>
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gem-400 via-accent-purple to-accent-teal flex items-center justify-center mx-auto mb-3">
            <Sparkles size={22} className="text-white" />
          </div>
          <h2 className="text-lg font-display font-bold text-white">
            Enjoying MindBot?
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Create a free account to unlock unlimited chats and save your
            history.
          </p>

          <div className="flex items-center justify-center gap-2 mt-3 px-3 py-2 bg-gem-500/10 border border-gem-500/20 rounded-xl">
            <MessageSquare size={13} className="text-gem-400" />
            <span className="text-xs text-gem-400 font-medium">
              You've used your 1 free message
            </span>
          </div>
        </div>

        <div className="px-6 py-5">
          <div className="flex gap-1 p-1 bg-base-800 rounded-xl mb-5">
            {["register", "login"].map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMode(m);
                  setError("");
                }}
                className={`flex-1 py-2 rounded-lg text-[13px] font-medium transition-all ${
                  mode === m
                    ? "bg-gem-500 text-white shadow-md"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                {m === "register" ? "Create Account" : "Sign In"}
              </button>
            ))}
          </div>

          <div className="space-y-3.5">
            {mode === "register" && (
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  placeholder="Your Name"
                  className="w-full px-3.5 py-2.5 bg-base-800 border border-base-700 rounded-xl text-slate-200 text-sm outline-none placeholder-slate-600 focus:border-gem-500/60 transition-colors"
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                placeholder="you@example.com"
                className="w-full px-3.5 py-2.5 bg-base-800 border border-base-700 rounded-xl text-slate-200 text-sm outline-none placeholder-slate-600 focus:border-gem-500/60 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => set("password", e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  placeholder={
                    mode === "register"
                      ? "At least 6 characters"
                      : "Your password"
                  }
                  className="w-full px-3.5 py-2.5 pr-10 bg-base-800 border border-base-700 rounded-xl text-slate-200 text-sm outline-none placeholder-slate-600 focus:border-gem-500/60 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400"
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="px-3 py-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs">
                {error}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full py-2.5 bg-gem-500 hover:bg-gem-600 disabled:opacity-60 text-white rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 active:scale-95 mt-1"
            >
              {loading && <Loader2 size={15} className="animate-spin" />}
              {mode === "register" ? "Create Free Account" : "Sign In"}
            </button>

            <button
              onClick={() => setShowAuthPrompt(false)}
              className="w-full py-2 text-slate-600 hover:text-slate-400 text-xs transition-colors"
            >
              Maybe later (chat history won't be saved)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
