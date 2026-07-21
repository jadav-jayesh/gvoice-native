import { DarkTheme, DefaultTheme, NavigationContainer, type Theme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import React from "react";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "../core/auth/AuthProvider";
import { useTheme } from "../core/theme/ThemeProvider";
import { Icon, type IconName } from "../ui/Icon";
import { LoginScreen } from "../screens/LoginScreen";
import { SignupScreen } from "../screens/SignupScreen";
import { DashboardScreen } from "../screens/DashboardScreen";
import { MeetingsListScreen } from "../screens/MeetingsListScreen";
import { MeetingDetailScreen } from "../screens/MeetingDetailScreen";
import { InsightsScreen } from "../screens/InsightsScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import type { AppTabsParamList, AuthStackParamList, MeetingsStackParamList } from "./types";

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const Tabs = createBottomTabNavigator<AppTabsParamList>();
const MeetingsStack = createNativeStackNavigator<MeetingsStackParamList>();

const TAB_ICON: Record<keyof AppTabsParamList, IconName> = {
  Dashboard: "Dashboard",
  Meetings: "Mic",
  Insights: "Insights",
  Profile: "User"
};

function MeetingsNavigator() {
  return (
    <MeetingsStack.Navigator>
      <MeetingsStack.Screen name="MeetingsList" component={MeetingsListScreen} options={{ title: "Meetings" }} />
      <MeetingsStack.Screen
        name="MeetingDetail"
        component={MeetingDetailScreen}
        options={({ route }) => ({ title: route.params.title ?? "Meeting" })}
      />
    </MeetingsStack.Navigator>
  );
}

function AppTabs() {
  const { theme } = useTheme();
  return (
    <Tabs.Navigator
      screenOptions={({ route }) => ({
        headerShown: route.name !== "Meetings",
        tabBarActiveTintColor: theme.color.accent,
        tabBarInactiveTintColor: theme.color.inkFaint,
        tabBarStyle: { backgroundColor: theme.color.bgElev, borderTopColor: theme.color.line },
        tabBarIcon: ({ color }) => <Icon name={TAB_ICON[route.name]} size={22} color={color} />
      })}
    >
      <Tabs.Screen name="Dashboard" component={DashboardScreen} />
      <Tabs.Screen name="Meetings" component={MeetingsNavigator} />
      <Tabs.Screen name="Insights" component={InsightsScreen} />
      <Tabs.Screen name="Profile" component={ProfileScreen} />
    </Tabs.Navigator>
  );
}

function Splash() {
  const { theme } = useTheme();
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: theme.color.bg }}>
      <ActivityIndicator color={theme.color.accent} size="large" />
    </View>
  );
}

export function RootNavigator() {
  const { user, ready } = useAuth();
  const { theme, mode } = useTheme();

  const base = mode === "dark" ? DarkTheme : DefaultTheme;
  const navTheme: Theme = {
    ...base,
    colors: {
      ...base.colors,
      primary: theme.color.accent,
      background: theme.color.bg,
      card: theme.color.bgElev,
      text: theme.color.ink,
      border: theme.color.line,
      notification: theme.color.accent
    }
  };

  return (
    <NavigationContainer theme={navTheme}>
      {!ready ? (
        <Splash />
      ) : user ? (
        <AppTabs />
      ) : (
        <AuthStack.Navigator screenOptions={{ headerShown: false }}>
          <AuthStack.Screen name="Login" component={LoginScreen} />
          <AuthStack.Screen name="Signup" component={SignupScreen} />
        </AuthStack.Navigator>
      )}
    </NavigationContainer>
  );
}
