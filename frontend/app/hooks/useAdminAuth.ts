"use client";

import { useCallback, useEffect, useState } from "react";
import { getAdminAuthState, adminLogout as clearAdminAuth, type AdminAuthState } from "@/lib/auth";

// Session admin totalement séparée de useAuth() (site) — stockage admin_* dédié.
export function useAdminAuth() {
  const [auth, setAuth] = useState<AdminAuthState>({ token: null, role: null, email: null });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sync = () => setAuth(getAdminAuthState());
    sync();
    setReady(true);
    window.addEventListener("storage", sync);
    window.addEventListener("adminauthchange", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("adminauthchange", sync);
    };
  }, []);

  const logout = useCallback(() => {
    clearAdminAuth();
    setAuth({ token: null, role: null, email: null });
  }, []);

  return {
    ...auth,
    ready,
    isAuthenticated: Boolean(auth.token),
    logout,
  };
}
