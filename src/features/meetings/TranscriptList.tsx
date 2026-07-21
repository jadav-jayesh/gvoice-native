import React from "react";
import { Pressable, View } from "react-native";
import type { DiarizedTranscriptSegment } from "../../core/api/types";
import { sentimentHex } from "../../core/lib/colors";
import { formatDuration } from "../../core/lib/format";
import { useTheme } from "../../core/theme/ThemeProvider";
import { Avatar } from "../../ui/Avatar";
import { Text } from "../../ui/Text";

// Ported from web TranscriptList. Rows are memoized (skill guidance). Rendered
// inside the parent ScrollView, so no nested virtualized list; auto-scroll to
// the active row is intentionally omitted on mobile (seek + highlight kept).
const Row = React.memo(function Row({
  seg,
  active,
  onSeek
}: {
  seg: DiarizedTranscriptSegment;
  active: boolean;
  onSeek: (t: number) => void;
}) {
  const { theme } = useTheme();
  return (
    <Pressable
      onPress={() => onSeek(seg.startTime)}
      style={{
        flexDirection: "row",
        gap: 10,
        padding: 10,
        borderRadius: theme.radii.md,
        backgroundColor: active ? theme.color.accent + "1A" : "transparent"
      }}
    >
      <Avatar name={seg.speaker} size={26} />
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 }}>
          <Text variant="caption" style={{ color: active ? theme.color.accent : theme.color.inkMute, fontWeight: "700" }}>
            {seg.speaker?.toUpperCase() || "SPEAKER"}
          </Text>
          <Text variant="caption" tone="faint">
            {formatDuration(seg.startTime)}
          </Text>
          {seg.sentiment ? (
            <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: sentimentHex(seg.sentiment.label) }} />
          ) : null}
        </View>
        <Text variant="body" tone="soft" style={{ lineHeight: 21 }}>
          {seg.text}
        </Text>
      </View>
    </Pressable>
  );
});

export function TranscriptList({
  segments,
  currentTime,
  onSeek,
  speakerFilter
}: {
  segments: DiarizedTranscriptSegment[];
  currentTime: number;
  onSeek: (t: number) => void;
  speakerFilter?: string;
}) {
  const { theme } = useTheme();
  if (segments.length === 0) {
    return (
      <Text tone="mute" style={{ textAlign: "center", paddingVertical: 24 }}>
        No transcript available for this meeting.
      </Text>
    );
  }

  let activeIdx = -1;
  for (let i = 0; i < segments.length; i++) {
    if (segments[i].startTime <= currentTime) activeIdx = i;
    else break;
  }

  return (
    <View style={{ gap: 2 }}>
      {segments.map((seg, i) => {
        if (speakerFilter && seg.speaker !== speakerFilter) return null;
        return <Row key={i} seg={seg} active={i === activeIdx} onSeek={onSeek} />;
      })}
    </View>
  );
}
