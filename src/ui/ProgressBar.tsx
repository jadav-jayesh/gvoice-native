import React from "react";
import { View } from "react-native";
import { useTheme } from "../core/theme/ThemeProvider";

// Horizontal track + fill. `value` is 0..1. Used for tone bars, talk-time share,
// completion, per-speaker segment counts.
export function ProgressBar({ value, color, height = 8 }: { value: number; color?: string; height?: number }) {
  const { theme } = useTheme();
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <View style={{ height, borderRadius: height, backgroundColor: theme.color.surfaceMax, overflow: "hidden" }}>
      <View style={{ width: `${pct}%`, height: "100%", backgroundColor: color ?? theme.color.accent, borderRadius: height }} />
    </View>
  );
}
