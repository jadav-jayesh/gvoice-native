import { useVideoPlayer, VideoView } from "expo-video";
import React, { useEffect, useRef, useState } from "react";
import { Animated, Image, StyleSheet, View } from "react-native";
import { useTheme } from "../../core/theme/ThemeProvider";
import { Icon } from "../../ui/Icon";
import { Skeleton } from "../../ui/Skeleton";
import { Text } from "../../ui/Text";
import { useReduceMotion } from "../../ui/motion";
import { Equalizer } from "./LiveCaptureCard";

// expo-video player. Emits progress (currentTime + duration) so the parent can
// drive the sentiment timeline playhead and transcript sync.
//
// No black flash: the VideoView uses a TextureView (blendable) instead of the
// default SurfaceView — a SurfaceView paints an opaque black surface that shows
// through until the first frame decodes. A poster (meeting thumbnail) sits
// behind the video, and a branded loader overlay sits on top until the stream
// is playable, so the box is never a bare black rectangle. Playback starts on
// the first buffer (readyToPlay), never after a full download.
export function RecordingPlayer({
  uri,
  poster,
  onProgress,
  seekTo
}: {
  uri: string;
  poster?: string;
  onProgress?: (currentTime: number, duration: number) => void;
  seekTo?: number;
}) {
  const { theme } = useTheme();
  const reduce = useReduceMotion();
  const player = useVideoPlayer(uri, (p) => {
    p.timeUpdateEventInterval = 0.5;
  });

  const [status, setStatus] = useState<string>(player.status);
  const [overlayGone, setOverlayGone] = useState(false);
  const overlayOpacity = useRef(new Animated.Value(1)).current;

  const [posterLoaded, setPosterLoaded] = useState(false);

  useEffect(() => {
    const sub = player.addListener("timeUpdate", (e) => {
      onProgress?.(e.currentTime, player.duration ?? 0);
    });
    const statusSub = player.addListener("statusChange", (e) => {
      setStatus(e.status);
    });
    return () => {
      sub.remove();
      statusSub.remove();
    };
  }, [player, onProgress]);

  // Drop the loader as soon as playback is possible — or after a short cap.
  useEffect(() => {
    if (overlayGone || status === "error") return;
    const hide = () => {
      if (reduce) {
        setOverlayGone(true);
        return;
      }
      Animated.timing(overlayOpacity, { toValue: 0, duration: 260, useNativeDriver: true }).start(({ finished }) => {
        if (finished) setOverlayGone(true);
      });
    };
    if (status === "readyToPlay") {
      hide();
      return;
    }
    const cap = setTimeout(hide, 3000);
    return () => clearTimeout(cap);
  }, [status, overlayGone, overlayOpacity, reduce]);

  // Seek when the parent taps a transcript row / timeline segment.
  useEffect(() => {
    if (typeof seekTo === "number") player.currentTime = seekTo;
  }, [player, seekTo]);

  const failed = status === "error";

  return (
    <View
      style={{
        width: "100%",
        aspectRatio: 16 / 9,
        borderRadius: theme.radii.lg,
        overflow: "hidden",
        backgroundColor: theme.color.surfaceHi
      }}
    >
      {/* Poster behind the video — shows through the transparent TextureView
          until the first video frame renders, so there's no black gap. */}
      {poster ? (
        <Image source={{ uri: poster }} onLoad={() => setPosterLoaded(true)} resizeMode="cover" style={StyleSheet.absoluteFill} />
      ) : null}

      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit="contain"
        surfaceType="textureView"
        nativeControls
      />

      {!overlayGone ? (
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            { alignItems: "center", justifyContent: "center", gap: 10, opacity: overlayOpacity }
          ]}
        >
          {/* Skeleton only until the poster is ready (or when there's no poster) */}
          {!poster || !posterLoaded ? (
            <Skeleton width="100%" style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, height: "100%", borderRadius: 0 }} />
          ) : null}
          {/* Dim scrim so the loader reads clearly over the poster */}
          <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(4,7,14,0.5)" }]} />
          {failed ? (
            <>
              <Icon name="AlertCircle" size={26} color={theme.color.inkFaint} />
              <Text tone="mute" variant="label">
                Couldn't load the recording.
              </Text>
            </>
          ) : (
            <>
              <Equalizer color={theme.color.accent} barCount={7} height={34} barWidth={4} gap={4} />
              <Text tone="mute" variant="label">
                Loading recording…
              </Text>
            </>
          )}
        </Animated.View>
      ) : null}
    </View>
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
