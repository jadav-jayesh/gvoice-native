import React from "react";
import { Pressable, View } from "react-native";
import type { DiarizedTranscriptSegment } from "../../core/api/types";
import { sentimentHex } from "../../core/lib/colors";
import { useTheme } from "../../core/theme/ThemeProvider";

// Ported from web SentimentTimeline: a proportional bar of coloured sentiment
// segments with a playhead. Tapping a segment seeks to its start.
export function SentimentTimeline({
  segments,
  durationSeconds,
  currentTime,
  onSeek,
  height = 12
}: {
  segments: DiarizedTranscriptSegment[];
  durationSeconds: number;
  currentTime: number;
  onSeek: (t: number) => void;
  height?: number;
}) {
  const { theme } = useTheme();

  if (durationSeconds <= 0 || segments.length === 0) {
    return <View style={{ height, borderRadius: height / 2, backgroundColor: theme.color.surfaceHi }} />;
  }

  return (
    <View style={{ height, borderRadius: height / 2, backgroundColor: theme.color.surfaceHi, overflow: "hidden" }}>
      {segments.map((s, i) => {
        if (!s.sentiment) return null;
        const left = (s.startTime / durationSeconds) * 100;
        const width = Math.max(0.3, ((s.endTime - s.startTime) / durationSeconds) * 100);
        const opacity = 0.55 + 0.45 * Math.min(1, Math.abs(s.sentiment.score));
        return (
          <Pressable
            key={i}
            onPress={() => onSeek(s.startTime)}
            style={{ position: "absolute", top: 0, bottom: 0, left: `${left}%`, width: `${width}%`, backgroundColor: sentimentHex(s.sentiment.label), opacity }}
          />
        );
      })}
      <View
        pointerEvents="none"
        style={{ position: "absolute", top: 0, bottom: 0, width: 2, backgroundColor: theme.color.ink, left: `${Math.min(100, (currentTime / durationSeconds) * 100)}%` }}
      />
    </View>
  );
}
