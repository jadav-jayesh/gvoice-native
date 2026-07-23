import React, { useEffect, useRef } from "react";
import { Animated, Easing, View } from "react-native";
import { useTheme } from "../../core/theme/ThemeProvider";
import { Text } from "../../ui/Text";

// Shown in place of the video player while a meeting is still being captured
// or processed. Mirrors the in-person recording screen's live treatment:
// pulsing status pill + animated equalizer, so "something is happening" is
// obvious instead of a bare "recording unavailable" placeholder.

export function PulsingDot({ color, size = 10 }: { color: string; size?: number }) {
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: true })
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);
  return (
    <Animated.View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 0.35] })
      }}
    />
  );
}

const PEAKS = [0.5, 0.85, 1, 0.65, 0.9, 0.55, 0.75, 0.6, 0.95];

// Looping equalizer — no real audio levels exist for a remote capture, so the
// bars breathe on staggered phases (same recipe as the splash waveform).
// Sized via props so it works both as the hero (56px) and inline in list rows.
export function Equalizer({
  color,
  barCount = PEAKS.length,
  height = 56,
  barWidth = 5,
  gap = 5
}: {
  color: string;
  barCount?: number;
  height?: number;
  barWidth?: number;
  gap?: number;
}) {
  const peaks = PEAKS.slice(0, barCount);
  const bars = useRef(peaks.map(() => new Animated.Value(0.25))).current;
  useEffect(() => {
    const timers: Array<ReturnType<typeof setTimeout>> = [];
    bars.forEach((b, i) => {
      const run = () =>
        Animated.sequence([
          Animated.timing(b, { toValue: peaks[i], duration: 380 + i * 35, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(b, { toValue: 0.25, duration: 380 + i * 35, easing: Easing.inOut(Easing.quad), useNativeDriver: true })
        ]).start(({ finished }) => finished && run());
      timers.push(setTimeout(run, i * 90));
    });
    return () => {
      timers.forEach(clearTimeout);
      bars.forEach((b) => b.stopAnimation());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap, height }}>
      {bars.map((b, i) => (
        <Animated.View
          key={i}
          style={{
            width: barWidth,
            height,
            borderRadius: barWidth / 2,
            backgroundColor: i % 2 === 0 ? color : color + "99",
            transform: [{ scaleY: b }]
          }}
        />
      ))}
    </View>
  );
}

export function LiveCaptureCard({ statusText, detail }: { statusText: string; detail?: string }) {
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
        gap: 14,
        paddingHorizontal: 20
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          paddingHorizontal: 14,
          paddingVertical: 7,
          borderRadius: 999,
          backgroundColor: "rgba(239,68,68,0.12)"
        }}
      >
        <PulsingDot color={theme.color.danger} />
        <Text variant="label" style={{ color: theme.color.danger, letterSpacing: 1.5 }}>
          {statusText.toUpperCase()}
        </Text>
      </View>

      <Equalizer color={theme.color.accent} />

      {detail ? (
        <Text variant="caption" tone="mute" numberOfLines={1}>
          {detail}
        </Text>
      ) : null}
      <Text variant="caption" tone="faint">
        This page updates automatically.
      </Text>
    </View>
  );
}
