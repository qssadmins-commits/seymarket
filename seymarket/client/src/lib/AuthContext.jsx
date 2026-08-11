import React, { createContext, useContext, useEffect, useState } from "react";
import { api } from "./api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [seller, setSeller] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.me().then(setSeller).catch(() => setSeller(null)).finally(() => setLoading(false));
  }, []);

  const login = async (payload) => {
    const s = await api.login(payload);
    setSeller(s);
    return s;
  };
  const signup = async (payload) => {
    const s = await api.signup(payload);
    setSeller(s);
    return s;
  };
  const logout = async () => {
    await api.logout();
    setSeller(null);
  };

  return (
    <AuthContext.Provider value={{ seller, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
