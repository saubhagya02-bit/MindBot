import { createContext, useContext, useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";

const AuthContext = createContext(null);

const USERS_KEY = "mindbot_users";
const SESSION_KEY = "mindbot_session";
const GUEST_KEY = "mindbot_guest_used";
const THEME_KEY = "mindbot_theme";
const ACCENT_KEY = "mindbot_accent";
const GUEST_LIMIT = 1;

function getUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
  } catch {
    return [];
  }
}
function saveUsers(u) {
  localStorage.setItem(USERS_KEY, JSON.stringify(u));
}
function getSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
  } catch {
    return null;
  }
}

function applyTheme(themeId) {
  document.documentElement.setAttribute("data-theme", themeId || "dark");
}
function applyAccent(color) {
  if (!color) return;
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
    .text-gem-400, .text-gem-500 { color: ${color} !important; }
    .border-gem-500\\/20 { border-color: ${color}33 !important; }
    .border-gem-500\\/50 { border-color: ${color}80 !important; }
    .focus-within\\:border-gem-500\\/50:focus-within { border-color: ${color}80 !important; }
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
    const savedTheme = localStorage.getItem(THEME_KEY) || "dark";
    const savedAccent = localStorage.getItem(ACCENT_KEY) || null;
    applyTheme(savedTheme);
    if (savedAccent) applyAccent(savedAccent);

    const session = getSession();
    if (session) setUser(session);
    const used = parseInt(localStorage.getItem(GUEST_KEY) || "0");
    setGuestCount(used);
    setLoading(false);
  }, []);

  const setTheme = (t) => {
    setThemeState(t);
    applyTheme(t);
    localStorage.setItem(THEME_KEY, t);
  };

  const incrementGuestUsage = () => {
    const next = guestMessageCount + 1;
    setGuestCount(next);
    localStorage.setItem(GUEST_KEY, String(next));
    if (next >= GUEST_LIMIT) setTimeout(() => setShowAuthPrompt(true), 1500);
  };

  const guestCanChat = guestMessageCount < GUEST_LIMIT;
  const guestUserId = "guest";

  const register = (name, email, password) => {
    const users = getUsers();
    if (users.find((u) => u.email === email.trim().toLowerCase()))
      return { error: "An account with this email already exists." };
    const newUser = {
      id: uuidv4(),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
    };
    saveUsers([...users, newUser]);
    const su = { id: newUser.id, name: newUser.name, email: newUser.email };
    localStorage.setItem(SESSION_KEY, JSON.stringify(su));
    localStorage.removeItem(GUEST_KEY);
    setGuestCount(0);
    setShowAuthPrompt(false);
    setUser(su);
    return { success: true };
  };

  const login = (email, password) => {
    const users = getUsers();
    const found = users.find(
      (u) => u.email === email.trim().toLowerCase() && u.password === password,
    );
    if (!found) return { error: "Invalid email or password." };
    const su = { id: found.id, name: found.name, email: found.email };
    localStorage.setItem(SESSION_KEY, JSON.stringify(su));
    localStorage.removeItem(GUEST_KEY);
    setGuestCount(0);
    setShowAuthPrompt(false);
    setUser(su);
    return { success: true };
  };

  const updateProfile = (updates) => {
    const users = getUsers();
    const idx = users.findIndex((u) => u.id === user.id);
    if (idx === -1) return { error: "User not found." };
    if (updates.email && updates.email !== user.email) {
      const taken = users.find(
        (u) => u.email === updates.email && u.id !== user.id,
      );
      if (taken) return { error: "Email already in use." };
    }
    if (updates.newPassword) {
      if (users[idx].password !== updates.currentPassword)
        return { error: "Current password is incorrect." };
      updates.password = updates.newPassword;
    }
    const updated = { ...users[idx], ...updates };
    delete updated.newPassword;
    delete updated.currentPassword;
    users[idx] = updated;
    saveUsers(users);
    const su = { id: updated.id, name: updated.name, email: updated.email };
    localStorage.setItem(SESSION_KEY, JSON.stringify(su));
    setUser(su);
    return { success: true };
  };

  const logout = () => {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(GUEST_KEY);
    setGuestCount(0);
    setShowAuthPrompt(false);
    setShowAccountSettings(false);
    setUser(null);
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
