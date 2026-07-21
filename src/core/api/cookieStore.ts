import CookieManager from "@react-native-cookies/cookies";
import { API_BASE_URL } from "../config";

// The web client reads document.cookie. React Native has no document, so we
// abstract "read a cookie by name" behind this interface. The httpOnly session
// cookies (`token`, `refresh_token`) are never read here — the native network
// stack stores and re-attaches them automatically (the equivalent of the web's
// `credentials: "include"`). We only need the non-httpOnly `csrf` value to echo
// it back as a header on writes (double-submit CSRF).
export interface CookieStore {
  getCookie(name: string): Promise<string | null>;
  // Full "name=value; name2=value2" header of every cookie for the API origin.
  // Needed for expo-file-system's uploader, which uses its own networking stack
  // and does NOT share the app's cookie jar, so the session cookies must be
  // attached explicitly. On Android CookieManager.get returns httpOnly cookies
  // (token/refresh) too, so the upload can authenticate.
  getCookieHeader(): Promise<string>;
  clearAll(): Promise<void>;
}

export const nativeCookieStore: CookieStore = {
  async getCookie(name) {
    const cookies = await CookieManager.get(API_BASE_URL);
    return cookies[name]?.value ?? null;
  },
  async getCookieHeader() {
    const cookies = await CookieManager.get(API_BASE_URL);
    return Object.entries(cookies)
      .map(([name, c]) => `${name}=${c.value}`)
      .join("; ");
  },
  async clearAll() {
    await CookieManager.clearAll();
  }
};
