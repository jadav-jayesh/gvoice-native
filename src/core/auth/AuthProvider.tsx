import React, { useEffect } from "react";
import { setUnauthorizedHandler } from "../api/client";
import { nativeCookieStore } from "../api/cookieStore";
import { getMe, login as loginRequest, logout as logoutRequest } from "../api/endpoints";
import { useAuthStore } from "../store/authStore";

// Bootstraps the session on launch and wires the global 401 handler. Any 401
// that survives a refresh clears the user, which flips the navigator to the
// auth stack (same behaviour as the web app's setUnauthorizedHandler).
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const setUser = useAuthStore((s) => s.setUser);
  const setReady = useAuthStore((s) => s.setReady);

  useEffect(() => {
    setUnauthorizedHandler(() => setUser(null));

    let alive = true;
    getMe()
      .then((res) => {
        if (alive) setUser(res.user);
      })
      .catch(() => {
        // Not logged in (or refresh failed) — stay logged out.
        if (alive) setUser(null);
      })
      .finally(() => {
        if (alive) setReady(true);
      });

    return () => {
      alive = false;
      setUnauthorizedHandler(null);
    };
  }, [setUser, setReady]);

  return <>{children}</>;
}

// Actions + state for screens. Login/logout update the store after the network
// call so the navigator reacts immediately.
export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const ready = useAuthStore((s) => s.ready);
  const setUser = useAuthStore((s) => s.setUser);

  async function signIn(email: string, password: string) {
    const res = await loginRequest({ email, password });
    setUser(res.user);
    return res.user;
  }

  async function signOut() {
    try {
      await logoutRequest();
    } catch {
      // Best-effort: even if the server call fails, drop the local session.
    } finally {
      await nativeCookieStore.clearAll().catch(() => undefined);
      setUser(null);
    }
  }

  return { user, ready, signIn, signOut };
}
