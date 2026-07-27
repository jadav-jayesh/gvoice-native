import React from "react";
import { Circle, Path, Rect, Svg } from "react-native-svg";
import { useTheme } from "../core/theme/ThemeProvider";

// Ported 1:1 from web/src/components/Icon.tsx (24x24 grid, 1.75 stroke). RN has
// no `currentColor`, so colour is an explicit prop that defaults to the theme
// ink colour. Filled glyphs (Play/Pause/Bolt/Quote) pass fill instead of stroke.
export type IconName =
  | "Dashboard" | "Meetings" | "Insights" | "Search" | "Play" | "Pause" | "Sparkles"
  | "Wave" | "Users" | "Check" | "CheckCircle" | "AlertCircle" | "Clock" | "Calendar"
  | "ArrowRight" | "ArrowUp" | "ArrowDown" | "ChevronLeft" | "ChevronRight" | "ChevronDown"
  | "Close" | "Refresh" | "Link" | "Download" | "Video" | "Copy" | "Bolt" | "Brain" | "Mic"
  | "Filter" | "Plus" | "Cog" | "Trend" | "Quote" | "ExternalLink" | "Layers" | "Hash"
  | "Mail" | "Lock" | "User" | "Trash" | "Eye" | "EyeOff";

const STROKE: Partial<Record<IconName, (c: string) => React.ReactNode>> = {
  Dashboard: (c) => (
    <>
      <Rect x={3} y={3} width={7} height={9} rx={1.5} stroke={c} />
      <Rect x={14} y={3} width={7} height={5} rx={1.5} stroke={c} />
      <Rect x={14} y={12} width={7} height={9} rx={1.5} stroke={c} />
      <Rect x={3} y={16} width={7} height={5} rx={1.5} stroke={c} />
    </>
  ),
  Meetings: (c) => (
    <>
      <Rect x={3} y={6} width={13} height={12} rx={2} stroke={c} />
      <Path d="M16 10l5 -3v10l-5 -3z" stroke={c} />
    </>
  ),
  Video: (c) => (
    <>
      <Rect x={3} y={6} width={13} height={12} rx={2} stroke={c} />
      <Path d="M16 10l5 -3v10l-5 -3z" stroke={c} />
    </>
  ),
  Insights: (c) => (
    <>
      <Path d="M3 17l5 -5 4 4 8 -8" stroke={c} />
      <Path d="M14 8h6v6" stroke={c} />
    </>
  ),
  Trend: (c) => (
    <>
      <Path d="M3 17l6 -6 4 4 8 -10" stroke={c} />
      <Path d="M14 5h7v7" stroke={c} />
    </>
  ),
  Search: (c) => (
    <>
      <Circle cx={11} cy={11} r={7} stroke={c} />
      <Path d="M20 20l-3.5 -3.5" stroke={c} />
    </>
  ),
  Sparkles: (c) => (
    <Path
      d="M12 3v4M12 17v4M3 12h4M17 12h4M5.5 5.5l2.8 2.8M15.7 15.7l2.8 2.8M5.5 18.5l2.8 -2.8M15.7 8.3l2.8 -2.8"
      stroke={c}
    />
  ),
  Wave: (c) => <Path d="M3 12h2M7 8v8M11 5v14M15 9v6M19 12h2" stroke={c} />,
  Users: (c) => (
    <>
      <Path d="M16 19v-2a4 4 0 0 0 -4 -4H6a4 4 0 0 0 -4 4v2" stroke={c} />
      <Circle cx={9} cy={7} r={3.5} stroke={c} />
      <Path d="M22 19v-2a4 4 0 0 0 -3 -3.9" stroke={c} />
      <Path d="M16 4a4 4 0 0 1 0 7" stroke={c} />
    </>
  ),
  Check: (c) => <Path d="M5 12l4 4L19 6" stroke={c} />,
  CheckCircle: (c) => (
    <>
      <Circle cx={12} cy={12} r={9} stroke={c} />
      <Path d="M8 12l3 3 5 -6" stroke={c} />
    </>
  ),
  AlertCircle: (c) => (
    <>
      <Circle cx={12} cy={12} r={9} stroke={c} />
      <Path d="M12 8v5" stroke={c} />
      <Circle cx={12} cy={16} r={0.6} fill={c} />
    </>
  ),
  Clock: (c) => (
    <>
      <Circle cx={12} cy={12} r={9} stroke={c} />
      <Path d="M12 7v5l3 2" stroke={c} />
    </>
  ),
  Calendar: (c) => (
    <>
      <Rect x={3} y={5} width={18} height={16} rx={2} stroke={c} />
      <Path d="M3 10h18M8 3v4M16 3v4" stroke={c} />
    </>
  ),
  ArrowRight: (c) => <Path d="M5 12h14M13 6l6 6 -6 6" stroke={c} />,
  ArrowUp: (c) => <Path d="M12 19V5M6 11l6 -6 6 6" stroke={c} />,
  ArrowDown: (c) => <Path d="M12 5v14M6 13l6 6 6 -6" stroke={c} />,
  ChevronLeft: (c) => <Path d="M15 6l-6 6 6 6" stroke={c} />,
  ChevronRight: (c) => <Path d="M9 6l6 6 -6 6" stroke={c} />,
  ChevronDown: (c) => <Path d="M6 9l6 6 6 -6" stroke={c} />,
  Close: (c) => <Path d="M6 6l12 12M18 6l-12 12" stroke={c} />,
  Eye: (c) => (
    <>
      <Path d="M2 12s3.5 -7 10 -7 10 7 10 7 -3.5 7 -10 7 -10 -7 -10 -7z" stroke={c} />
      <Circle cx={12} cy={12} r={3} stroke={c} />
    </>
  ),
  EyeOff: (c) => (
    <>
      <Path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 10 8 10 8a18.5 18.5 0 0 1 -2.16 3.19" stroke={c} />
      <Path d="M6.61 6.61A18.45 18.45 0 0 0 2 12s3 8 10 8a9.12 9.12 0 0 0 5.39 -1.61" stroke={c} />
      <Path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" stroke={c} />
      <Path d="M3 3l18 18" stroke={c} />
    </>
  ),
  Refresh: (c) => (
    <>
      <Path d="M20 11a8 8 0 1 0 -1 5" stroke={c} />
      <Path d="M20 4v7h-7" stroke={c} />
    </>
  ),
  Trash: (c) => (
    <>
      <Path d="M4 7h16" stroke={c} />
      <Path d="M10 4h4M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1 -1l1 -13" stroke={c} />
      <Path d="M10 11v6M14 11v6" stroke={c} />
    </>
  ),
  Link: (c) => (
    <>
      <Path d="M10 13a5 5 0 0 0 7.54 0.54l3 -3a5 5 0 0 0 -7.07 -7.07l-1.72 1.71" stroke={c} />
      <Path d="M14 11a5 5 0 0 0 -7.54 -0.54l-3 3a5 5 0 0 0 7.07 7.07l1.71 -1.71" stroke={c} />
    </>
  ),
  Download: (c) => (
    <>
      <Path d="M21 15v4a2 2 0 0 1 -2 2H5a2 2 0 0 1 -2 -2v-4" stroke={c} />
      <Path d="M7 10l5 5 5 -5" stroke={c} />
      <Path d="M12 15V3" stroke={c} />
    </>
  ),
  Copy: (c) => (
    <>
      <Rect x={9} y={9} width={11} height={11} rx={2} stroke={c} />
      <Path d="M5 15H4a2 2 0 0 1 -2 -2V4a2 2 0 0 1 2 -2h9a2 2 0 0 1 2 2v1" stroke={c} />
    </>
  ),
  Brain: (c) => (
    <>
      <Path d="M8 5a3 3 0 0 0 -3 3v1.5a3 3 0 0 0 -2 2.8v0a3 3 0 0 0 2 2.8V17a3 3 0 0 0 3 3h1V5z" stroke={c} />
      <Path d="M16 5a3 3 0 0 1 3 3v1.5a3 3 0 0 1 2 2.8v0a3 3 0 0 1 -2 2.8V17a3 3 0 0 1 -3 3h-1V5z" stroke={c} />
    </>
  ),
  Mic: (c) => (
    <>
      <Rect x={9} y={3} width={6} height={11} rx={3} stroke={c} />
      <Path d="M5 11a7 7 0 0 0 14 0M12 18v3" stroke={c} />
    </>
  ),
  Filter: (c) => <Path d="M3 5h18l-7 9v5l-4 -2v-3z" stroke={c} />,
  Plus: (c) => <Path d="M12 5v14M5 12h14" stroke={c} />,
  Cog: (c) => (
    <>
      <Circle cx={12} cy={12} r={3} stroke={c} />
      <Path
        d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06 .07a2 2 0 1 1 -2.83 2.83l-.07 -.06a1.7 1.7 0 0 0 -1.87 -.34a1.7 1.7 0 0 0 -1 1.51v.2a2 2 0 1 1 -4 0v-.1a1.7 1.7 0 0 0 -1.1 -1.55a1.7 1.7 0 0 0 -1.87 .34l-.07 .06a2 2 0 1 1 -2.83 -2.83l.06 -.07a1.7 1.7 0 0 0 .34 -1.87a1.7 1.7 0 0 0 -1.51 -1H3a2 2 0 1 1 0 -4h.1a1.7 1.7 0 0 0 1.55 -1.1a1.7 1.7 0 0 0 -.34 -1.87l-.06 -.07a2 2 0 1 1 2.83 -2.83l.07 .06a1.7 1.7 0 0 0 1.87 .34H9a1.7 1.7 0 0 0 1 -1.51V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.51a1.7 1.7 0 0 0 1.87 -.34l.07 -.06a2 2 0 1 1 2.83 2.83l-.06 .07a1.7 1.7 0 0 0 -.34 1.87V9a1.7 1.7 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0 -1.51 1z"
        stroke={c}
      />
    </>
  ),
  ExternalLink: (c) => (
    <>
      <Path d="M14 4h6v6M10 14L21 3" stroke={c} />
      <Path d="M20 14v5a2 2 0 0 1 -2 2H5a2 2 0 0 1 -2 -2V6a2 2 0 0 1 2 -2h5" stroke={c} />
    </>
  ),
  Layers: (c) => (
    <>
      <Path d="M12 2l10 6 -10 6 -10 -6z" stroke={c} />
      <Path d="M2 14l10 6 10 -6" stroke={c} />
    </>
  ),
  Hash: (c) => <Path d="M5 9h14M5 15h14M10 3l-2 18M16 3l-2 18" stroke={c} />,
  Mail: (c) => (
    <>
      <Rect x={3} y={5} width={18} height={14} rx={2} stroke={c} />
      <Path d="M3 7l9 6 9 -6" stroke={c} />
    </>
  ),
  Lock: (c) => (
    <>
      <Rect x={4} y={11} width={16} height={10} rx={2} stroke={c} />
      <Path d="M8 11V8a4 4 0 0 1 8 0v3" stroke={c} />
    </>
  ),
  User: (c) => (
    <>
      <Circle cx={12} cy={8} r={4} stroke={c} />
      <Path d="M4 21a8 8 0 0 1 16 0" stroke={c} />
    </>
  )
};

const FILLED: Partial<Record<IconName, (c: string) => React.ReactNode>> = {
  Play: (c) => <Path d="M7 4l13 8 -13 8z" fill={c} />,
  Pause: (c) => (
    <>
      <Rect x={6} y={4} width={4} height={16} rx={1} fill={c} />
      <Rect x={14} y={4} width={4} height={16} rx={1} fill={c} />
    </>
  ),
  Bolt: (c) => <Path d="M13 2L4 14h7l-1 8 9-12h-7z" fill={c} />,
  Quote: (c) => (
    <>
      <Path d="M9 7H5a2 2 0 0 0 -2 2v4a2 2 0 0 0 2 2h2v2a4 4 0 0 1 -4 4v2c4.4 0 8 -3.6 8 -8z" fill={c} />
      <Path d="M21 7h-4a2 2 0 0 0 -2 2v4a2 2 0 0 0 2 2h2v2a4 4 0 0 1 -4 4v2c4.4 0 8 -3.6 8 -8z" fill={c} />
    </>
  )
};

export function Icon({ name, size = 20, color }: { name: IconName; size?: number; color?: string }) {
  const { theme } = useTheme();
  const c = color ?? theme.color.ink;
  const filled = FILLED[name];
  if (filled) {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        {filled(c)}
      </Svg>
    );
  }
  const stroke = STROKE[name];
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {stroke ? stroke(c) : null}
    </Svg>
  );
}
