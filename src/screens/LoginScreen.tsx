import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput, View } from "react-native";
import { Button } from "../ui/Button";
import { Screen } from "../ui/Screen";
import { Text } from "../ui/Text";
import { useAuth } from "../core/auth/AuthProvider";
import { useTheme } from "../core/theme/ThemeProvider";
import { UnauthorizedError } from "../core/api/client";
import type { AuthStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<AuthStackParamList, "Login">;

export function LoginScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit() {
    setError(null);
    setBusy(true);
    try {
      await signIn(email.trim(), password);
      // On success the auth store flips and RootNavigator swaps to the app.
    } catch (e) {
      setError(e instanceof UnauthorizedError ? "Wrong email or password." : "Could not sign in. Try again.");
    } finally {
      setBusy(false);
    }
  }

  const inputStyle = {
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
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.flex}>
        <View style={styles.center}>
          <Text variant="hero" tone="accent">
            gVoice
          </Text>
          <Text variant="body" tone="mute" style={{ marginTop: 4, marginBottom: 28 }}>
            Sign in to your meetings
          </Text>

          <View style={{ gap: 12 }}>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Email"
              placeholderTextColor={theme.color.inkFaint}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              style={inputStyle}
            />
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              placeholderTextColor={theme.color.inkFaint}
              secureTextEntry
              autoCapitalize="none"
              style={inputStyle}
            />
            {error ? (
              <Text tone="danger" variant="label">
                {error}
              </Text>
            ) : null}
            <Button title="Sign in" onPress={onSubmit} loading={busy} disabled={!email || !password} />
          </View>

          <Pressable onPress={() => navigation.navigate("Signup")} style={{ marginTop: 20, alignItems: "center" }}>
            <Text tone="mute">
              New to gVoice? <Text tone="accent">Create an account</Text>
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, justifyContent: "center" }
});
