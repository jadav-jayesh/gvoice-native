import { useQuery } from "@tanstack/react-query";
import { useNavigation, type NavigationProp } from "@react-navigation/native";
import React, { useMemo, useState } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import { listMeetings, type InsightRange } from "../core/api/endpoints";
import type { MeetingListItem } from "../core/api/types";
import { sentimentHex } from "../core/lib/colors";
import { byMostNegative, formatRelative, isMeetingInProgress, isNegativeMeeting, platformLabel, platformTone, statusLabel, statusTone } from "../core/lib/format";
import { useAuthStore } from "../core/store/authStore";
import { useTheme } from "../core/theme/ThemeProvider";
import { Badge } from "../ui/Badge";
import { Card } from "../ui/Card";
import { SentimentRing } from "../ui/charts/SentimentRing";
import { Sparkline } from "../ui/charts/Sparkline";
import { Heatmap } from "../ui/charts/Heatmap";
import { Icon } from "../ui/Icon";
import { Screen } from "../ui/Screen";
import { SectionTitle } from "../ui/Section";
import { Skeleton } from "../ui/Skeleton";
import { Text } from "../ui/Text";
import { ActionItemsCard } from "../features/insights/ActionItemsCard";
import { RangeFilter } from "../features/insights/RangeFilter";
import type { AppTabsParamList } from "../navigation/types";

function greetingFor(): string {
  const h = new Date().getHours();
  return h < 5 ? "Good night" : h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
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
  const completionRate = items.length ? Math.round((completed / items.length) * 100) : 0;

  return { completed, inProgress, actionItemsTotal, avgActionItems, spark, activityTrend: last7 - prev7, dist, sentimentTotal, completionRate, total };
}

function Kpi({ label, value, delta, deltaTone, accent, spark }: { label: string; value: number; delta: string; deltaTone?: "up" | "down" | "mute"; accent: string; spark?: number[] }) {
  const { theme } = useTheme();
  const deltaColor = deltaTone === "up" ? theme.color.success : deltaTone === "down" ? theme.color.warning : theme.color.inkMute;
  return (
    <Card style={{ flexGrow: 1, flexBasis: "46%" }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 }}>
        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: accent }} />
        <Text variant="caption" tone="mute">
          {label.toUpperCase()}
        </Text>
      </View>
      <Text style={{ fontSize: 28, fontWeight: "700", color: theme.color.ink }}>{value}</Text>
      {spark && spark.some((v) => v > 0) ? (
        <View style={{ marginTop: 4 }}>
          <Sparkline values={spark} width={130} height={30} stroke={accent} fillId={`k-${label.replace(/\s/g, "")}`} />
        </View>
      ) : null}
      <Text variant="caption" style={{ color: deltaColor, marginTop: 4 }}>
        {delta}
      </Text>
    </Card>
  );
}

export function DashboardScreen() {
  const { theme } = useTheme();
  const nav = useNavigation<NavigationProp<AppTabsParamList>>();
  const user = useAuthStore((s) => s.user);
  const [range, setRange] = useState<InsightRange>("30d");
  const { data, isLoading } = useQuery({ queryKey: ["meetings", "dashboard-src"], queryFn: () => listMeetings({ pageSize: 100 }) });
  const items = data?.items ?? [];
  const stats = useMemo(() => deriveStats(items, data?.total ?? items.length), [items, data?.total]);
  const negative = useMemo(() => items.filter(isNegativeMeeting).sort(byMostNegative), [items]);
  const live = items.filter((m) => isMeetingInProgress(m.status)).slice(0, 3);
  const chartW = Dimensions.get("window").width - 48 - 40;

  function openMeeting(sessionId: string, title?: string) {
    nav.navigate("Meetings", { screen: "MeetingDetail", params: { sessionId, title } } as never);
  }

  return (
    <Screen scroll>
      <Text variant="title">{greetingFor()}{user ? `, ${user.firstName}` : ""}</Text>
      <Text variant="body" tone="mute" style={{ marginBottom: 20 }}>
        Here's your workspace.
      </Text>

      {isLoading ? (
        <View style={{ gap: 12 }}>
          <Skeleton height={90} />
          <Skeleton height={200} />
        </View>
      ) : (
        <View style={{ gap: 16 }}>
          {/* Live now */}
          {live.length > 0 ? (
            <View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 }}>
                <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: theme.color.danger }} />
                <Text variant="label" tone="mute">
                  LIVE NOW · {live.length}
                </Text>
              </View>
              <View style={{ gap: 10 }}>
                {live.map((m) => (
                  <Card key={m.sessionId} onPress={() => openMeeting(m.sessionId, m.meetingName)}>
                    <View style={{ flexDirection: "row", gap: 8, marginBottom: 6 }}>
                      <Badge label={platformLabel(m.platform)} tone={platformTone(m.platform)} />
                      <Badge label={statusLabel(m.status)} tone={statusTone(m.status)} />
                    </View>
                    <Text variant="body" tone="soft" numberOfLines={2}>
                      {m.summary || "No summary yet"}
                    </Text>
                  </Card>
                ))}
              </View>
            </View>
          ) : null}

          {/* KPIs */}
          <View style={styles.grid}>
            <Kpi label="Total meetings" value={stats.total} accent={theme.color.success} spark={stats.spark} delta={stats.activityTrend === 0 ? "No change this week" : `${stats.activityTrend > 0 ? "+" : ""}${stats.activityTrend} vs last week`} deltaTone={stats.activityTrend > 0 ? "up" : "mute"} />
            <Kpi label="Completed" value={stats.completed} accent={theme.color.accent} delta={`${stats.completionRate}% completion`} deltaTone="mute" />
            <Kpi label="In progress" value={stats.inProgress} accent={stats.inProgress > 0 ? theme.color.warning : theme.color.inkMute} delta={stats.inProgress > 0 ? "Recording or processing" : "All clear"} deltaTone={stats.inProgress > 0 ? "down" : "mute"} />
            <Kpi label="Action items" value={stats.actionItemsTotal} accent={theme.color.accentDeep} delta={`${stats.avgActionItems.toFixed(1)} per meeting`} deltaTone="mute" />
          </View>

          {/* Insights row */}
          <View style={styles.rowBetween}>
            <Text variant="heading">Insights</Text>
            <View style={{ width: 200 }}>
              <RangeFilter value={range} onChange={setRange} />
            </View>
          </View>
          <ActionItemsCard range={range} />
          <Card style={{ alignItems: "center" }}>
            <SectionTitle title="Sentiment" icon="Trend" />
            <SentimentRing positive={stats.dist.positive} neutral={stats.dist.neutral} negative={stats.dist.negative} size={130} />
          </Card>
          <Card>
            <SectionTitle title="Activity" icon="Calendar" />
            <Text variant="caption" tone="mute" style={{ marginBottom: 12 }}>
              {stats.spark.reduce((a, b) => a + b, 0)} meetings over the last 26 weeks
            </Text>
            <Heatmap values={stats.spark} />
          </Card>

          {/* Needs attention */}
          {negative.length > 0 ? (
            <View>
              <SectionTitle title="Needs attention" icon="AlertCircle" count={negative.length} />
              <Card style={{ borderColor: theme.color.danger + "33" }}>
                <View style={{ gap: 12 }}>
                  {negative.slice(0, 5).map((m) => (
                    <Card key={m.sessionId} onPress={() => openMeeting(m.sessionId, m.meetingName)} style={{ padding: 0, borderWidth: 0 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: sentimentHex(m.sentimentSummary?.overall.label) }} />
                        <Text variant="body" numberOfLines={1} style={{ flex: 1 }}>
                          {m.meetingName || m.summary || "Untitled meeting"}
                        </Text>
                        {m.sentimentSummary ? (
                          <Text variant="caption" style={{ color: theme.color.danger }}>
                            {m.sentimentSummary.overall.score.toFixed(2)}
                          </Text>
                        ) : null}
                      </View>
                    </Card>
                  ))}
                </View>
              </Card>
            </View>
          ) : null}

          {/* Recent */}
          <View style={{ marginBottom: 8 }}>
            <SectionTitle title="Recent meetings" icon="Meetings" right={<Text variant="caption" tone="accent" onPress={() => nav.navigate("Meetings")}>View all</Text>} />
            <Card>
              {items.length === 0 ? (
                <Text tone="mute" style={{ textAlign: "center", paddingVertical: 16 }}>
                  No meetings yet.
                </Text>
              ) : (
                <View style={{ gap: 4 }}>
                  {items.slice(0, 5).map((m, i) => (
                    <Card key={m.sessionId} onPress={() => openMeeting(m.sessionId, m.meetingName)} style={{ padding: 10, borderWidth: 0 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        <Badge label={platformLabel(m.platform)} tone={platformTone(m.platform)} />
                        <Text variant="body" numberOfLines={1} style={{ flex: 1 }}>
                          {m.summary || "No summary"}
                        </Text>
                        <Text variant="caption" tone="faint">
                          {formatRelative(m.startedAt ?? m.createdAt)}
                        </Text>
                      </View>
                    </Card>
                  ))}
                </View>
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
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }
});
