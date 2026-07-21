import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, type ViewStyle } from "react-native";
import { useTheme } from "../core/theme/ThemeProvider";

type Variant = "primary" | "secondary" | "ghost" | "danger";

export function Button({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = "primary",
  style
}: {
  title: string;
  onPress?: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: Variant;
  style?: ViewStyle;
}) {
  const { theme } = useTheme();
  const isDisabled = disabled || loading;

  const bg =
    variant === "primary"
      ? theme.color.accent
      : variant === "danger"
        ? theme.color.danger
        : variant === "secondary"
          ? theme.color.surfaceHi
          : "transparent";
  const fg = variant === "primary" || variant === "danger" ? "#FFFFFF" : theme.color.ink;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: bg,
          borderRadius: theme.radii.md,
          borderWidth: variant === "ghost" ? 1 : 0,
          borderColor: theme.color.line,
          opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1
        },
        style
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <Text style={[styles.label, { color: fg, fontSize: theme.fontSize.md }]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { height: 48, alignItems: "center", justifyContent: "center", paddingHorizontal: 20 },
  label: { fontWeight: "700" }
});
