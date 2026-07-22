import React, { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Animated, Dimensions, Easing, StyleSheet, View } from "react-native";
import Svg, { Circle, Defs, LinearGradient, Path, RadialGradient, Stop } from "react-native-svg";
import { Text } from "./Text";

const AC = Animated.createAnimatedComponent(Circle);
const AP = Animated.createAnimatedComponent(Path);

// gVoice launch screen. A dark, cinematic "listening" moment: the eye draws
// itself open, a live waveform pulses inside the iris, and concentric sound
// rings breathe outward — then the wordmark resolves. Pure SVG + Animated.
export function BrandSplash() {
  const { width: W, height: H } = Dimensions.get("window");
  const cx = W / 2;
  const cy = H * 0.4;

  // Eye geometry.
  const ew = 96; // half width
  const eh = 60; // lid curvature
  const irisR = 46;
  const eyePath =
    `M ${cx - ew} ${cy} Q ${cx} ${cy - eh} ${cx + ew} ${cy} ` +
    `M ${cx - ew} ${cy} Q ${cx} ${cy + eh} ${cx + ew} ${cy}`;
  const DASH = 520;

  const enter = useRef(new Animated.Value(0)).current; // mark scale/opacity
  const draw = useRef(new Animated.Value(0)).current; // eye stroke draw-on
  const iris = useRef(new Animated.Value(0)).current; // iris + waveform reveal
  const text = useRef(new Animated.Value(0)).current; // wordmark
  const shimmer = useRef(new Animated.Value(0)).current; // bottom progress
  const rings = useRef([0, 1, 2].map(() => new Animated.Value(0))).current;
  const bars = useRef([0, 1, 2, 3, 4, 5, 6].map(() => new Animated.Value(0.35))).current;
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((r) => {
      if (!mounted) return;
      setReduceMotion(r);
      if (r) {
        enter.setValue(1);
        draw.setValue(1);
        iris.setValue(1);
        text.setValue(1);
        bars.forEach((b, i) => b.setValue([0.5, 0.8, 1, 0.7, 0.9, 0.6, 0.45][i]));
        return;
      }

      // Entrance sequence. `enter`/`draw` feed SVG props → JS driver.
      Animated.sequence([
        Animated.parallel([
          Animated.timing(enter, { toValue: 1, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
          Animated.timing(draw, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.cubic), useNativeDriver: false })
        ]),
        Animated.timing(iris, { toValue: 1, duration: 450, easing: Easing.out(Easing.back(1.6)), useNativeDriver: false }),
        Animated.timing(text, { toValue: 1, duration: 550, easing: Easing.out(Easing.cubic), useNativeDriver: true })
      ]).start();

      // Continuous waveform — each bar breathes on its own phase.
      const peaks = [0.55, 0.85, 1, 0.7, 0.95, 0.62, 0.5];
      bars.forEach((b, i) => {
        const run = () =>
          Animated.sequence([
            Animated.timing(b, { toValue: peaks[i], duration: 420 + i * 40, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
            Animated.timing(b, { toValue: 0.32, duration: 420 + i * 40, easing: Easing.inOut(Easing.quad), useNativeDriver: true })
          ]).start(({ finished }) => finished && run());
        setTimeout(run, 500 + i * 80);
      });

      // Sound rings — expanding, staggered loops (SVG props → JS driver).
      rings.forEach((rv, i) => {
        const loop = Animated.loop(
          Animated.timing(rv, { toValue: 1, duration: 2600, easing: Easing.out(Easing.quad), useNativeDriver: false })
        );
        setTimeout(() => loop.start(), i * 850);
      });

      // Bottom shimmer.
      Animated.loop(
        Animated.timing(shimmer, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
      ).start();
    });
    return () => {
      mounted = false;
    };
  }, [enter, draw, iris, text, shimmer, rings, bars]);

  const dashOffset = draw.interpolate({ inputRange: [0, 1], outputRange: [DASH, 0] });
  const textY = text.interpolate({ inputRange: [0, 1], outputRange: [16, 0] });
  const shimmerX = shimmer.interpolate({ inputRange: [0, 1], outputRange: [-120, 160] });

  // Waveform bars laid across the iris.
  const barW = 5;
  const gap = 7;
  const maxBarH = irisR * 1.35;
  const totalW = bars.length * barW + (bars.length - 1) * gap;

  return (
    <View style={styles.root}>
      {/* Background + glow + rings + eye (SVG) */}
      <Svg width={W} height={H} style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id="bg" cx="50%" cy="38%" r="75%">
            <Stop offset="0" stopColor="#0B1A2B" />
            <Stop offset="0.55" stopColor="#070E1A" />
            <Stop offset="1" stopColor="#04070E" />
          </RadialGradient>
          <RadialGradient id="glow" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor="#22D3EE" stopOpacity="0.42" />
            <Stop offset="0.5" stopColor="#22D3EE" stopOpacity="0.14" />
            <Stop offset="1" stopColor="#22D3EE" stopOpacity="0" />
          </RadialGradient>
          <LinearGradient id="stroke" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#67E8F9" />
            <Stop offset="1" stopColor="#22D3EE" />
          </LinearGradient>
        </Defs>

        <Circle cx={cx} cy={cy} r={H} fill="url(#bg)" />

        {/* Soft bloom behind the mark */}
        <AC cx={cx} cy={cy} r={170} fill="url(#glow)" opacity={enter} />

        {/* Expanding sound rings */}
        {rings.map((rv, i) => (
          <AC
            key={i}
            cx={cx}
            cy={cy}
            r={irisR + 26}
            stroke="#22D3EE"
            strokeWidth={1.5}
            fill="none"
            opacity={rv.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 0.35, 0] })}
            scale={rv.interpolate({ inputRange: [0, 1], outputRange: [1, 3.1] })}
            originX={cx}
            originY={cy}
          />
        ))}

        {/* Iris ring */}
        <AC
          cx={cx}
          cy={cy}
          r={irisR}
          stroke="url(#stroke)"
          strokeWidth={2}
          fill="#0A1F30"
          opacity={iris}
          scale={iris.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] })}
          originX={cx}
          originY={cy}
        />

        {/* Eye lids — draw-on */}
        <AP
          d={eyePath}
          stroke="url(#stroke)"
          strokeWidth={6}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={DASH}
          strokeDashoffset={dashOffset}
        />
      </Svg>

      {/* Live waveform inside the iris (native-driven for smoothness) */}
      <Animated.View
        style={[
          styles.wave,
          { left: cx - totalW / 2, top: cy - maxBarH / 2, width: totalW, height: maxBarH, opacity: iris }
        ]}
      >
        {bars.map((b, i) => (
          <Animated.View
            key={i}
            style={{
              width: barW,
              height: maxBarH,
              marginLeft: i === 0 ? 0 : gap,
              borderRadius: barW,
              backgroundColor: i % 2 === 0 ? "#67E8F9" : "#22D3EE",
              transform: [{ scaleY: b }]
            }}
          />
        ))}
      </Animated.View>

      {/* Wordmark + tagline */}
      <Animated.View style={[styles.text, { top: cy + irisR + 78, opacity: text, transform: [{ translateY: textY }] }]}>
        <Text style={styles.brand}>gVoice</Text>
        <Text style={styles.tagline}>MEETING INTELLIGENCE</Text>
      </Animated.View>

      {/* Slim shimmer progress */}
      {!reduceMotion ? (
        <View style={[styles.track, { top: H * 0.86 }]}>
          <Animated.View style={[styles.shimmer, { transform: [{ translateX: shimmerX }] }]} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#04070E", alignItems: "center", justifyContent: "center" },
  wave: { position: "absolute", flexDirection: "row", alignItems: "center", justifyContent: "center" },
  text: { position: "absolute", alignItems: "center", width: "100%" },
  brand: { fontSize: 40, fontWeight: "800", color: "#F2FBFF", letterSpacing: 1 },
  tagline: { marginTop: 8, fontSize: 11, fontWeight: "600", letterSpacing: 4, color: "rgba(103,232,249,0.7)" },
  track: { position: "absolute", width: 120, height: 3, borderRadius: 3, backgroundColor: "rgba(103,232,249,0.14)", overflow: "hidden" },
  shimmer: { width: 80, height: 3, borderRadius: 3, backgroundColor: "#22D3EE" }
});
