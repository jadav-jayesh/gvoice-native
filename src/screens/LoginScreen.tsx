import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useState } from "react";
import { Keyboard, KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput, View } from "react-native";
import { Button } from "../ui/Button";
import { Icon } from "../ui/Icon";
import { PasswordInput } from "../ui/PasswordInput";
import { Screen } from "../ui/Screen";
import { Text } from "../ui/Text";
import { ConsentLine } from "../ui/legal";
import { FadeSlideIn } from "../ui/motion";
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
    // Close the keyboard first so the window isn't mid-resize when the
    // navigator swaps to the app — otherwise the dashboard can mount scrolled.
    Keyboard.dismiss();
    setError(null);
    setBusy(true);
    try {
      await signIn(email.trim(), password);
      // On success the auth store flips and RootNavigator swaps to the app.
    } catch (e) {
      setError(e instanceof UnauthorizedError ? "Email or password is incorrect." : "Something went wrong. Please try again.");
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
          <FadeSlideIn>
            {/* Centered header — brand glyph + title + subtitle, matching web */}
            <View style={{ alignItems: "center", marginBottom: 4 }}>
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  backgroundColor: theme.color.accent,
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 18
                }}
              >
                <Icon name="Wave" size={22} color="#fff" />
              </View>
              <Text variant="title" style={{ textAlign: "center" }}>
                Welcome back
              </Text>
              <Text variant="body" tone="mute" style={{ marginTop: 6, lineHeight: 21, textAlign: "center" }}>
                Sign in — your summaries, transcripts and action items are waiting.
              </Text>
            </View>
          </FadeSlideIn>

          <FadeSlideIn delay={60}>
            <View style={{ gap: 14, marginTop: 26 }}>
              {error ? (
                <View style={styles.errorRow}>
                  <Icon name="AlertCircle" size={15} color={theme.color.danger} />
                  <Text tone="danger" variant="label" style={{ flex: 1 }}>
                    {error}
                  </Text>
                </View>
              ) : null}
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="Email"
                placeholderTextColor={theme.color.inkFaint}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                returnKeyType="next"
                style={inputStyle}
              />
              <PasswordInput
                value={password}
                onChangeText={setPassword}
                placeholder="Password"
                autoCapitalize="none"
                returnKeyType="go"
                onSubmitEditing={() => email && password && onSubmit()}
              />
              <Button title={busy ? "Signing in…" : "Sign in"} onPress={onSubmit} loading={busy} disabled={!email || !password} style={{ marginTop: 4 }} />
            </View>
          </FadeSlideIn>

          <FadeSlideIn delay={120}>
            <Pressable
              onPress={() => navigation.navigate("Signup")}
              accessibilityRole="button"
              style={{ marginTop: 22, alignItems: "center", minHeight: 44, justifyContent: "center" }}
            >
              <Text tone="mute">
                New to gVoice? <Text tone="accent">Create an account</Text>
              </Text>
            </Pressable>

            <View style={{ marginTop: 18 }}>
              <ConsentLine onTerms={() => navigation.navigate("Terms")} onPrivacy={() => navigation.navigate("Privacy")} />
            </View>
          </FadeSlideIn>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, justifyContent: "center" },
  errorRow: { flexDirection: "row", alignItems: "center", gap: 6 }
});
