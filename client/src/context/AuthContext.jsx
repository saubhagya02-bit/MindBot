import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

const THEME_KEY = "mindbot_theme";
const ACCENT_KEY = "mindbot_accent";
const GUEST_KEY = "mindbot_guest_used";
const GUEST_LIMIT = 1;

function applyTheme(themeId) {
  document.documentElement.setAttribute("data-theme", themeId || "dark");
  localStorage.setItem(THEME_KEY, themeId);
}

function applyAccent(color) {
  if (!color) return;
  localStorage.setItem(ACCENT_KEY, color);
  document.documentElement.style.setProperty("--accent", color);
  let el = document.getElementById("mindbot-accent");
  if (!el) {
    el = document.createElement("style");
    el.id = "mindbot-accent";
    document.head.appendChild(el);
  }
  el.textContent = `
    .bg-gem-500 { background-color: ${color} !important; }
    .hover\\:bg-gem-600:hover { background-color: ${color}cc !important; }
    .text-gem-400,.text-gem-500 { color: ${color} !important; }
    .border-gem-500\\/20 { border-color: ${color}33 !important; }
    .border-gem-500\\/50 { border-color: ${color}80 !important; }
    .bg-gem-500\\/10 { background-color: ${color}1a !important; }
    .bg-gem-500\\/15 { background-color: ${color}26 !important; }
  `;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [guestMessageCount, setGuestCount] = useState(0);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [showAccountSettings, setShowAccountSettings] = useState(false);
  const [theme, setThemeState] = useState(
    () => localStorage.getItem(THEME_KEY) || "dark",
  );

  useEffect(() => {
    applyTheme(localStorage.getItem(THEME_KEY) || "dark");
    const savedAccent = localStorage.getItem(ACCENT_KEY);
    if (savedAccent) applyAccent(savedAccent);

    const used = parseInt(localStorage.getItem(GUEST_KEY) || "0");
    setGuestCount(used);

    fetch("/api/auth/me", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) setUser(data.user);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const setTheme = (t) => {
    setThemeState(t);
    applyTheme(t);
  };

  const incrementGuestUsage = () => {
    const next = guestMessageCount + 1;
    setGuestCount(next);
    localStorage.setItem(GUEST_KEY, String(next));
    if (next >= GUEST_LIMIT) setTimeout(() => setShowAuthPrompt(true), 1500);
  };

  const guestCanChat = guestMessageCount < GUEST_LIMIT;
  const guestUserId = "guest";

  // Register
  const register = async (name, email, password) => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) return { error: data.error || "Registration failed." };
      localStorage.removeItem(GUEST_KEY);
      setGuestCount(0);
      setShowAuthPrompt(false);
      setUser(data.user);
      return { success: true };
    } catch {
      return { error: "Network error. Please try again." };
    }
  };

  // Login
  const login = async (email, password) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) return { error: data.error || "Login failed." };
      localStorage.removeItem(GUEST_KEY);
      setGuestCount(0);
      setShowAuthPrompt(false);
      setUser(data.user);
      return { success: true };
    } catch {
      return { error: "Network error. Please try again." };
    }
  };

  // Logout
  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    localStorage.removeItem(GUEST_KEY);
    setGuestCount(0);
    setShowAuthPrompt(false);
    setShowAccountSettings(false);
    setUser(null);
  };

  // Update profile
  const updateProfile = async (updates) => {
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (!res.ok) return { error: data.error || "Update failed." };
      setUser(data.user);
      return { success: true };
    } catch {
      return { error: "Network error." };
    }
  };

  // Change password
  const changePassword = async (currentPassword, newPassword) => {
    try {
      const res = await fetch("/api/auth/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) return { error: data.error || "Password change failed." };
      return { success: true };
    } catch {
      return { error: "Network error." };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        guestUserId,
        guestCanChat,
        guestMessageCount,
        guestLimit: GUEST_LIMIT,
        showAuthPrompt,
        setShowAuthPrompt,
        showAccountSettings,
        setShowAccountSettings,
        theme,
        setTheme,
        applyAccent,
        incrementGuestUsage,
        register,
        login,
        logout,
        updateProfile,
        changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
