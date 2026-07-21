import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Appearance } from "react-native";
import { themes, type AppTheme, type ThemeMode } from "./themes";

// Mirrors web/src/theme/ThemeProvider.tsx: a three-way preference
// (light | dark | system), persisted, that follows the OS when set to system.
export type ThemePreference = ThemeMode | "system";

interface ThemeCtx {
  theme: AppTheme;
  mode: ThemeMode;
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
  toggle: () => void;
}

const STORAGE_KEY = "gvoice:theme";
const ThemeContext = createContext<ThemeCtx | null>(null);

function systemMode(): ThemeMode {
  return Appearance.getColorScheme() === "dark" ? "dark" : "light";
}

function resolve(pref: ThemePreference, sys: ThemeMode): ThemeMode {
  return pref === "system" ? sys : pref;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Seed from the OS immediately so first paint is close; correct once the
  // stored preference loads from AsyncStorage (async).
  const [preference, setPreferenceState] = useState<ThemePreference>("system");
  const [sys, setSys] = useState<ThemeMode>(systemMode);

  // Load persisted preference on mount.
  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (!alive) return;
        if (stored === "light" || stored === "dark" || stored === "system") {
          setPreferenceState(stored);
        }
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  // Follow OS changes (only matters visually when preference === "system").
  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      setSys(colorScheme === "dark" ? "dark" : "light");
    });
    return () => sub.remove();
  }, []);

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => undefined);
  }, []);

  const mode = resolve(preference, sys);

  const toggle = useCallback(() => {
    // Flip the *resolved* mode into an explicit preference (drops "system").
    setPreference(mode === "dark" ? "light" : "dark");
  }, [mode, setPreference]);

  const value = useMemo<ThemeCtx>(
    () => ({ theme: themes[mode], mode, preference, setPreference, toggle }),
    [mode, preference, setPreference, toggle]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeCtx {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}
