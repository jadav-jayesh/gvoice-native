import React from "react";
import { View } from "react-native";
import { useTheme } from "../core/theme/ThemeProvider";
import { Button } from "./Button";
import { Icon } from "./Icon";
import { Text } from "./Text";

// Shared failed-to-load state with a retry action. Two layouts:
// - default: centered block for full screens/lists (mirrors EmptyState)
// - compact: single row for cards where a tall block would crowd the layout
export function ErrorRetry({
  title = "Couldn't load this.",
  description,
  onRetry,
  retrying = false,
  compact = false
}: {
  title?: string;
  description?: string;
  onRetry: () => void;
  retrying?: boolean;
  compact?: boolean;
}) {
  const { theme } = useTheme();

  if (compact) {
    return (
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8 }}>
        <Icon name="AlertCircle" size={18} color={theme.color.danger} />
        <Text tone="mute" style={{ flex: 1 }}>
          {title}
        </Text>
        <Button title={retrying ? "Retrying…" : "Retry"} variant="secondary" onPress={onRetry} disabled={retrying} style={{ height: 36 }} />
      </View>
    );
  }

  return (
    <View style={{ alignItems: "center", paddingVertical: 40, paddingHorizontal: 24 }}>
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: theme.radii.md,
          borderWidth: 1,
          borderColor: theme.color.line,
          backgroundColor: theme.color.surfaceHi,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 16
        }}
      >
        <Icon name="AlertCircle" size={20} color={theme.color.danger} />
      </View>
      <Text variant="heading" style={{ textAlign: "center" }}>
        {title}
      </Text>
      {description ? (
        <Text variant="body" tone="mute" style={{ textAlign: "center", marginTop: 6, maxWidth: 320, lineHeight: 21 }}>
          {description}
        </Text>
      ) : null}
      <Button title={retrying ? "Retrying…" : "Retry"} variant="secondary" onPress={onRetry} disabled={retrying} style={{ marginTop: 20, minWidth: 120 }} />
    </View>
  );
}
