import React, { createContext, useContext, useEffect, useState } from "react";
import API from "../services/api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);        // { userName, userType, ... }
  const [loading, setLoading] = useState(true);  // auth yükleniyor mu?

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await API.get("/auth/me");   // backend: oturum/token'e göre döner
        if (alive) setUser(res.data ?? null);
      } catch {
        if (alive) setUser(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const value = { user, setUser, loading };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
