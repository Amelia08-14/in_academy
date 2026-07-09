"use client";

import { useCallback, useEffect, useState } from "react";
import { getAuthState, logout as clearAuth, roleHomeRoute, roleLabel, type AuthState } from "@/lib/auth";

export function useAuth() {
  const [auth, setAuth] = useState<AuthState>({ token: null, role: null, email: null });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sync = () => setAuth(getAuthState());
    sync();
    setReady(true);
    window.addEventListener("storage", sync);
    window.addEventListener("authchange", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("authchange", sync);
    };
  }, []);

  const logout = useCallback(() => {
    clearAuth();
    setAuth({ token: null, role: null, email: null });
  }, []);

  return {
    ...auth,
    ready,
    isAuthenticated: Boolean(auth.token),
    roleLabel: roleLabel(auth.role),
    homeRoute: roleHomeRoute(auth.role),
    logout,
  };
}
