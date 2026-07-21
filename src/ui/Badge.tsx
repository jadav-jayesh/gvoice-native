import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../core/theme/ThemeProvider";
import type { BadgeTone } from "../core/lib/format";

// Maps a BadgeTone (from format.ts) to theme colours. The web app uses Tailwind
// classes for the same tones; native resolves them to real colour values here.
export function Badge({ label, tone = "neutral" }: { label: string; tone?: BadgeTone }) {
  const { theme } = useTheme();
  const color =
    tone === "positive"
      ? theme.color.success
      : tone === "negative"
        ? theme.color.danger
        : tone === "warn"
          ? theme.color.warning
          : tone === "info" || tone === "brand"
            ? theme.color.accent
            : theme.color.inkMute;

  return (
    <View style={[styles.pill, { backgroundColor: color + "22", borderRadius: theme.radii.pill }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 4, alignSelf: "flex-start" },
  dot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  text: { fontSize: 12, fontWeight: "600" }
});
