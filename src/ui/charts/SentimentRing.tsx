import React from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Circle, G } from "react-native-svg";
import { useTheme } from "../../core/theme/ThemeProvider";
import { Text } from "../Text";

// Ported 1:1 from web components/charts/SentimentRing.tsx. Segments drawn
// sequentially via strokeDasharray/offset, ring rotated -90deg to start at 12
// o'clock. Center label is an overlaid View (RN can't easily center SVG text).
const NEUTRAL = "#94a3b8";
const POSITIVE = "#10B981";
const NEGATIVE = "#dc2626";

export function SentimentRing({
  positive,
  neutral,
  negative,
  size = 160,
  thickness = 14,
  legend = true
}: {
  positive: number;
  neutral: number;
  negative: number;
  size?: number;
  thickness?: number;
  legend?: boolean;
}) {
  const { theme } = useTheme();
  const total = positive + neutral + negative;

  if (total === 0) {
    return (
      <View style={{ alignItems: "center" }}>
        <View
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: 2,
            borderColor: theme.color.line,
            borderStyle: "dashed",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <Text tone="mute" variant="label">
            No data
          </Text>
        </View>
      </View>
    );
  }

  const radius = (size - thickness) / 2;
  const circ = 2 * Math.PI * radius;
  const positiveShare = Math.round((positive / total) * 100);
  const segs = [
    { v: positive, c: POSITIVE, label: "Positive" },
    { v: neutral, c: NEUTRAL, label: "Neutral" },
    { v: negative, c: NEGATIVE, label: "Negative" }
  ];

  let offset = 0;
  const circles = segs.map((s, i) => {
    const share = s.v / total;
    const len = circ * share;
    const el = (
      <Circle
        key={i}
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={s.c}
        strokeWidth={thickness}
        strokeLinecap="butt"
        fill="none"
        strokeDasharray={`${len} ${circ - len}`}
        strokeDashoffset={-offset}
      />
    );
    offset += len;
    return el;
  });

  return (
    <View style={{ alignItems: "center" }}>
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size}>
          <G rotation={-90} origin={`${size / 2}, ${size / 2}`}>
            <Circle cx={size / 2} cy={size / 2} r={radius} stroke={theme.color.line} strokeWidth={thickness} fill="none" />
            {circles}
          </G>
        </Svg>
        <View style={styles.center}>
          <Text variant="caption" tone="mute">
            POSITIVE
          </Text>
          <Text style={{ fontSize: size * 0.2, fontWeight: "700", color: theme.color.ink }}>{positiveShare}%</Text>
        </View>
      </View>

      {legend ? (
        <View style={styles.legend}>
          {segs.map((s) => (
            <View key={s.label} style={styles.legendItem}>
              <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: s.c }} />
              <Text variant="caption" tone="mute">
                {s.label} {Math.round((s.v / total) * 100)}%
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center" },
  legend: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 14, marginTop: 14 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 }
});
