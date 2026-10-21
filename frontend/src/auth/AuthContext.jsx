import { useCallback, useEffect, useMemo, useState } from "react";
import { apiRequest } from "../api/client";
import { AUTH_EXPIRED_EVENT, AuthContext } from "./authContext";
import { clearSession, getSession, saveSession } from "./tokenStorage";

export function AuthProvider({ children }) {
  const [session, setSession] = useState(getSession);

  const login = useCallback(async ({ username, password, remember }) => {
    const result = await apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password, remember }),
    });
    const next = { token: result.token, user: result.user };
    saveSession(next, remember);
    setSession(next);
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setSession(null);
  }, []);

  // API hoặc Socket.IO báo token hết hạn/không hợp lệ thì đăng xuất để quay về trang Login.
  useEffect(() => {
    window.addEventListener(AUTH_EXPIRED_EVENT, logout);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, logout);
  }, [logout]);

  const value = useMemo(
    () => ({
      isAuthenticated: Boolean(session?.token),
      user: session?.user ?? null,
      login,
      logout,
    }),
    [session, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
