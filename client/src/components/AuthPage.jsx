import { useState } from "react";
import { Sparkles, Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

export default function AuthPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState("login");
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
      return setError("Password must be at least 6 characters.");

    setLoading(true);
    await new Promise((r) => setTimeout(r, 400));

    const result =
      mode === "login"
        ? login(form.email, form.password)
        : register(form.name, form.email, form.password);

    if (result.error) setError(result.error);
    setLoading(false);
  };

  const handleKey = (e) => {
    if (e.key === "Enter") handleSubmit();
  };

  return (
    <div className="min-h-screen bg-base-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gem-400 via-accent-purple to-accent-teal flex items-center justify-center mb-4 shadow-2xl shadow-gem-500/20">
            <Sparkles size={26} className="text-white" />
          </div>
          <h1 className="text-2xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-teal-400">
            MindBot Chat
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Powered by Google Gemini AI
          </p>
        </div>

        <div className="bg-base-900 border border-base-700/50 rounded-2xl p-6 shadow-2xl">
          <div className="flex gap-1 p-1 bg-base-800 rounded-xl mb-6">
            {["login", "register"].map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMode(m);
                  setError("");
                  setForm({ name: "", email: "", password: "" });
                }}
                className={`flex-1 py-2 rounded-lg text-[13px] font-medium transition-all ${
                  mode === m
                    ? "bg-gem-500 text-white shadow-md"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                {m === "login" ? "Sign In" : "Create Account"}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {mode === "register" && (
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  onKeyDown={handleKey}
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
                onKeyDown={handleKey}
                placeholder="example@gmail.com"
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
                  onKeyDown={handleKey}
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
              className="w-full py-2.5 bg-gem-500 hover:bg-gem-600 disabled:opacity-60 text-white rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : null}
              {mode === "login" ? "Sign In" : "Create Account"}
            </button>
          </div>

          <p className="text-center text-slate-600 text-xs mt-5">
            {mode === "login"
              ? "Don't have an account? "
              : "Already have an account? "}
            <button
              onClick={() => {
                setMode(mode === "login" ? "register" : "login");
                setError("");
              }}
              className="text-gem-400 hover:text-gem-300 font-medium"
            >
              {mode === "login" ? "Create one" : "Sign in"}
            </button>
          </p>
        </div>

        <p className="text-center text-slate-700 text-xs mt-4">
          Your data is stored locally on this device
        </p>
      </div>
    </div>
  );
}
