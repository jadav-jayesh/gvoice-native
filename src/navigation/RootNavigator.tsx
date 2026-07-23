import { DarkTheme, DefaultTheme, NavigationContainer, type Theme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { View } from "react-native";
import { useAuth } from "../core/auth/AuthProvider";
import { useTheme } from "../core/theme/ThemeProvider";
import { Icon, type IconName } from "../ui/Icon";
import { LoginScreen } from "../screens/LoginScreen";
import { SignupScreen } from "../screens/SignupScreen";
import { DashboardScreen } from "../screens/DashboardScreen";
import { MeetingsListScreen } from "../screens/MeetingsListScreen";
import { MeetingDetailScreen } from "../screens/MeetingDetailScreen";
import { RecordMeetingScreen } from "../screens/RecordMeetingScreen";
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
    <MeetingsStack.Navigator
      screenOptions={{
        // Child routes show the native header back button automatically, and
        // back gestures stay enabled: edge swipe on iOS, the system back
        // gesture/button on Android. Both pop back to the meetings list.
        gestureEnabled: true
      }}
    >
      <MeetingsStack.Screen name="MeetingsList" component={MeetingsListScreen} options={{ title: "Meetings" }} />
      <MeetingsStack.Screen
        name="MeetingDetail"
        component={MeetingDetailScreen}
        options={({ route }) => ({ title: route.params.title ?? "Meeting" })}
      />
      <MeetingsStack.Screen name="RecordMeeting" component={RecordMeetingScreen} options={{ title: "Record" }} />
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
      <Tabs.Screen
        name="Meetings"
        component={MeetingsNavigator}
        listeners={({ navigation }) => ({
          // Tapping the tab always lands on the meetings list, even when a
          // detail screen was left open inside the stack.
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate("Meetings", { screen: "MeetingsList" });
          }
        })}
      />
      <Tabs.Screen name="Insights" component={InsightsScreen} />
      <Tabs.Screen name="Profile" component={ProfileScreen} />
    </Tabs.Navigator>
  );
}

// The animated BrandSplash is disabled for now — the native OS splash screen
// (Instagram-style icon + branding) is the only splash. It is held on screen
// (see preventAutoHideAsync below) until auth resolves, so this fallback frame
// is rarely visible; it just guards against a flash if the splash hides early.
function Splash() {
  return <View style={{ flex: 1, backgroundColor: "#04070E" }} />;
}

// Keep the native splash up past the first React frame — without this it
// dismisses immediately and the user stares at a blank page while the session
// check (getMe) does a network round-trip.
SplashScreen.preventAutoHideAsync().catch(() => undefined);

export function RootNavigator() {
  const { user, ready } = useAuth();
  const { theme, mode } = useTheme();

  // Drop the native splash once we know where the user lands (login or app).
  // The 10s cap is a safety net so a hung network call can't trap the splash.
  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync().catch(() => undefined);
      return;
    }
    const cap = setTimeout(() => SplashScreen.hideAsync().catch(() => undefined), 10000);
    return () => clearTimeout(cap);
  }, [ready]);

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
