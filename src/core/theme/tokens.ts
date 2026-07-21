// Vendored from web/src/theme/theme.config.js — same aqua values, but scales are
// plain numbers (RN uses unitless px) instead of "16px" strings, and the CSS
// variable maps become a typed record we build JS themes from (themes.ts).
// DO NOT diverge the colours from the web config — this is the shared design.

export const aqua = {
  accent: "#06B6D4",
  accentSoft: "#67E8F9",
  accentDeep: "#0E7490",
  accentBg: "#ECFEFF",
  accentBg2: "#CFFAFE",
  cyan: "#22D3EE",
  pink: "#F472B6",
  peach: "#FDA4AF",
  mint: "#86EFAC"
} as const;

export const brandScale = {
  50: "#ECFEFF",
  100: "#CFFAFE",
  200: "#A5F3FC",
  300: "#67E8F9",
  400: "#22D3EE",
  500: "#06B6D4",
  600: "#0891B2",
  700: "#0E7490"
} as const;

export const semantic = {
  success: "#10B981",
  danger: "#EF4444",
  warning: "#F59E0B",
  white: "#FFFFFF"
} as const;

// Unitless numbers (web used "6px" etc).
export const radii = { xs: 6, sm: 10, md: 14, lg: 20, xl: 28, pill: 999 } as const;

export const spacing = { xxs: 4, xs: 8, sm: 12, md: 16, lg: 24, xl: 32, xxl: 48 } as const;

export const fontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  base: 16,
  lg: 18,
  xl: 22,
  xxl: 28,
  display: 36,
  hero: 48
} as const;

// Stable aqua gradient pair per string (avatars, category colouring).
export const GRADIENTS: ReadonlyArray<readonly [string, string]> = [
  ["#06B6D4", "#67E8F9"],
  ["#0E7490", "#22D3EE"],
  ["#22D3EE", "#86EFAC"],
  ["#06B6D4", "#0E7490"],
  ["#67E8F9", "#06B6D4"],
  ["#0891B2", "#22D3EE"]
];

export function gradientFromString(s = ""): readonly [string, string] {
  const seed = [...String(s)].reduce((a, c) => a + c.charCodeAt(0), 0);
  return GRADIENTS[seed % GRADIENTS.length];
}

// Per-mode colour values. Keys mirror the web CSS variables (--bg -> bg) so the
// mapping to a JS theme in themes.ts is 1:1 and future edits stay traceable.
export const cssVars = {
  light: {
    bg: "#F7F7F9",
    bgElev: "#FFFFFF",
    surface: "#FFFFFF",
    surfaceHi: "#F2F2F5",
    surfaceMax: "#E7E7EC",
    line: "#E7E7EC",
    lineHi: "#D4D4DC",
    ink: "#0F1115",
    inkSoft: "#4B5563",
    inkMute: "#686B77",
    inkFaint: "#9097A3",
    ring: "#06B6D4"
  },
  dark: {
    bg: "#09090c",
    bgElev: "#0f1015",
    surface: "#121319",
    surfaceHi: "#1a1c23",
    surfaceMax: "#22242c",
    line: "#272933",
    lineHi: "#383b48",
    ink: "#f7f8fb",
    inkSoft: "#d4d6dd",
    inkMute: "#9b9faa",
    inkFaint: "#696c77",
    ring: "#22D3EE"
  }
} as const;
