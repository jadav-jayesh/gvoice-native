import React from "react";
import { ScrollView, StyleSheet, View, type ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../core/theme/ThemeProvider";

// Themed page wrapper. `scroll` wraps content in a ScrollView; otherwise a plain
// flex View (for screens that host their own FlashList).
export function Screen({
  children,
  scroll = false,
  padded = true,
  contentStyle
}: {
  children: React.ReactNode;
  scroll?: boolean;
  padded?: boolean;
  contentStyle?: ViewStyle;
}) {
  const { theme } = useTheme();
  const pad = padded ? { padding: theme.spacing.lg } : null;
  const body =
    scroll ? (
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[pad, contentStyle]}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    ) : (
      <View style={[styles.flex, pad, contentStyle]}>{children}</View>
    );

  return <SafeAreaView style={[styles.flex, { backgroundColor: theme.color.bg }]} edges={["top"]}>{body}</SafeAreaView>;
}

const styles = StyleSheet.create({ flex: { flex: 1 } });
