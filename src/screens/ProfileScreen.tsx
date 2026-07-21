import React, { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useAuth } from "../core/auth/AuthProvider";
import { useTheme, type ThemePreference } from "../core/theme/ThemeProvider";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Screen } from "../ui/Screen";
import { Text } from "../ui/Text";

const PREFS: ThemePreference[] = ["light", "dark", "system"];

export function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { theme, preference, setPreference } = useTheme();
  const [busy, setBusy] = useState(false);

  async function onLogout() {
    setBusy(true);
    try {
      await signOut();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen scroll>
      <Text variant="title" style={{ marginBottom: 16 }}>
        Profile
      </Text>

      <Card>
        <Text variant="heading">
          {user ? `${user.firstName} ${user.lastName}` : "—"}
        </Text>
        <Text variant="body" tone="mute" style={{ marginTop: 2 }}>
          {user?.email}
        </Text>
        {user?.role === "admin" ? (
          <Text variant="caption" tone="accent" style={{ marginTop: 6 }}>
            ADMIN
          </Text>
        ) : null}
      </Card>

      <Card style={{ marginTop: 16 }}>
        <Text variant="label" tone="mute" style={{ marginBottom: 12 }}>
          APPEARANCE
        </Text>
        <View style={styles.segment}>
          {PREFS.map((p) => {
            const active = preference === p;
            return (
              <Pressable
                key={p}
                onPress={() => setPreference(p)}
                style={[
                  styles.segmentItem,
                  {
                    backgroundColor: active ? theme.color.accent : theme.color.surfaceHi,
                    borderRadius: theme.radii.sm
                  }
                ]}
              >
                <Text style={{ color: active ? "#fff" : theme.color.ink, fontWeight: "600", fontSize: theme.fontSize.sm }}>
                  {p[0].toUpperCase() + p.slice(1)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Button title="Sign out" variant="danger" onPress={onLogout} loading={busy} style={{ marginTop: 24 }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  segment: { flexDirection: "row", gap: 8 },
  segmentItem: { flex: 1, height: 40, alignItems: "center", justifyContent: "center" }
});
