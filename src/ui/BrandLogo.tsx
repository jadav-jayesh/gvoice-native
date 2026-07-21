import React from "react";
import { View } from "react-native";
import { useTheme } from "../core/theme/ThemeProvider";
import { Icon } from "./Icon";
import { Text } from "./Text";

// gVoice lockup: aqua rounded tile with the wave mark + wordmark. Self-contained
// (own aqua tile) so it works on light and dark surfaces without a swap.
export function BrandLogo({ height = 32, wordmark = true }: { height?: number; wordmark?: boolean }) {
  const { theme } = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
      <View
        style={{
          width: height,
          height,
          borderRadius: height * 0.28,
          backgroundColor: theme.color.accent,
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        <Icon name="Wave" size={height * 0.62} color="#fff" />
      </View>
      {wordmark ? (
        <Text style={{ fontSize: Math.round(height * 0.62), fontWeight: "700", color: theme.color.ink }}>gVoice</Text>
      ) : null}
    </View>
  );
}
