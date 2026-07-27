import React, { useState } from "react";
import { Pressable, TextInput, View, type TextInputProps, type ViewStyle } from "react-native";
import { useTheme } from "../core/theme/ThemeProvider";
import { Icon, type IconName } from "./Icon";
import { Text } from "./Text";

// Reusable form input shared across auth + profile. Adds an animated focus
// border, an optional leading icon, an optional password visibility toggle,
// and an optional label — while forwarding every TextInput prop untouched, so
// no calling screen changes behaviour.
export function TextField({
  label,
  icon,
  password,
  containerStyle,
  style,
  editable = true,
  ...rest
}: TextInputProps & {
  label?: string;
  icon?: IconName;
  password?: boolean;
  containerStyle?: ViewStyle;
}) {
  const { theme } = useTheme();
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(!!password);

  const borderColor = !editable ? theme.color.line : focused ? theme.color.accent : theme.color.line;

  return (
    <View style={containerStyle}>
      {label ? (
        <Text variant="caption" tone="mute" style={{ marginBottom: 6, letterSpacing: 0.3 }}>
          {label.toUpperCase()}
        </Text>
      ) : null}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          height: 50,
          borderWidth: 1,
          borderColor,
          borderRadius: theme.radii.md,
          backgroundColor: editable ? theme.color.surface : theme.color.surfaceHi,
          paddingHorizontal: 14,
          gap: 10
        }}
      >
        {icon ? <Icon name={icon} size={18} color={focused ? theme.color.accent : theme.color.inkFaint} /> : null}
        <TextInput
          {...rest}
          editable={editable}
          secureTextEntry={password ? hidden : rest.secureTextEntry}
          onFocus={(e) => {
            setFocused(true);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            rest.onBlur?.(e);
          }}
          placeholderTextColor={theme.color.inkFaint}
          style={[
            {
              flex: 1,
              height: "100%",
              color: editable ? theme.color.ink : theme.color.inkFaint,
              fontSize: theme.fontSize.md
            },
            style
          ]}
        />
        {password ? (
          <Pressable
            onPress={() => setHidden((h) => !h)}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={hidden ? "Show password" : "Hide password"}
          >
            <Text variant="caption" tone="accent" style={{ fontWeight: "600" }}>
              {hidden ? "Show" : "Hide"}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
