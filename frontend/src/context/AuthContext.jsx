import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { authService } from "../services/authService";
import { setAuthToken, setUnauthorizedHandler } from "../services/api";
import { TOKEN_STORAGE_KEY } from "../utils/constants";

/* eslint-disable react-refresh/only-export-components */

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  // `loading` covers the initial "is there a valid stored session" check -
  // Section: "Authentication flow" -> AuthContext initializes -> check
  // stored token -> GET /api/auth/me -> restore or clear.
  const [loading, setLoading] = useState(true);

  const clearAuth = useCallback(() => {
    setUser(null);
    setToken(null);
    setAuthToken(null);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }, []);

  const applyAuth = useCallback((newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
    setAuthToken(newToken);
    localStorage.setItem(TOKEN_STORAGE_KEY, newToken);
  }, []);

  // Register the 401 handler once - api.js has no React/router access
  // itself, so it calls back into here whenever any request comes back
  // unauthorized (expired/invalid token), and this clears state so
  // ProtectedRoute re-renders into the login redirect.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearAuth();
    });
  }, [clearAuth]);

  // Restore session on first load.
  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!stored) {
      setLoading(false);
      return;
    }
    setAuthToken(stored);
    authService
      .me()
      .then(({ data }) => {
        setToken(stored);
        setUser(data);
      })
      .catch(() => {
        clearAuth();
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(
    async (email, password) => {
      const { data } = await authService.login({ email, password });
      applyAuth(data.token, data.user);
      return data.user;
    },
    [applyAuth]
  );

  const register = useCallback(
    async (payload) => {
      const { data } = await authService.register(payload);
      applyAuth(data.token, data.user);
      return data.user;
    },
    [applyAuth]
  );

  const logout = useCallback(() => {
    clearAuth();
  }, [clearAuth]);

  const refreshUser = useCallback(async () => {
    const { data } = await authService.me();
    setUser(data);
    return data;
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      isAuthenticated: Boolean(user && token),
      login,
      register,
      logout,
      refreshUser,
    }),
    [user, token, loading, login, register, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
