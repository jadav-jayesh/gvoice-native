import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { updateMe } from "../core/api/endpoints";
import { useAuth } from "../core/auth/AuthProvider";
import { useAuthStore } from "../core/store/authStore";
import { useTheme, type ThemePreference } from "../core/theme/ThemeProvider";
import { Avatar } from "../ui/Avatar";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { ConfirmModal } from "../ui/ConfirmModal";
import { Icon } from "../ui/Icon";
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
  const [confirmSignOut, setConfirmSignOut] = useState(false);

  useEffect(() => {
    setFirst(user?.firstName ?? "");
    setLast(user?.lastName ?? "");
  }, [user?.firstName, user?.lastName]);

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

  return (
    <Screen scroll contentStyle={{ gap: 16 }}>
      <Text variant="title">Profile</Text>

      <Card>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 18 }}>
          <Avatar name={user ? `${user.firstName} ${user.lastName}` : "?"} size={56} />
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <Text variant="heading">{user ? `${user.firstName} ${user.lastName}` : "—"}</Text>
              {user?.role === "admin" ? (
                <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: theme.radii.pill, backgroundColor: theme.color.accent + "22" }}>
                  <Text variant="caption" style={{ color: theme.color.accent, fontWeight: "700" }}>
                    ADMIN
                  </Text>
                </View>
              ) : null}
            </View>
            <Text variant="body" tone="mute" numberOfLines={1}>
              {user?.email}
            </Text>
          </View>
        </View>

        {saved ? (
          <View style={styles.savedRow}>
            <Icon name="CheckCircle" size={15} color={theme.color.success} />
            <Text variant="label" style={{ color: theme.color.success }}>
              Changes saved.
            </Text>
          </View>
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
        <Text variant="label" tone="mute" style={{ marginBottom: 12, letterSpacing: 0.3 }}>
          APPEARANCE
        </Text>
        <View style={[styles.segment, { backgroundColor: theme.color.surfaceHi, borderRadius: theme.radii.md, padding: 4 }]}>
          {PREFS.map((p) => {
            const active = preference === p;
            return (
              <Pressable
                key={p}
                onPress={() => setPreference(p)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                style={[styles.segmentItem, { backgroundColor: active ? theme.color.accent : "transparent", borderRadius: theme.radii.sm }]}
              >
                <Text style={{ color: active ? "#fff" : theme.color.inkMute, fontWeight: "600", fontSize: theme.fontSize.sm }}>
                  {p[0].toUpperCase() + p.slice(1)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <ChangePasswordCard />
      <DangerZoneCard />

      <Button title="Sign out" variant="danger" onPress={() => setConfirmSignOut(true)} loading={busy} style={{ marginBottom: 12 }} />

      <ConfirmModal
        visible={confirmSignOut}
        title="Sign out?"
        message="You'll need to sign in again to see your meetings."
        confirmLabel="Sign out"
        destructive
        loading={busy}
        onConfirm={async () => {
          setBusy(true);
          try {
            await signOut();
          } finally {
            setBusy(false);
            setConfirmSignOut(false);
          }
        }}
        onCancel={() => setConfirmSignOut(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  segment: { flexDirection: "row", gap: 4 },
  segmentItem: { flex: 1, height: 40, alignItems: "center", justifyContent: "center" },
  savedRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 }
});
