import type { SentimentLabel } from "../api/types";
import type { BadgeTone } from "./format";
import type { AppTheme } from "../theme/themes";

// Fixed sentiment swatch colours (match web sentimentSwatch/SentimentDot).
export function sentimentHex(label?: SentimentLabel): string {
  return label === "positive" ? "#10B981" : label === "negative" ? "#dc2626" : "#94a3b8";
}

// Resolve a BadgeTone (from format.ts) to a concrete theme colour.
export function toneColor(tone: BadgeTone, theme: AppTheme): string {
  switch (tone) {
    case "positive":
      return theme.color.success;
    case "negative":
      return theme.color.danger;
    case "warn":
      return theme.color.warning;
    case "info":
    case "brand":
      return theme.color.accent;
    default:
      return theme.color.inkMute;
  }
}
