import React from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Circle, G } from "react-native-svg";
import { useTheme } from "../../core/theme/ThemeProvider";
import { Text } from "../Text";

// Ported from web ActionItemsCard CompletionRing. r=26 in a 72x72 box, arc from
// 12 o'clock (rotate -90), centre shows the percentage.
export function CompletionRing({ rate, size = 72 }: { rate: number; size?: number }) {
  const { theme } = useTheme();
  const r = 26;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - rate / 100);

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <G rotation={-90} origin={`${size / 2}, ${size / 2}`}>
          <Circle cx={size / 2} cy={size / 2} r={r} stroke={theme.color.line} strokeWidth={6} fill="none" />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={theme.color.ring}
            strokeWidth={6}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={circ}
            strokeDashoffset={offset}
          />
        </G>
      </Svg>
      <View style={styles.center}>
        <Text style={{ fontSize: 15, fontWeight: "600", color: theme.color.ink }}>{rate}%</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center" }
});
