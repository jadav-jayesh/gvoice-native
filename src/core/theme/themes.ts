import { aqua, brandScale, cssVars, fontSize, radii, semantic, spacing } from "./tokens";

export type ThemeMode = "light" | "dark";

// One resolved theme object per mode. Components read from useTheme() instead of
// hard-coding colours, so a single toggle re-themes the whole tree. Brand and
// semantic colours are constant across modes (only the neutral surfaces/ink
// swap) — matching the web app exactly.
export interface AppTheme {
  mode: ThemeMode;
  color: {
    bg: string;
    bgElev: string;
    surface: string;
    surfaceHi: string;
    surfaceMax: string;
    line: string;
    lineHi: string;
    ink: string;
    inkSoft: string;
    inkMute: string;
    inkFaint: string;
    ring: string;
    accent: string;
    accentSoft: string;
    accentDeep: string;
    brand: string;
    success: string;
    danger: string;
    warning: string;
  };
  radii: typeof radii;
  spacing: typeof spacing;
  fontSize: typeof fontSize;
  brandScale: typeof brandScale;
}

function build(mode: ThemeMode): AppTheme {
  const v = cssVars[mode];
  return {
    mode,
    color: {
      ...v,
      accent: aqua.accent,
      accentSoft: aqua.accentSoft,
      accentDeep: aqua.accentDeep,
      brand: brandScale[500],
      success: semantic.success,
      danger: semantic.danger,
      warning: semantic.warning
    },
    radii,
    spacing,
    fontSize,
    brandScale
  };
}

export const themes: Record<ThemeMode, AppTheme> = {
  light: build("light"),
  dark: build("dark")
};
