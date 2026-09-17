import { useState } from "react";
import { AUTH_STORAGE_KEY, AuthContext } from "./authContext";

function hasStoredSession() {
  return (
    localStorage.getItem(AUTH_STORAGE_KEY) === "true" ||
    sessionStorage.getItem(AUTH_STORAGE_KEY) === "true"
  );
}

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(hasStoredSession);

  function login({ remember }) {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    sessionStorage.removeItem(AUTH_STORAGE_KEY);

    const storage = remember ? localStorage : sessionStorage;
    storage.setItem(AUTH_STORAGE_KEY, "true");
    setIsAuthenticated(true);
  }

  function logout() {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
    setIsAuthenticated(false);
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
