import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { updateMe } from "../core/api/endpoints";
import { useAuth } from "../core/auth/AuthProvider";
import { useAuthStore } from "../core/store/authStore";
import { useTheme, type ThemePreference } from "../core/theme/ThemeProvider";
import { Avatar } from "../ui/Avatar";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Screen } from "../ui/Screen";
import { Text } from "../ui/Text";
import { ChangePasswordCard } from "../features/auth/ChangePasswordCard";
import { DangerZoneCard } from "../features/auth/DangerZoneCard";

const PREFS: ThemePreference[] = ["light", "dark", "system"];

export function ProfileScreen() {
  const { user, signOut } = useAuth();
  const setUser = useAuthStore((s) => s.setUser);
  const { theme, preference, setPreference } = useTheme();
  const [firstName, setFirst] = useState(user?.firstName ?? "");
  const [lastName, setLast] = useState(user?.lastName ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setFirst(user?.firstName ?? "");
    setLast(user?.lastName ?? "");
  }, [user?.firstName, user?.lastName]);

  const dirty = !!user && (firstName.trim() !== user.firstName || lastName.trim() !== user.lastName);

  async function save() {
    setSaving(true);
    setSaved(false);
    try {
      const res = await updateMe({ firstName: firstName.trim(), lastName: lastName.trim() });
      setUser(res.user);
      setSaved(true);
    } catch {
      // keep silent; button re-enables
    } finally {
      setSaving(false);
    }
  }

  const input = {
    height: 48,
    borderWidth: 1,
    borderColor: theme.color.line,
    borderRadius: theme.radii.md,
    paddingHorizontal: 14,
    color: theme.color.ink,
    backgroundColor: theme.color.surface,
    fontSize: theme.fontSize.md
  };

  return (
    <Screen scroll contentStyle={{ gap: 16 }}>
      <Text variant="title">Profile</Text>

      <Card>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <Avatar name={user ? `${user.firstName} ${user.lastName}` : "?"} size={56} />
          <View style={{ flex: 1 }}>
            <Text variant="heading">{user ? `${user.firstName} ${user.lastName}` : "—"}</Text>
            <Text variant="body" tone="mute">
              {user?.email}
            </Text>
            {user?.role === "admin" ? (
              <Text variant="caption" tone="accent" style={{ marginTop: 4 }}>
                ADMIN
              </Text>
            ) : null}
          </View>
        </View>

        {saved ? (
          <Text variant="label" style={{ color: theme.color.success, marginBottom: 10 }}>
            Changes saved.
          </Text>
        ) : null}
        <View style={{ gap: 12 }}>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <TextInput value={firstName} onChangeText={setFirst} placeholder="First name" placeholderTextColor={theme.color.inkFaint} style={[input, { flex: 1 }]} />
            <TextInput value={lastName} onChangeText={setLast} placeholder="Last name" placeholderTextColor={theme.color.inkFaint} style={[input, { flex: 1 }]} />
          </View>
          <TextInput value={user?.email ?? ""} editable={false} style={[input, { color: theme.color.inkFaint }]} />
          <Button title="Save changes" onPress={save} loading={saving} disabled={!dirty} />
        </View>
      </Card>

      <Card>
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
                style={[styles.segmentItem, { backgroundColor: active ? theme.color.accent : theme.color.surfaceHi, borderRadius: theme.radii.sm }]}
              >
                <Text style={{ color: active ? "#fff" : theme.color.ink, fontWeight: "600", fontSize: theme.fontSize.sm }}>
                  {p[0].toUpperCase() + p.slice(1)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <ChangePasswordCard />
      <DangerZoneCard />

      <Button title="Sign out" variant="danger" onPress={async () => { setBusy(true); await signOut().finally(() => setBusy(false)); }} loading={busy} style={{ marginBottom: 12 }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  segment: { flexDirection: "row", gap: 8 },
  segmentItem: { flex: 1, height: 40, alignItems: "center", justifyContent: "center" }
});
