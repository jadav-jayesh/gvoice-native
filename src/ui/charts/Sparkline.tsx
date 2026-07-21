import React from "react";
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from "react-native-svg";
import { useTheme } from "../../core/theme/ThemeProvider";

// Ported 1:1 from web components/charts/Sparkline.tsx. Unique gradient id per
// instance (id collisions break fills). Width is explicit here (RN has no
// preserveAspectRatio="none" auto-stretch), so callers pass a real width.
export function Sparkline({
  values,
  width = 240,
  height = 56,
  stroke,
  fillId = "spark",
  fillFrom,
  fillTo
}: {
  values: number[];
  width?: number;
  height?: number;
  stroke?: string;
  fillId?: string;
  fillFrom?: string;
  fillTo?: string;
}) {
  const { theme } = useTheme();
  if (values.length === 0) return null;
  const strokeColor = stroke ?? theme.color.accent;
  const from = fillFrom ?? "rgba(6,182,212,0.18)";
  const to = fillTo ?? "rgba(6,182,212,0)";

  const pad = 3;
  const innerW = width - 6;
  const innerH = height - 6;
  const min = Math.min(...values, 0);
  const max = Math.max(...values, 1);
  const range = max - min || 1;
  const step = innerW / Math.max(1, values.length - 1);

  const points = values.map((v, i) => ({
    x: pad + i * step,
    y: pad + innerH - ((v - min) / range) * innerH
  }));

  const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(" ");
  const last = points[points.length - 1];
  const area = `${line} L${last.x.toFixed(2)} ${height - pad} L${points[0].x.toFixed(2)} ${height - pad} Z`;

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <Defs>
        <LinearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={from} />
          <Stop offset="1" stopColor={to} />
        </LinearGradient>
      </Defs>
      <Path d={area} fill={`url(#${fillId})`} />
      <Path d={line} stroke={strokeColor} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Circle cx={last.x} cy={last.y} r={2.5} fill={strokeColor} />
    </Svg>
  );
}
