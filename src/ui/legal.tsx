import React from "react";
import { Linking, View, type ViewStyle } from "react-native";
import { useTheme } from "../core/theme/ThemeProvider";
import { Screen } from "./Screen";
import { Text } from "./Text";

// Native equivalent of the web `legal/LegalLayout` chrome + prose helpers, so
// the Terms and Privacy screens read the same as the website: eyebrow, big
// title, "Last updated", intro, numbered sections, and a footer note.

// Consent line for the auth screens. The caption sits on its own line and the
// two links share a second, centered row separated by a dot — so neither link
// ever wraps mid-phrase.
export function ConsentLine({ onTerms, onPrivacy }: { onTerms: () => void; onPrivacy: () => void }) {
  const { theme } = useTheme();
  return (
    <View style={{ alignItems: "center", gap: 5 }}>
      <Text variant="caption" tone="faint">
        By signing up you agree to our
      </Text>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", flexWrap: "wrap", gap: 8 }}>
        <Text variant="caption" tone="accent" style={{ fontWeight: "600" }} onPress={onTerms}>
          Terms & Conditions
        </Text>
        <View style={{ width: 3, height: 3, borderRadius: 2, backgroundColor: theme.color.inkFaint }} />
        <Text variant="caption" tone="accent" style={{ fontWeight: "600" }} onPress={onPrivacy}>
          Privacy Policy
        </Text>
      </View>
    </View>
  );
}

export function LegalScreen({
  title,
  updated,
  intro,
  children
}: {
  title: string;
  updated: string;
  intro?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { theme } = useTheme();
  return (
    <Screen scroll contentStyle={{ paddingBottom: 40 }}>
      <Text variant="caption" tone="accent" style={{ letterSpacing: 2, fontWeight: "700" }}>
        LEGAL
      </Text>
      <Text variant="hero" style={{ marginTop: 8, lineHeight: 40 }}>
        {title}
      </Text>
      <Text variant="caption" tone="faint" style={{ marginTop: 8 }}>
        Last updated: {updated}
      </Text>
      {intro ? <View style={{ marginTop: 16 }}>{intro}</View> : null}

      <View style={{ marginTop: 28, gap: 28 }}>{children}</View>

      <View style={{ marginTop: 36, borderTopWidth: 1, borderTopColor: theme.color.line, paddingTop: 20 }}>
        <Text variant="caption" tone="faint" style={{ lineHeight: 18 }}>
          © 2015–2026 GROOVY TECHNOWEB PRIVATE LIMITED. All rights reserved. gVoice is a product of Groovy
          Technoweb Private Limited.
        </Text>
      </View>
    </Screen>
  );
}

export function Section({ n, title, children }: { n?: string; title: string; children: React.ReactNode }) {
  const { theme } = useTheme();
  return (
    <View style={{ gap: 12 }}>
      <Text variant="heading" style={{ fontSize: 19 }}>
        {n ? <Text style={{ color: theme.color.accent }}>{n}. </Text> : null}
        {title}
      </Text>
      <View style={{ gap: 12 }}>{children}</View>
    </View>
  );
}

export function P({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return (
    <Text variant="body" tone="soft" style={[{ lineHeight: 22 }, style as object]}>
      {children}
    </Text>
  );
}

// Bold inline emphasis — usable inside <P> (nested RN Text).
export function B({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  return <Text style={{ fontWeight: "700", color: theme.color.ink }}>{children}</Text>;
}

// Inline mailto link.
export function Mail({ address }: { address: string }) {
  const { theme } = useTheme();
  return (
    <Text style={{ color: theme.color.accent, fontWeight: "600" }} onPress={() => Linking.openURL(`mailto:${address}`)}>
      {address}
    </Text>
  );
}

export function UL({ children }: { children: React.ReactNode }) {
  return <View style={{ gap: 10 }}>{children}</View>;
}

export function LI({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  return (
    <View style={{ flexDirection: "row", gap: 10 }}>
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: theme.color.accent, marginTop: 8 }} />
      <Text variant="body" tone="soft" style={{ flex: 1, lineHeight: 22 }}>
        {children}
      </Text>
    </View>
  );
}

// Bordered notice box for important callouts (e.g. recording consent).
export function Callout({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: theme.color.line,
        backgroundColor: theme.color.surfaceHi,
        borderRadius: theme.radii.md,
        padding: 14
      }}
    >
      <Text variant="body" tone="soft" style={{ lineHeight: 22 }}>
        {children}
      </Text>
    </View>
  );
}

// Sub-processor list — stacked rows on mobile (a table is too wide for phones).
export function SubProcessorTable({ rows }: { rows: { name: string; purpose: string; location: string }[] }) {
  const { theme } = useTheme();
  return (
    <View style={{ borderWidth: 1, borderColor: theme.color.line, borderRadius: theme.radii.md, overflow: "hidden" }}>
      {rows.map((r, i) => (
        <View
          key={r.name}
          style={{
            padding: 12,
            gap: 4,
            borderTopWidth: i === 0 ? 0 : 1,
            borderTopColor: theme.color.line,
            backgroundColor: i % 2 === 0 ? "transparent" : theme.color.surfaceHi + "55"
          }}
        >
          <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 8 }}>
            <Text variant="label" style={{ flex: 1 }}>
              {r.name}
            </Text>
            <Text variant="caption" tone="faint">
              {r.location}
            </Text>
          </View>
          <Text variant="caption" tone="mute" style={{ lineHeight: 18 }}>
            {r.purpose}
          </Text>
        </View>
      ))}
    </View>
  );
}
