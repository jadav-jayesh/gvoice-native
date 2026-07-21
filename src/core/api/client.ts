import { API_BASE_URL } from "../config";
import { nativeCookieStore, type CookieStore } from "./cookieStore";

// Transport layer — a near-verbatim port of web/src/lib/api.ts's request/
// rawFetch/performRefresh. The only differences from web:
//   1. every path is prefixed with API_BASE_URL (native has no same-origin).
//   2. the csrf cookie is read via an injected CookieStore (no document.cookie).
// Behaviour is otherwise identical: cookies flow automatically, writes carry
// the csrf header, and a 401 triggers a single-flight refresh + one retry.

export class UnauthorizedError extends Error {
  constructor() {
    super("unauthorized");
    this.name = "UnauthorizedError";
  }
}

type OnUnauthorized = () => void;
let onUnauthorized: OnUnauthorized | null = null;

// AuthProvider registers a callback so any 401 from any endpoint can clear the
// in-memory user and bounce to login without every caller handling it.
export function setUnauthorizedHandler(handler: OnUnauthorized | null) {
  onUnauthorized = handler;
}

// Swappable for unit tests (inject a fake cookie jar).
let cookieStore: CookieStore = nativeCookieStore;
export function setCookieStore(store: CookieStore) {
  cookieStore = store;
}

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const REFRESH_PATH = "/api/auth/refresh";
const CSRF_COOKIE = "csrf";

// Single-flight refresh — concurrent 401s all await the same attempt.
let refreshInFlight: Promise<boolean> | null = null;

async function performRefresh(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    try {
      const csrf = await cookieStore.getCookie(CSRF_COOKIE);
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (csrf) headers["X-CSRF-Token"] = csrf;
      const res = await fetch(`${API_BASE_URL}${REFRESH_PATH}`, {
        method: "POST",
        credentials: "include",
        headers
      });
      return res.ok;
    } catch {
      return false;
    } finally {
      setTimeout(() => {
        refreshInFlight = null;
      }, 0);
    }
  })();
  return refreshInFlight;
}

async function rawFetch(path: string, init: RequestInit | undefined, method: string): Promise<Response> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((init?.headers as Record<string, string>) ?? {})
  };
  if (!SAFE_METHODS.has(method)) {
    const csrf = await cookieStore.getCookie(CSRF_COOKIE);
    if (csrf) headers["X-CSRF-Token"] = csrf;
  }
  return fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    ...init,
    headers
  });
}

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const method = (init?.method ?? "GET").toUpperCase();

  let response = await rawFetch(path, init, method);

  // Transparent re-auth: on 401 refresh once and retry. Skip for refresh itself
  // (loop) and for login/signup (no session to refresh).
  if (
    response.status === 401 &&
    path !== REFRESH_PATH &&
    !path.endsWith("/api/auth/login") &&
    !path.endsWith("/api/auth/signup")
  ) {
    const refreshed = await performRefresh();
    if (refreshed) {
      response = await rawFetch(path, init, method);
    }
  }

  if (response.status === 401) {
    if (onUnauthorized) onUnauthorized();
    throw new UnauthorizedError();
  }
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`${response.status} ${response.statusText}${body ? ` — ${body}` : ""}`);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

// Unauthenticated GET (public share links) — bypasses 401/refresh entirely.
export async function publicRequest<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`);
  if (res.status === 404) throw new Error("unavailable");
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
}
