import React from "react";
import { View } from "react-native";
import { useTheme } from "../core/theme/ThemeProvider";
import { Icon, type IconName } from "./Icon";
import { Text } from "./Text";

// Section header used across cards: optional icon tile + title + optional count
// badge + optional right-side action.
export function SectionTitle({
  title,
  icon,
  count,
  right
}: {
  title: string;
  icon?: IconName;
  count?: number;
  right?: React.ReactNode;
}) {
  const { theme } = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
      {icon ? (
        <View
          style={{
            width: 24,
            height: 24,
            borderRadius: theme.radii.sm,
            backgroundColor: theme.color.surfaceHi,
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <Icon name={icon} size={14} color={theme.color.inkMute} />
        </View>
      ) : null}
      <Text variant="heading" style={{ flexShrink: 1 }}>
        {title}
      </Text>
      {typeof count === "number" ? (
        <View style={{ backgroundColor: theme.color.surfaceHi, borderRadius: theme.radii.pill, paddingHorizontal: 8, paddingVertical: 2 }}>
          <Text variant="caption" tone="mute">
            {count}
          </Text>
        </View>
      ) : null}
      {right ? <View style={{ marginLeft: "auto" }}>{right}</View> : null}
    </View>
  );
}
