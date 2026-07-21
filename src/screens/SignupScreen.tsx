import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View } from "react-native";
import { signup } from "../core/api/endpoints";
import { useAuthStore } from "../core/store/authStore";
import { useTheme } from "../core/theme/ThemeProvider";
import { Button } from "../ui/Button";
import { Screen } from "../ui/Screen";
import { Text } from "../ui/Text";
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

  async function submit() {
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
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}>
          <Text variant="hero" tone="accent">
            Create account
          </Text>
          <Text variant="body" tone="mute" style={{ marginTop: 4, marginBottom: 24 }}>
            Start capturing every meeting in 60 seconds.
          </Text>

          {error ? (
            <Text tone="danger" variant="label" style={{ marginBottom: 12 }}>
              {error}
            </Text>
          ) : null}

          <View style={{ gap: 12 }}>
            <View style={{ flexDirection: "row", gap: 12 }}>
              <TextInput value={firstName} onChangeText={setFirst} placeholder="First name" placeholderTextColor={theme.color.inkFaint} style={[input, { flex: 1 }]} />
              <TextInput value={lastName} onChangeText={setLast} placeholder="Last name" placeholderTextColor={theme.color.inkFaint} style={[input, { flex: 1 }]} />
            </View>
            <TextInput value={email} onChangeText={setEmail} placeholder="Work email" placeholderTextColor={theme.color.inkFaint} autoCapitalize="none" keyboardType="email-address" style={input} />
            <TextInput value={password} onChangeText={setPassword} placeholder="Create a strong password" placeholderTextColor={theme.color.inkFaint} secureTextEntry autoCapitalize="none" style={input} />
            <PasswordRequirements value={password} />
            <Button title="Create account" onPress={submit} loading={busy} disabled={!valid} style={{ marginTop: 6 }} />
          </View>

          <Pressable onPress={() => navigation.navigate("Login")} style={{ marginTop: 20, alignItems: "center" }}>
            <Text tone="mute">
              Already have an account? <Text tone="accent">Sign in</Text>
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
