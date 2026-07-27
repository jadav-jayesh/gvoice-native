import React from "react";
import { Animated, Pressable, View, type ViewStyle } from "react-native";
import { useTheme } from "../core/theme/ThemeProvider";
import { usePressScale } from "./motion";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Tappable cards get a subtle press-scale (native driver) layered on the
// opacity feedback; static cards stay a plain View. The scale is applied to
// the Pressable itself so the caller's `style` (incl. flex/margins) is
// untouched.
function PressableCard({ children, base, style, onPress }: { children: React.ReactNode; base: ViewStyle; style?: ViewStyle; onPress: () => void }) {
  const { onPressIn, onPressOut, pressStyle } = usePressScale(0.98);
  // Plain array style (not a function): createAnimatedComponent doesn't invoke
  // function styles. The scale provides the press feedback.
  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={[base, style, pressStyle]}
    >
      {children}
    </AnimatedPressable>
  );
}

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
      <PressableCard base={base} style={style} onPress={onPress}>
        {children}
      </PressableCard>
    );
  }
  return <View style={[base, style]}>{children}</View>;
}
