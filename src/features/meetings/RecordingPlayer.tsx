import { useVideoPlayer, VideoView } from "expo-video";
import React, { useEffect } from "react";
import { View } from "react-native";
import { useTheme } from "../../core/theme/ThemeProvider";
import { Icon } from "../../ui/Icon";
import { Text } from "../../ui/Text";

// expo-video player. Emits progress (currentTime + duration) so the parent can
// drive the sentiment timeline playhead and transcript sync.
export function RecordingPlayer({
  uri,
  onProgress,
  seekTo
}: {
  uri: string;
  onProgress?: (currentTime: number, duration: number) => void;
  seekTo?: number;
}) {
  const { theme } = useTheme();
  const player = useVideoPlayer(uri, (p) => {
    p.timeUpdateEventInterval = 0.5;
  });

  useEffect(() => {
    const sub = player.addListener("timeUpdate", (e) => {
      onProgress?.(e.currentTime, player.duration ?? 0);
    });
    return () => sub.remove();
  }, [player, onProgress]);

  // Seek when the parent taps a transcript row / timeline segment.
  useEffect(() => {
    if (typeof seekTo === "number") player.currentTime = seekTo;
  }, [player, seekTo]);

  return (
    <VideoView
      player={player}
      style={{ width: "100%", aspectRatio: 16 / 9, borderRadius: theme.radii.lg, backgroundColor: "#000" }}
      contentFit="contain"
      nativeControls
    />
  );
}

export function RecordingUnavailable() {
  const { theme } = useTheme();
  return (
    <View
      style={{
        width: "100%",
        aspectRatio: 16 / 9,
        borderRadius: theme.radii.lg,
        backgroundColor: theme.color.surfaceHi,
        alignItems: "center",
        justifyContent: "center",
        gap: 8
      }}
    >
      <Icon name="Mic" size={28} color={theme.color.inkFaint} />
      <Text tone="mute" variant="label">
        Recording unavailable — transcript only
      </Text>
    </View>
  );
}
