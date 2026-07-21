import React from "react";
import { Text as RNText, type TextProps, type TextStyle } from "react-native";
import { useTheme } from "../core/theme/ThemeProvider";
import { fontSize } from "../core/theme/tokens";

type Variant = "hero" | "title" | "heading" | "body" | "label" | "caption";
type Tone = "ink" | "soft" | "mute" | "faint" | "accent" | "danger";
type SizeKey = keyof typeof fontSize;

const SIZE: Record<Variant, { size: SizeKey; weight: TextStyle["fontWeight"] }> = {
  hero: { size: "display", weight: "800" },
  title: { size: "xxl", weight: "700" },
  heading: { size: "lg", weight: "700" },
  body: { size: "md", weight: "400" },
  label: { size: "sm", weight: "600" },
  caption: { size: "xs", weight: "500" }
};

const TONE_KEY: Record<Tone, "ink" | "inkSoft" | "inkMute" | "inkFaint" | "accent" | "danger"> = {
  ink: "ink",
  soft: "inkSoft",
  mute: "inkMute",
  faint: "inkFaint",
  accent: "accent",
  danger: "danger"
};

export function Text({
  variant = "body",
  tone = "ink",
  style,
  ...rest
}: TextProps & { variant?: Variant; tone?: Tone }) {
  const { theme } = useTheme();
  const cfg = SIZE[variant];
  return (
    <RNText
      style={[
        { color: theme.color[TONE_KEY[tone]], fontSize: theme.fontSize[cfg.size], fontWeight: cfg.weight },
        style
      ]}
      {...rest}
    />
  );
}
