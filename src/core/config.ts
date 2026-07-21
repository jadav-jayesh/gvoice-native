import Constants from "expo-constants";

// Single place the whole app learns which backend to talk to. Sourced from
// app.json -> expo.extra.apiBaseUrl so build profiles (dev / preview / prod)
// can override it without touching code. Falls back to the live server.
//
// NOTE: auth cookies are `secure: true`, so this MUST be an https:// origin.
// A plain http://localhost backend will silently fail to set the session
// cookie on a real device.
const extra = (Constants.expoConfig?.extra ?? {}) as { apiBaseUrl?: string };

export const API_BASE_URL = extra.apiBaseUrl ?? "https://20.198.80.63.nip.io";
