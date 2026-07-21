import React from "react";
import { View } from "react-native";
import { useTheme } from "../core/theme/ThemeProvider";
import { Icon, type IconName } from "./Icon";
import { Text } from "./Text";

// Ported from web EmptyState: icon tile + title + optional description + action.
export function EmptyState({
  icon,
  title,
  description,
  action
}: {
  icon?: IconName;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  const { theme } = useTheme();
  return (
    <View style={{ alignItems: "center", paddingVertical: 48, paddingHorizontal: 24 }}>
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
        {icon ? <Icon name={icon} size={20} color={theme.color.inkMute} /> : null}
      </View>
      <Text variant="heading" style={{ textAlign: "center" }}>
        {title}
      </Text>
      {description ? (
        <Text variant="body" tone="mute" style={{ textAlign: "center", marginTop: 6, maxWidth: 320, lineHeight: 21 }}>
          {description}
        </Text>
      ) : null}
      {action ? <View style={{ marginTop: 20 }}>{action}</View> : null}
    </View>
  );
}
