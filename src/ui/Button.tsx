import React from "react";
import { ActivityIndicator, Animated, Pressable, StyleSheet, Text, type ViewStyle } from "react-native";
import { useTheme } from "../core/theme/ThemeProvider";
import { usePressScale } from "./motion";

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
  const { onPressIn, onPressOut, pressStyle } = usePressScale(0.97);

  // Animate the Pressable itself (not a wrapper) so the caller's `style`
  // — including layout props like flex:1 — stays exactly where it was.
  // Plain array style (not a function): createAnimatedComponent doesn't invoke
  // function styles, and the scale gives the press feedback.
  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={isDisabled}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={[
        styles.base,
        {
          backgroundColor: bg,
          borderRadius: theme.radii.md,
          borderWidth: variant === "ghost" ? 1 : 0,
          borderColor: theme.color.line,
          opacity: isDisabled ? 0.5 : 1
        },
        style,
        pressStyle
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <Text style={[styles.label, { color: fg, fontSize: theme.fontSize.md }]}>{title}</Text>
      )}
    </AnimatedPressable>
  );
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const styles = StyleSheet.create({
  base: { height: 48, alignItems: "center", justifyContent: "center", paddingHorizontal: 20 },
  label: { fontWeight: "700" }
});
