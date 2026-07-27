import React, { useEffect, useRef } from "react";
import { Animated, type ViewStyle } from "react-native";
import { useTheme } from "../core/theme/ThemeProvider";
import { useReduceMotion } from "./motion";

// Pulsing placeholder (web used a shimmer; a subtle opacity pulse reads the same
// on mobile and respects reduced-motion by staying low-contrast).
export function Skeleton({ width, height = 16, radius, style }: { width?: number | string; height?: number; radius?: number; style?: ViewStyle }) {
  const { theme } = useTheme();
  const reduce = useReduceMotion();
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    if (reduce) {
      opacity.setValue(0.6);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.9, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true })
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity, reduce]);

  return (
    <Animated.View
      style={[
        {
          width: width as ViewStyle["width"],
          height,
          borderRadius: radius ?? theme.radii.sm,
          backgroundColor: theme.color.surfaceHi,
          opacity
        },
        style
      ]}
    />
  );
}
