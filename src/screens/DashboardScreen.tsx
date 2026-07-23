import { useQuery } from "@tanstack/react-query";
import { useNavigation, type NavigationProp } from "@react-navigation/native";
import React, { useMemo, useState } from "react";
import {
  Dimensions,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { listMeetings, type InsightRange } from "../core/api/endpoints";
import type { MeetingListItem } from "../core/api/types";
import { sentimentHex } from "../core/lib/colors";
import {
  byMostNegative,
  formatRelative,
  isMeetingInProgress,
  isNegativeMeeting,
  platformLabel,
  platformTone,
  statusLabel,
} from "../core/lib/format";
import { useAuthStore } from "../core/store/authStore";
import { useTheme } from "../core/theme/ThemeProvider";
import { Badge } from "../ui/Badge";
import { Card } from "../ui/Card";
import { SentimentRing } from "../ui/charts/SentimentRing";
import { Sparkline } from "../ui/charts/Sparkline";
import { Heatmap } from "../ui/charts/Heatmap";
import { EmptyState } from "../ui/EmptyState";
import { Icon, type IconName } from "../ui/Icon";
import { Screen } from "../ui/Screen";
import { SectionTitle } from "../ui/Section";
import { ErrorRetry } from "../ui/ErrorRetry";
import { Skeleton } from "../ui/Skeleton";
import { Text } from "../ui/Text";
import { ActionItemsCard } from "../features/insights/ActionItemsCard";
import { RangeFilter } from "../features/insights/RangeFilter";
import { Equalizer, PulsingDot } from "../features/meetings/LiveCaptureCard";
import type { AppTabsParamList } from "../navigation/types";

function greetingFor(): string {
  const h = new Date().getHours();
  return h < 5
    ? "Good night"
    : h < 12
      ? "Good morning"
      : h < 18
        ? "Good afternoon"
        : "Good evening";
}

function todayLabel(): string {
  return new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function deriveStats(items: MeetingListItem[], total: number) {
  const completed = items.filter((m) => m.status === "completed").length;
  const inProgress = items.filter((m) => isMeetingInProgress(m.status)).length;
  const actionItemsTotal = items.reduce((a, m) => a + m.actionItems.length, 0);
  const avgActionItems = items.length ? actionItemsTotal / items.length : 0;

  const days = 26 * 7;
  const spark = new Array(days).fill(0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (const m of items) {
    const d = new Date(m.endedAt ?? m.startedAt ?? m.createdAt);
    d.setHours(0, 0, 0, 0);
    const idx = Math.floor((today.getTime() - d.getTime()) / 86400000);
    if (idx >= 0 && idx < days) spark[days - 1 - idx] += 1;
  }
  const last7 = spark.slice(days - 7).reduce((a, b) => a + b, 0);
  const prev7 = spark.slice(days - 14, days - 7).reduce((a, b) => a + b, 0);

  const dist = { positive: 0, neutral: 0, negative: 0 };
  for (const m of items) {
    const l = m.sentimentSummary?.overall.label;
    if (l) dist[l] += 1;
  }
  const sentimentTotal = dist.positive + dist.neutral + dist.negative;
  const completionRate = items.length
    ? Math.round((completed / items.length) * 100)
    : 0;

  return {
    completed,
    inProgress,
    actionItemsTotal,
    avgActionItems,
    spark,
    activityTrend: last7 - prev7,
    dist,
    sentimentTotal,
    completionRate,
    total,
  };
}

function Kpi({
  label,
  value,
  delta,
  deltaTone,
  accent,
  spark,
}: {
  label: string;
  value: number;
  delta: string;
  deltaTone?: "up" | "down" | "mute";
  accent: string;
  spark?: number[];
}) {
  const { theme } = useTheme();
  const deltaColor =
    deltaTone === "up"
      ? theme.color.success
      : deltaTone === "down"
        ? theme.color.warning
        : theme.color.inkMute;
  return (
    <Card style={{ flexGrow: 1, flexBasis: "46%" }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          marginBottom: 6,
        }}
      >
        <View
          style={{
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: accent,
          }}
        />
        <Text variant="caption" tone="mute">
          {label.toUpperCase()}
        </Text>
      </View>
      <Text
        style={{
          fontSize: 28,
          fontWeight: "700",
          color: theme.color.ink,
          fontVariant: ["tabular-nums"],
        }}
      >
        {value}
      </Text>
      {spark && spark.some((v) => v > 0) ? (
        <View style={{ marginTop: 4 }}>
          <Sparkline
            values={spark}
            width={130}
            height={30}
            stroke={accent}
            fillId={`k-${label.replace(/\s/g, "")}`}
          />
        </View>
      ) : null}
      <Text variant="caption" style={{ color: deltaColor, marginTop: 4 }}>
        {delta}
      </Text>
    </Card>
  );
}

// Compact tappable action used in the header row — the dashboard's primary
// shortcuts so recording/joining doesn't require a tab hop.
function QuickAction({
  icon,
  label,
  primary,
  onPress,
}: {
  icon: IconName;
  label: string;
  primary?: boolean;
  onPress: () => void;
}) {
  const { theme } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => ({
        flex: 1,
        minHeight: 48,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        borderRadius: theme.radii.md,
        backgroundColor: primary ? theme.color.accent : theme.color.surface,
        borderWidth: primary ? 0 : 1,
        borderColor: theme.color.line,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <Icon name={icon} size={17} color={primary ? "#fff" : theme.color.ink} />
      <Text
        variant="label"
        style={{ color: primary ? "#fff" : theme.color.ink }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

// List row shared by "Needs attention" and "Recent meetings": name first,
// context second, 44px+ touch target, chevron affordance.
function MeetingLine({
  meeting,
  left,
  metaRight,
  onPress,
}: {
  meeting: MeetingListItem;
  left?: React.ReactNode;
  metaRight?: React.ReactNode;
  onPress: () => void;
}) {
  const { theme } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={meeting.meetingName || "Untitled meeting"}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        minHeight: 52,
        paddingVertical: 8,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      {left}
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="body" numberOfLines={1} style={{ fontWeight: "600" }}>
          {meeting.meetingName || "Untitled meeting"}
        </Text>
        <Text variant="caption" tone="mute" numberOfLines={1}>
          {meeting.summary || statusLabel(meeting.status)}
        </Text>
      </View>
      {metaRight}
      <Icon name="ChevronRight" size={16} color={theme.color.inkFaint} />
    </Pressable>
  );
}

function Separator() {
  const { theme } = useTheme();
  return <View style={{ height: 1, backgroundColor: theme.color.line }} />;
}

export function DashboardScreen() {
  const { theme } = useTheme();
  const nav = useNavigation<NavigationProp<AppTabsParamList>>();
  const user = useAuthStore((s) => s.user);
  const [range, setRange] = useState<InsightRange>("30d");
  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ["meetings", "dashboard-src"],
    queryFn: () => listMeetings({ pageSize: 100 }),
  });
  const items = data?.items ?? [];
  const stats = useMemo(
    () => deriveStats(items, data?.total ?? items.length),
    [items, data?.total],
  );
  const negative = useMemo(
    () => items.filter(isNegativeMeeting).sort(byMostNegative),
    [items],
  );
  const live = items.filter((m) => isMeetingInProgress(m.status)).slice(0, 5);
  const chartW = Dimensions.get("window").width - 48 - 40;
  // Live cards: full width alone; slightly narrower in the carousel so the
  // next card peeks in and invites a swipe.
  const fullCardW = Dimensions.get("window").width - theme.spacing.lg * 2;
  const liveCardW = fullCardW - 36;

  function openMeeting(sessionId: string, title?: string) {
    // initial: false keeps MeetingsList beneath the detail screen, so the
    // header back button and back gestures (swipe on iOS, system back on
    // Android) return to the list instead of exiting the stack.
    nav.navigate("Meetings", {
      screen: "MeetingDetail",
      params: { sessionId, title },
      initial: false,
    } as never);
  }

  const initials = user
    ? `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase()
    : "";

  return (
    <Screen
      scroll
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={refetch}
          tintColor={theme.color.accent}
          colors={[theme.color.accent]}
        />
      }
    >
      {/* Header: greeting + date + identity + refresh */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Text variant="title">
            {greetingFor()}
            {user ? `, ${user.firstName}` : ""}
          </Text>
          <Text variant="caption" tone="mute" style={{ marginTop: 2 }}>
            {todayLabel()}
          </Text>
        </View>
        {initials ? (
          <Pressable
            onPress={() => nav.navigate("Profile" as never)}
            accessibilityRole="button"
            accessibilityLabel="Open profile"
            style={({ pressed }) => ({
              width: 44,
              height: 44,
              borderRadius: 22,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: theme.color.accent + "22",
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Text variant="label" style={{ color: theme.color.accent }}>
              {initials}
            </Text>
          </Pressable>
        ) : null}
      </View>

      {/* Primary shortcuts */}
      <View
        style={{
          flexDirection: "row",
          gap: 10,
          marginTop: 16,
          marginBottom: 20,
        }}
      >
        <QuickAction
          icon="Mic"
          label="Record"
          primary
          onPress={() =>
            nav.navigate("Meetings", {
              screen: "RecordMeeting",
              initial: false,
            } as never)
          }
        />
        <QuickAction
          icon="Video"
          label="Join a meeting"
          onPress={() =>
            nav.navigate("Meetings", { screen: "MeetingsList" } as never)
          }
        />
      </View>

      {isLoading ? (
        <View style={{ gap: 12 }}>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <Skeleton height={110} style={{ flex: 1 }} />
            <Skeleton height={110} style={{ flex: 1 }} />
          </View>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <Skeleton height={110} style={{ flex: 1 }} />
            <Skeleton height={110} style={{ flex: 1 }} />
          </View>
          <Skeleton height={180} />
          <Skeleton height={200} />
        </View>
      ) : isError ? (
        <ErrorRetry
          title="Couldn't load your workspace."
          description="Check your connection and try again."
          onRetry={refetch}
          retrying={isRefetching}
        />
      ) : (
        <View style={{ gap: 16 }}>
          {/* Live now — one card full-width; several become a swipeable
              carousel (the peek of the next card signals there's more). */}
          {live.length > 0 ? (
            <View>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  marginBottom: 10,
                }}
              >
                <PulsingDot color={theme.color.danger} size={7} />
                <Text variant="label" tone="mute">
                  LIVE NOW · {live.length}
                </Text>
                {live.length > 1 ? (
                  <Text
                    variant="caption"
                    tone="faint"
                    style={{ marginLeft: "auto" }}
                  >
                    Swipe →
                  </Text>
                ) : null}
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                snapToInterval={liveCardW + 10}
                decelerationRate="fast"
                scrollEnabled={live.length > 1}
                contentContainerStyle={{ gap: 10 }}
              >
                {live.map((m) => (
                  <Card
                    key={m.sessionId}
                    onPress={() => openMeeting(m.sessionId, m.meetingName)}
                    style={{ width: live.length > 1 ? liveCardW : fullCardW }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 10,
                      }}
                    >
                      <View style={{ flex: 1, gap: 6 }}>
                        <Text
                          variant="body"
                          numberOfLines={1}
                          style={{ fontWeight: "600" }}
                        >
                          {m.meetingName || "Untitled meeting"}
                        </Text>
                        <View
                          style={{
                            flexDirection: "row",
                            gap: 8,
                            alignItems: "center",
                          }}
                        >
                          <Badge
                            label={platformLabel(m.platform)}
                            tone={platformTone(m.platform)}
                          />
                          <Text
                            variant="caption"
                            style={{
                              color: theme.color.danger,
                              fontWeight: "600",
                            }}
                          >
                            {statusLabel(m.status)}
                          </Text>
                        </View>
                      </View>
                      <Equalizer
                        color={theme.color.accent}
                        barCount={5}
                        height={22}
                        barWidth={3}
                        gap={3}
                      />
                    </View>
                  </Card>
                ))}
              </ScrollView>
            </View>
          ) : null}

          {/* KPIs */}
          <View style={styles.grid}>
            <Kpi
              label="Total meetings"
              value={stats.total}
              accent={theme.color.success}
              spark={stats.spark}
              delta={
                stats.activityTrend === 0
                  ? "No change this week"
                  : `${stats.activityTrend > 0 ? "+" : ""}${stats.activityTrend} vs last week`
              }
              deltaTone={stats.activityTrend > 0 ? "up" : "mute"}
            />
            <Kpi
              label="Completed"
              value={stats.completed}
              accent={theme.color.accent}
              delta={`${stats.completionRate}% completion`}
              deltaTone="mute"
            />
            <Kpi
              label="In progress"
              value={stats.inProgress}
              accent={
                stats.inProgress > 0 ? theme.color.warning : theme.color.inkMute
              }
              delta={
                stats.inProgress > 0 ? "Recording or processing" : "All clear"
              }
              deltaTone={stats.inProgress > 0 ? "down" : "mute"}
            />
            <Kpi
              label="Action items"
              value={stats.actionItemsTotal}
              accent={theme.color.accentDeep}
              delta={`${stats.avgActionItems.toFixed(1)} per meeting`}
              deltaTone="mute"
            />
          </View>

          {/* Insights */}
          <View style={styles.rowBetween}>
            <Text variant="heading">Insights</Text>
            <View style={{ flexShrink: 0 }}>
              <RangeFilter value={range} onChange={setRange} />
            </View>
          </View>
          <ActionItemsCard range={range} />

          <Card>
            <SectionTitle title="Sentiment" icon="Trend" />
            <View style={{ alignItems: "center", marginTop: 4 }}>
              <SentimentRing
                positive={stats.dist.positive}
                neutral={stats.dist.neutral}
                negative={stats.dist.negative}
                size={130}
              />
            </View>
            {stats.sentimentTotal > 0 ? (
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "center",
                  gap: 18,
                  marginTop: 14,
                }}
              >
                {(
                  [
                    ["Positive", stats.dist.positive, theme.color.success],
                    ["Neutral", stats.dist.neutral, theme.color.inkMute],
                    ["Negative", stats.dist.negative, theme.color.danger],
                  ] as const
                ).map(([label, count, color]) => (
                  <View
                    key={label}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <View
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: color,
                      }}
                    />
                    <Text variant="caption" tone="mute">
                      {label} · {count}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}
          </Card>

          <Card>
            <SectionTitle title="Activity" icon="Calendar" />
            <Text variant="caption" tone="mute" style={{ marginBottom: 12 }}>
              {stats.spark.reduce((a, b) => a + b, 0)} meetings over the last 26
              weeks
            </Text>
            <Heatmap values={stats.spark} />
          </Card>

          {/* Needs attention */}
          {negative.length > 0 ? (
            <View>
              <SectionTitle
                title="Needs attention"
                icon="AlertCircle"
                count={negative.length}
              />
              <Card
                style={{
                  borderColor: theme.color.danger + "33",
                  paddingVertical: 6,
                }}
              >
                {negative.slice(0, 5).map((m, i) => (
                  <View key={m.sessionId}>
                    {i > 0 ? <Separator /> : null}
                    <MeetingLine
                      meeting={m}
                      onPress={() => openMeeting(m.sessionId, m.meetingName)}
                      left={
                        <View
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: sentimentHex(
                              m.sentimentSummary?.overall.label,
                            ),
                          }}
                        />
                      }
                      metaRight={
                        m.sentimentSummary ? (
                          <Text
                            variant="caption"
                            style={{
                              color: theme.color.danger,
                              fontVariant: ["tabular-nums"],
                            }}
                          >
                            {m.sentimentSummary.overall.score.toFixed(2)}
                          </Text>
                        ) : undefined
                      }
                    />
                  </View>
                ))}
              </Card>
            </View>
          ) : null}

          {/* Recent */}
          <View style={{ marginBottom: 8 }}>
            <SectionTitle
              title="Recent meetings"
              icon="Meetings"
              right={
                <Text
                  variant="caption"
                  tone="accent"
                  onPress={() =>
                    nav.navigate("Meetings", {
                      screen: "MeetingsList",
                    } as never)
                  }
                >
                  View all
                </Text>
              }
            />
            <Card style={{ paddingVertical: 6 }}>
              {items.length === 0 ? (
                <EmptyState
                  icon="Mic"
                  title="No meetings yet"
                  description="Record an in-person meeting or invite the bot to a call — summaries land here."
                />
              ) : (
                items.slice(0, 5).map((m, i) => (
                  <View key={m.sessionId}>
                    {i > 0 ? <Separator /> : null}
                    <MeetingLine
                      meeting={m}
                      onPress={() => openMeeting(m.sessionId, m.meetingName)}
                      left={
                        <Badge
                          label={platformLabel(m.platform)}
                          tone={platformTone(m.platform)}
                        />
                      }
                      metaRight={
                        <Text variant="caption" tone="faint">
                          {formatRelative(m.startedAt ?? m.createdAt)}
                        </Text>
                      }
                    />
                  </View>
                ))
              )}
            </Card>
          </View>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
  },
});
