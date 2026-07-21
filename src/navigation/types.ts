import type { NavigatorScreenParams } from "@react-navigation/native";

export type MeetingsStackParamList = {
  MeetingsList: undefined;
  MeetingDetail: { sessionId: string; title?: string };
};

export type AppTabsParamList = {
  Dashboard: undefined;
  Meetings: NavigatorScreenParams<MeetingsStackParamList> | undefined;
  Insights: undefined;
  Profile: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
};
