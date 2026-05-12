import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

const USERS_KEY = "mindbot_users";
const SESSION_KEY = "mindbot_session";

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

  useEffect(() => {
    const session = getSession();
    if (session) setUser(session);
    setLoading(false);
  }, []);

  const register = (name, email, password) => {
    const users = getUsers();
    if (users.find((u) => u.email === email)) {
      return { error: "An account with this email already exists." };
    }
    const newUser = {
      id: Date.now().toString(),
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
    setUser(sessionUser);
    return { success: true };
  };

  const logout = () => {
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
