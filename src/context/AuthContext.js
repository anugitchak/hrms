import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  const login = useCallback((nextToken, nextUser) => {
    setToken(nextToken);
    setUser(nextUser);
    sessionStorage.setItem("token", nextToken);
    sessionStorage.setItem("user", JSON.stringify(nextUser));
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
  }, []);

  const refreshUser = useCallback(async (currentToken) => {
    const tokenToUse = currentToken || token || sessionStorage.getItem("token");
    if (!tokenToUse) return;

    try {
      const response = await api.get("/user", {
        headers: { Authorization: `Bearer ${tokenToUse}` }
      });
      const userData = response.data;
      setUser(userData);
      sessionStorage.setItem("user", JSON.stringify(userData));
    } catch (error) {
      console.error("Failed to refresh user data", error);
      // Optional: if 401, maybe logout? But allow soft fail for now 
      // to avoid logout loops on network errors.
      if (error.response && error.response.status === 401) {
        logout();
      }
    }
  }, [token, logout]);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = sessionStorage.getItem("token");
      const storedUser = sessionStorage.getItem("user");

      if (storedToken) {
        setToken(storedToken);
        // Optimistically set stored user first
        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser));
          } catch {
            // ignore parse error
          }
        }
        // Then fetch fresh data
        await refreshUser(storedToken);
      }
      setIsBootstrapping(false);
    };

    initAuth();
  }, [refreshUser]);

  useEffect(() => {
    if (!token) return;

    const syncUser = () => {
      refreshUser(token);
    };

    const onFocus = () => {
      syncUser();
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        syncUser();
      }
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibilityChange);
    const intervalId = window.setInterval(syncUser, 5 * 60 * 1000);

    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.clearInterval(intervalId);
    };
  }, [token, refreshUser]);

  /**
   * hasPermission — check if the current user has a specific permission.
   * SuperAdmin (role_id === 1) always returns true.
   * All others check the boolean column on the user object.
   */
  const hasPermission = useCallback((key) => {
    if (!user) return false;
    if (user.role_id === 1) return true; // SuperAdmin bypass
    return Boolean(user[key]);
  }, [user]);

  const value = {
    user,
    token,
    isBootstrapping,
    login,
    logout,
    refreshUser,
    hasPermission,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
};


