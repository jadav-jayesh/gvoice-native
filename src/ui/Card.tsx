import React from "react";
import { Pressable, View, type ViewStyle } from "react-native";
import { useTheme } from "../core/theme/ThemeProvider";

export function Card({
  children,
  style,
  onPress
}: {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
}) {
  const { theme } = useTheme();
  const base: ViewStyle = {
    backgroundColor: theme.color.surface,
    borderColor: theme.color.line,
    borderWidth: 1,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.lg
  };
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [base, { opacity: pressed ? 0.9 : 1 }, style]}>
        {children}
      </Pressable>
    );
  }
  return <View style={[base, style]}>{children}</View>;
}
