import React from "react";
import { View } from "react-native";
import { useTheme } from "../../core/theme/ThemeProvider";
import { Icon } from "../../ui/Icon";
import { Text } from "../../ui/Text";
import { passwordChecks } from "./validators";

const LABELS: { key: keyof ReturnType<typeof passwordChecks>; label: string }[] = [
  { key: "length", label: "8+ characters" },
  { key: "upper", label: "Uppercase letter" },
  { key: "lower", label: "Lowercase letter" },
  { key: "digit", label: "Number" },
  { key: "special", label: "Special character" }
];

// Ported from web auth/PasswordRequirements: live 5-item checklist.
export function PasswordRequirements({ value }: { value: string }) {
  const { theme } = useTheme();
  const checks = passwordChecks(value);
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
      {LABELS.map(({ key, label }) => {
        const ok = checks[key];
        return (
          <View key={key} style={{ flexDirection: "row", alignItems: "center", gap: 6, width: "46%" }}>
            {ok ? (
              <Icon name="Check" size={13} color={theme.color.success} />
            ) : (
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: theme.color.inkFaint }} />
            )}
            <Text variant="caption" style={{ color: ok ? theme.color.success : theme.color.inkMute }}>
              {label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
