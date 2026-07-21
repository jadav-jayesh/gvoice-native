import { create } from "zustand";
import type { User } from "../api/types";

// Thin client-only store. The server owns the session (httpOnly cookies); this
// just holds the resolved user object + a "bootstrap finished" flag so the
// navigator knows whether to show the splash, the auth stack, or the app.
// Server DATA (meetings, insights, ...) lives in TanStack Query, never here.
interface AuthState {
  user: User | null;
  ready: boolean;
  setUser: (user: User | null) => void;
  setReady: (ready: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  ready: false,
  setUser: (user) => set({ user }),
  setReady: (ready) => set({ ready })
}));
