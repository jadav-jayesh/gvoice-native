import React from "react";
import { StyleSheet, View } from "react-native";
import Svg, { G, Rect, Text as SvgText } from "react-native-svg";
import { useTheme } from "../../core/theme/ThemeProvider";
import { Text } from "../Text";

// Ported 1:1 from web components/charts/Heatmap.tsx (GitHub-style, newest last).
// CSS var colours resolved to theme; the 4 active levels use rgba of the aqua
// brand (6,182,212). Tooltips (<title>) are dropped on native.
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function quartile(v: number, max: number): number {
  if (v === 0) return 0;
  const ratio = v / max;
  if (ratio < 0.25) return 1;
  if (ratio < 0.5) return 2;
  if (ratio < 0.75) return 3;
  return 4;
}

export function Heatmap({
  values,
  weeks = 26,
  cellSize = 11,
  gap = 3
}: {
  values: number[];
  weeks?: number;
  cellSize?: number;
  gap?: number;
}) {
  const { theme } = useTheme();
  const needed = weeks * 7;
  const data = values.length >= needed ? values.slice(values.length - needed) : [...Array(needed - values.length).fill(0), ...values];
  const max = Math.max(1, ...data);

  const width = weeks * (cellSize + gap) - gap;
  const height = 7 * (cellSize + gap) - gap;

  const levelColor = (level: number): string => {
    switch (level) {
      case 1:
        return "rgba(6,182,212,0.30)";
      case 2:
        return "rgba(6,182,212,0.55)";
      case 3:
        return "rgba(6,182,212,0.80)";
      case 4:
        return "rgb(6,182,212)";
      default:
        return theme.color.surfaceHi;
    }
  };

  // Month labels: align each week to its Sunday, emit label when month flips.
  const now = new Date();
  const monthLabels: { x: number; label: string }[] = [];
  let lastMonth = -1;
  for (let w = 0; w < weeks; w++) {
    const d = new Date(now);
    d.setDate(d.getDate() - ((weeks - 1 - w) * 7 + 6));
    const m = d.getMonth();
    if (m !== lastMonth) {
      monthLabels.push({ x: w * (cellSize + gap), label: MONTHS[m] });
      lastMonth = m;
    }
  }

  const cells: React.ReactNode[] = [];
  for (let w = 0; w < weeks; w++) {
    for (let d = 0; d < 7; d++) {
      const i = w * 7 + d;
      const v = data[i] ?? 0;
      cells.push(
        <Rect
          key={i}
          x={w * (cellSize + gap)}
          y={d * (cellSize + gap)}
          width={cellSize}
          height={cellSize}
          rx={2.5}
          ry={2.5}
          fill={levelColor(quartile(v, max))}
        />
      );
    }
  }

  return (
    <View>
      <Svg width={width} height={height + 14}>
        {monthLabels.map((m, i) => (
          <SvgText key={i} x={m.x} y={9} fontSize={9} fill={theme.color.inkFaint}>
            {m.label}
          </SvgText>
        ))}
        <G y={14}>{cells}</G>
      </Svg>
      <View style={styles.legend}>
        <Text variant="caption" tone="faint">
          Less
        </Text>
        {[0, 1, 2, 3, 4].map((l) => (
          <View key={l} style={{ width: 10, height: 10, borderRadius: 2.5, backgroundColor: levelColor(l) }} />
        ))}
        <Text variant="caption" tone="faint">
          More
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  legend: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 8, justifyContent: "flex-end" }
});
