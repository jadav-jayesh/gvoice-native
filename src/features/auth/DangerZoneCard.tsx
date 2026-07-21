import React, { useState } from "react";
import { TextInput, View } from "react-native";
import { deleteAccount } from "../../core/api/endpoints";
import { nativeCookieStore } from "../../core/api/cookieStore";
import { useAuthStore } from "../../core/store/authStore";
import { useTheme } from "../../core/theme/ThemeProvider";
import { Button } from "../../ui/Button";
import { Card } from "../../ui/Card";
import { Text } from "../../ui/Text";

// Ported from web auth/DangerZoneCard: two-step confirm + password to delete.
export function DangerZoneCard() {
  const { theme } = useTheme();
  const setUser = useAuthStore((s) => s.setUser);
  const [confirming, setConfirming] = useState(false);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    if (!password) return setError("Enter your password to confirm.");
    setBusy(true);
    try {
      await deleteAccount(password);
      await nativeCookieStore.clearAll().catch(() => undefined);
      setUser(null); // flips navigator back to auth
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      setError(/incorrect|400/i.test(msg) ? "Password is incorrect." : "Couldn't delete your account. Please try again.");
      setBusy(false);
    }
  }

  return (
    <Card style={{ borderColor: theme.color.danger + "55" }}>
      <Text variant="heading" style={{ color: theme.color.danger }}>
        Delete account
      </Text>
      <Text variant="caption" tone="mute" style={{ marginBottom: 14 }}>
        This permanently deletes your account and all meetings. This cannot be undone.
      </Text>
      {!confirming ? (
        <Button title="Delete account" variant="danger" onPress={() => setConfirming(true)} />
      ) : (
        <View style={{ gap: 12 }}>
          {error ? (
            <Text tone="danger" variant="label">
              {error}
            </Text>
          ) : null}
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
            placeholderTextColor={theme.color.inkFaint}
            secureTextEntry
            autoCapitalize="none"
            style={{
              height: 48,
              borderWidth: 1,
              borderColor: theme.color.line,
              borderRadius: theme.radii.md,
              paddingHorizontal: 14,
              color: theme.color.ink,
              backgroundColor: theme.color.surface,
              fontSize: theme.fontSize.md
            }}
          />
          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Button title="Cancel" variant="ghost" onPress={() => { setConfirming(false); setPassword(""); setError(null); }} />
            </View>
            <View style={{ flex: 1 }}>
              <Button title="Permanently delete" variant="danger" onPress={submit} loading={busy} />
            </View>
          </View>
        </View>
      )}
    </Card>
  );
}
