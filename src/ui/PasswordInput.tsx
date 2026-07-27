import React, { useState } from "react";
import { Pressable, TextInput, View, type TextInputProps } from "react-native";
import { useTheme } from "../core/theme/ThemeProvider";
import { Icon } from "./Icon";

// Plain bordered password input with an eye toggle to show/hide the value.
// Matches the app's standard input look; forwards all TextInput props.
export function PasswordInput({ style, ...rest }: TextInputProps) {
  const { theme } = useTheme();
  const [hidden, setHidden] = useState(true);

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        height: 48,
        borderWidth: 1,
        borderColor: theme.color.line,
        borderRadius: theme.radii.md,
        backgroundColor: theme.color.surface,
        paddingLeft: 14,
        paddingRight: 6
      }}
    >
      <TextInput
        {...rest}
        secureTextEntry={hidden}
        placeholderTextColor={theme.color.inkFaint}
        style={[{ flex: 1, height: "100%", color: theme.color.ink, fontSize: theme.fontSize.md }, style]}
      />
      <Pressable
        onPress={() => setHidden((h) => !h)}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={hidden ? "Show password" : "Hide password"}
        style={({ pressed }) => ({ width: 40, height: 40, alignItems: "center", justifyContent: "center", opacity: pressed ? 0.6 : 1 })}
      >
        <Icon name={hidden ? "Eye" : "EyeOff"} size={18} color={theme.color.inkMute} />
      </Pressable>
    </View>
  );
}
