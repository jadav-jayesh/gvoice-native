import { QueryClientProvider } from "@tanstack/react-query";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "./src/core/auth/AuthProvider";
import { queryClient } from "./src/core/query/queryClient";
import { ThemeProvider, useTheme } from "./src/core/theme/ThemeProvider";
import { RootNavigator } from "./src/navigation/RootNavigator";

// StatusBar text colour must follow the resolved theme, so it lives inside
// ThemeProvider.
function ThemedStatusBar() {
  const { mode } = useTheme();
  return <StatusBar style={mode === "dark" ? "light" : "dark"} />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <ThemedStatusBar />
            <RootNavigator />
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
