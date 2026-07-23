import React, { useMemo } from "react";
import { Pressable, View } from "react-native";
import type { DiarizedTranscriptSegment } from "../../core/api/types";
import { sentimentHex } from "../../core/lib/colors";
import { formatDuration } from "../../core/lib/format";
import { useTheme } from "../../core/theme/ThemeProvider";
import { gradientFromString } from "../../core/theme/tokens";
import { Avatar } from "../../ui/Avatar";
import { Icon } from "../../ui/Icon";
import { Text } from "../../ui/Text";

// Chat-style transcript: consecutive segments from the same speaker are
// grouped under one avatar + name header (Slack/Notion style), each segment
// rendered as a tappable bubble that seeks the recording. The active bubble
// (where playback currently is) gets an accent outline.

const Bubble = React.memo(function Bubble({
  seg,
  active,
  first,
  onSeek
}: {
  seg: DiarizedTranscriptSegment;
  active: boolean;
  first: boolean;
  onSeek: (t: number) => void;
}) {
  const { theme } = useTheme();
  return (
    <Pressable
      onPress={() => onSeek(seg.startTime)}
      accessibilityRole="button"
      accessibilityLabel={`Jump to ${formatDuration(seg.startTime)}`}
      style={({ pressed }) => ({
        borderRadius: theme.radii.md,
        borderTopLeftRadius: first ? 4 : theme.radii.md,
        backgroundColor: active ? theme.color.accent + "14" : theme.color.surfaceHi,
        borderWidth: 1,
        borderColor: active ? theme.color.accent + "66" : "transparent",
        paddingHorizontal: 12,
        paddingVertical: 9,
        opacity: pressed ? 0.75 : 1
      })}
    >
      <Text variant="body" tone="soft" style={{ lineHeight: 21 }}>
        {seg.text}
      </Text>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginTop: 5 }}>
        <Text
          variant="caption"
          style={{ color: active ? theme.color.accent : theme.color.inkFaint, fontVariant: ["tabular-nums"] }}
        >
          {formatDuration(seg.startTime)}
        </Text>
        {seg.sentiment ? (
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: sentimentHex(seg.sentiment.label) }} />
        ) : null}
        {active ? <Icon name="Wave" size={11} color={theme.color.accent} /> : null}
      </View>
    </Pressable>
  );
});

interface Group {
  speaker: string;
  items: { seg: DiarizedTranscriptSegment; idx: number }[];
}

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

  // Group consecutive same-speaker segments (after the speaker filter) so the
  // avatar + name renders once per run instead of on every line.
  const groups = useMemo<Group[]>(() => {
    const out: Group[] = [];
    segments.forEach((seg, idx) => {
      if (speakerFilter && seg.speaker !== speakerFilter) return;
      const last = out[out.length - 1];
      if (last && last.speaker === (seg.speaker || "Speaker")) {
        last.items.push({ seg, idx });
      } else {
        out.push({ speaker: seg.speaker || "Speaker", items: [{ seg, idx }] });
      }
    });
    return out;
  }, [segments, speakerFilter]);

  if (segments.length === 0) {
    return (
      <View style={{ alignItems: "center", paddingVertical: 28, gap: 8 }}>
        <Icon name="Users" size={22} color={theme.color.inkFaint} />
        <Text tone="mute">No transcript available for this meeting.</Text>
      </View>
    );
  }

  let activeIdx = -1;
  for (let i = 0; i < segments.length; i++) {
    if (segments[i].startTime <= currentTime) activeIdx = i;
    else break;
  }

  return (
    <View style={{ gap: 16 }}>
      {groups.map((g, gi) => {
        const [nameColor] = gradientFromString(g.speaker);
        return (
          <View key={gi} style={{ flexDirection: "row", gap: 10 }}>
            <Avatar name={g.speaker} size={28} />
            <View style={{ flex: 1, gap: 4 }}>
              <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8 }}>
                <Text variant="caption" style={{ color: nameColor, fontWeight: "700", letterSpacing: 0.4 }}>
                  {g.speaker.toUpperCase()}
                </Text>
                <Text variant="caption" tone="faint" style={{ fontVariant: ["tabular-nums"] }}>
                  {formatDuration(g.items[0].seg.startTime)}
                </Text>
              </View>
              {g.items.map(({ seg, idx }, ii) => (
                <Bubble key={idx} seg={seg} active={idx === activeIdx} first={ii === 0} onSeek={onSeek} />
              ))}
            </View>
          </View>
        );
      })}
    </View>
  );
}
