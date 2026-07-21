import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useTheme } from "../core/theme/ThemeProvider";
import { Text } from "./Text";

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
}

// Reusable segmented control (range filter, view toggle, role filter, theme picker).
export function Segmented<T extends string>({
  options,
  value,
  onChange
}: {
  options: SegmentOption<T>[];
  value: T;
  onChange: (v: T) => void;
}) {
  const { theme } = useTheme();
  return (
    <View style={[styles.row, { backgroundColor: theme.color.surfaceHi, borderRadius: theme.radii.md, padding: 3 }]}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={[
              styles.item,
              { borderRadius: theme.radii.sm, backgroundColor: active ? theme.color.accent : "transparent" }
            ]}
          >
            <Text
              variant="label"
              style={{ color: active ? "#fff" : theme.color.inkMute, fontWeight: "600" }}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row" },
  item: { flex: 1, paddingVertical: 8, alignItems: "center", justifyContent: "center" }
});
