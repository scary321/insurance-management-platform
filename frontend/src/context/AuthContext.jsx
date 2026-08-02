import { createContext, useContext, useState, useCallback } from "react";
import api from "../api/client.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("imp_user");
    return raw ? JSON.parse(raw) : null;
  });

  const login = useCallback(async (email, password) => {
    const { data } = await api.post("/api/auth/login", { email, password });
    const { token, user } = data.data;
    localStorage.setItem("imp_token", token);
    localStorage.setItem("imp_user", JSON.stringify(user));
    setUser(user);
    return user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("imp_token");
    localStorage.removeItem("imp_user");
    setUser(null);
  }, []);

  const isStaff = user && (user.role === "administrator" || user.role === "agent");

  return (
    <AuthContext.Provider value={{ user, isStaff, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
