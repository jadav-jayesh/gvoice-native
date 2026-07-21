import React, { useState } from "react";
import { TextInput, View } from "react-native";
import { changePassword } from "../../core/api/endpoints";
import { useTheme } from "../../core/theme/ThemeProvider";
import { Button } from "../../ui/Button";
import { Card } from "../../ui/Card";
import { Text } from "../../ui/Text";
import { PasswordRequirements } from "./PasswordRequirements";
import { isStrongPassword } from "./validators";

// Ported from web auth/ChangePasswordCard.
export function ChangePasswordCard() {
  const { theme } = useTheme();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  async function submit() {
    setError(null);
    setSaved(false);
    if (!current) return setError("Enter your current password.");
    if (!isStrongPassword(next)) return setError("New password isn't strong enough.");
    if (next !== confirm) return setError("Passwords don't match.");
    setBusy(true);
    try {
      await changePassword({ currentPassword: current, newPassword: next });
      setSaved(true);
      setCurrent("");
      setNext("");
      setConfirm("");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      setError(/incorrect|400/i.test(msg) ? "Current password is incorrect." : "Couldn't update password. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <Text variant="heading">Password</Text>
      <Text variant="caption" tone="mute" style={{ marginBottom: 14 }}>
        Choose a strong password you don't reuse elsewhere.
      </Text>
      {error ? (
        <Text tone="danger" variant="label" style={{ marginBottom: 10 }}>
          {error}
        </Text>
      ) : null}
      {saved ? (
        <Text variant="label" style={{ color: theme.color.success, marginBottom: 10 }}>
          Password updated.
        </Text>
      ) : null}
      <View style={{ gap: 12 }}>
        <TextInput value={current} onChangeText={setCurrent} placeholder="Current password" placeholderTextColor={theme.color.inkFaint} secureTextEntry autoCapitalize="none" style={input} />
        <TextInput value={next} onChangeText={setNext} placeholder="New password" placeholderTextColor={theme.color.inkFaint} secureTextEntry autoCapitalize="none" style={input} />
        <PasswordRequirements value={next} />
        <TextInput value={confirm} onChangeText={setConfirm} placeholder="Confirm new password" placeholderTextColor={theme.color.inkFaint} secureTextEntry autoCapitalize="none" style={input} />
        <Button title="Update password" onPress={submit} loading={busy} />
      </View>
    </Card>
  );
}
