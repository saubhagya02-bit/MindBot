import { createContext, useContext, useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";

const AuthContext = createContext(null);

const USERS_KEY = "mindbot_users";
const SESSION_KEY = "mindbot_session";
const GUEST_USAGE_KEY = "mindbot_guest_used";
const GUEST_LIMIT = 1;

function getUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
  } catch {
    return [];
  }
}
function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}
function getSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [guestMessageCount, setGuestMessageCount] = useState(0);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [showAccountSettings, setShowAccountSettings] = useState(false);
  const [theme, setThemeState] = useState(
    () => localStorage.getItem("mindbot_theme") || "dark",
  );

  useEffect(() => {
    const session = getSession();
    if (session) setUser(session);
    const used = parseInt(localStorage.getItem(GUEST_USAGE_KEY) || "0");
    setGuestMessageCount(used);
    setLoading(false);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("mindbot_theme", theme);
  }, [theme]);

  const setTheme = (t) => setThemeState(t);

  const incrementGuestUsage = () => {
    const next = guestMessageCount + 1;
    setGuestMessageCount(next);
    localStorage.setItem(GUEST_USAGE_KEY, String(next));
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
    const sessionUser = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
    localStorage.removeItem(GUEST_USAGE_KEY);
    setGuestMessageCount(0);
    setShowAuthPrompt(false);
    setUser(sessionUser);
    return { success: true };
  };

  const login = (email, password) => {
    const users = getUsers();
    const found = users.find(
      (u) => u.email === email.trim().toLowerCase() && u.password === password,
    );
    if (!found) return { error: "Invalid email or password." };
    const sessionUser = { id: found.id, name: found.name, email: found.email };
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
    localStorage.removeItem(GUEST_USAGE_KEY);
    setGuestMessageCount(0);
    setShowAuthPrompt(false);
    setUser(sessionUser);
    return { success: true };
  };

  const updateProfile = (updates) => {
    const users = getUsers();
    const idx = users.findIndex((u) => u.id === user.id);
    if (idx === -1) return { error: "User not found." };

    if (updates.email && updates.email !== user.email) {
      const emailTaken = users.find(
        (u) =>
          u.email === updates.email.trim().toLowerCase() && u.id !== user.id,
      );
      if (emailTaken) return { error: "Email already in use." };
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

    const sessionUser = {
      id: updated.id,
      name: updated.name,
      email: updated.email,
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
    setUser(sessionUser);
    return { success: true };
  };

  const logout = () => {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(GUEST_USAGE_KEY);
    setGuestMessageCount(0);
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
