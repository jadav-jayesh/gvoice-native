import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useState } from "react";
import { Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { signup } from "../core/api/endpoints";
import { useAuthStore } from "../core/store/authStore";
import { useTheme } from "../core/theme/ThemeProvider";
import { Button } from "../ui/Button";
import { Icon } from "../ui/Icon";
import { Screen } from "../ui/Screen";
import { Text } from "../ui/Text";
import { ConsentLine } from "../ui/legal";
import { PasswordInput } from "../ui/PasswordInput";
import { FadeSlideIn } from "../ui/motion";
import { PasswordRequirements } from "../features/auth/PasswordRequirements";
import { EMAIL_RE, isStrongPassword } from "../features/auth/validators";
import type { AuthStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<AuthStackParamList, "Signup">;

export function SignupScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const setUser = useAuthStore((s) => s.setUser);
  const [firstName, setFirst] = useState("");
  const [lastName, setLast] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valid = firstName.trim() && lastName.trim() && EMAIL_RE.test(email.trim()) && isStrongPassword(password);

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
    Keyboard.dismiss();
    setError(null);
    if (!valid) {
      setError("Please complete all fields with a strong password.");
      return;
    }
    setBusy(true);
    try {
      const res = await signup({ firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim().toLowerCase(), password });
      setUser(res.user);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      setError(/409|already/i.test(msg) ? "An account with this email already exists. Try signing in." : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingVertical: 24 }}
        >
          <FadeSlideIn>
            {/* Centered header — brand glyph + title + subtitle, matching web */}
            <View style={{ alignItems: "center", marginBottom: 28 }}>
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  backgroundColor: theme.color.accent,
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 16
                }}
              >
                <Icon name="Wave" size={22} color="#fff" />
              </View>
              <Text variant="title" style={{ textAlign: "center" }}>
                Create your account
              </Text>
              <Text variant="body" tone="mute" style={{ marginTop: 6, textAlign: "center", lineHeight: 21 }}>
                Start capturing every meeting in 60 seconds.
              </Text>
            </View>
          </FadeSlideIn>

          <FadeSlideIn delay={60}>
            {error ? (
              <View style={styles.errorRow}>
                <Icon name="AlertCircle" size={15} color={theme.color.danger} />
                <Text tone="danger" variant="label" style={{ flex: 1 }}>
                  {error}
                </Text>
              </View>
            ) : null}

            <View style={{ gap: 12 }}>
              <View style={{ flexDirection: "row", gap: 12 }}>
                <TextInput value={firstName} onChangeText={setFirst} placeholder="First name" placeholderTextColor={theme.color.inkFaint} returnKeyType="next" style={[input, { flex: 1 }]} />
                <TextInput value={lastName} onChangeText={setLast} placeholder="Last name" placeholderTextColor={theme.color.inkFaint} returnKeyType="next" style={[input, { flex: 1 }]} />
              </View>
              <TextInput value={email} onChangeText={setEmail} placeholder="Work email" placeholderTextColor={theme.color.inkFaint} autoCapitalize="none" keyboardType="email-address" returnKeyType="next" style={input} />
              <PasswordInput value={password} onChangeText={setPassword} placeholder="Create a strong password" autoCapitalize="none" />
              <PasswordRequirements value={password} />
              <Button title={busy ? "Creating account…" : "Create account"} onPress={submit} loading={busy} disabled={!valid} style={{ marginTop: 6 }} />
            </View>
          </FadeSlideIn>

          <FadeSlideIn delay={120}>
            <Pressable
              onPress={() => navigation.navigate("Login")}
              accessibilityRole="button"
              style={{ marginTop: 22, alignItems: "center", minHeight: 44, justifyContent: "center" }}
            >
              <Text tone="mute">
                Already have an account? <Text tone="accent">Sign in</Text>
              </Text>
            </Pressable>

            <View style={{ marginTop: 18 }}>
              <ConsentLine onTerms={() => navigation.navigate("Terms")} onPrivacy={() => navigation.navigate("Privacy")} />
            </View>
          </FadeSlideIn>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  errorRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 }
});
