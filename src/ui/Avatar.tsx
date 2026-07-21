import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import { gradientFromString } from "../core/theme/tokens";

// Ported from web Avatar: stable aqua gradient per name + initials. Uses
// react-native-svg for the gradient (no extra native module).
export function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  const initials =
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "?";
  const [from, to] = gradientFromString(name);
  const id = `av_${name.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8) || "x"}`;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={from} />
            <Stop offset="1" stopColor={to} />
          </LinearGradient>
        </Defs>
        <Rect width={size} height={size} rx={size / 2} fill={`url(#${id})`} />
      </Svg>
      <View style={styles.center}>
        <Text style={{ color: "#fff", fontWeight: "600", fontSize: Math.max(10, size * 0.38) }}>{initials}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center" }
});
