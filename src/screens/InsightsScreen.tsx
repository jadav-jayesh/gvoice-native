import { useQuery } from "@tanstack/react-query";
import React, { useMemo, useState } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import { listMeetings, type InsightRange } from "../core/api/endpoints";
import type { MeetingListItem } from "../core/api/types";
import { formatRelative } from "../core/lib/format";
import { useTheme } from "../core/theme/ThemeProvider";
import { Card } from "../ui/Card";
import { SentimentRing } from "../ui/charts/SentimentRing";
import { Sparkline } from "../ui/charts/Sparkline";
import { EmptyState } from "../ui/EmptyState";
import { Screen } from "../ui/Screen";
import { SectionTitle } from "../ui/Section";
import { ErrorRetry } from "../ui/ErrorRetry";
import { Skeleton } from "../ui/Skeleton";
import { Text } from "../ui/Text";
import { ActionItemsCard } from "../features/insights/ActionItemsCard";
import { ParticipationCard } from "../features/insights/ParticipationCard";
import { RangeFilter } from "../features/insights/RangeFilter";
import { TopicsCard } from "../features/insights/TopicsCard";
import { FadeSlideIn } from "../ui/motion";

function getWeek(date: Date): number {
  const jan1 = new Date(date.getFullYear(), 0, 1);
  const days = Math.floor((date.getTime() - jan1.getTime()) / 86400000);
  return Math.ceil((days + jan1.getDay() + 1) / 7);
}

function deriveInsights(items: MeetingListItem[]) {
  const dist = { positive: 0, neutral: 0, negative: 0 };
  const scores: { ts: number; score: number }[] = [];
  for (const m of items) {
    const o = m.sentimentSummary?.overall;
    if (!o) continue;
    dist[o.label] += 1;
    const ts = new Date(m.endedAt ?? m.startedAt ?? m.createdAt).getTime();
    scores.push({ ts, score: o.score });
  }
  const total = dist.positive + dist.neutral + dist.negative;
  const positiveShare = total ? Math.round((dist.positive / total) * 100) : 0;
  const avgScore = scores.length ? scores.reduce((a, s) => a + s.score, 0) / scores.length : 0;

  // Weekly average score, chronological, front-padded to >=4 points.
  const byWeek = new Map<number, { sum: number; n: number; ts: number }>();
  for (const s of scores) {
    const wk = getWeek(new Date(s.ts));
    const cur = byWeek.get(wk) ?? { sum: 0, n: 0, ts: s.ts };
    cur.sum += s.score;
    cur.n += 1;
    cur.ts = Math.min(cur.ts, s.ts);
    byWeek.set(wk, cur);
  }
  let trend = [...byWeek.values()].sort((a, b) => a.ts - b.ts).map((w) => w.sum / w.n);
  while (trend.length < 4) trend = [0, ...trend];

  const names = new Set<string>();
  const activeNames = new Set<string>();
  const cutoff = Date.now() - 14 * 86400000;
  let participantsSum = 0;
  for (const m of items) {
    const ts = new Date(m.endedAt ?? m.startedAt ?? m.createdAt).getTime();
    participantsSum += m.participants.length;
    for (const p of m.participants) {
      names.add(p.name);
      if (ts >= cutoff) activeNames.add(p.name);
    }
  }
  const recentMoments = items
    .filter((m) => m.summary?.trim())
    .slice(0, 4)
    .map((m) => ({
      sessionId: m.sessionId,
      quote: (m.summary.split(/[.!?]/)[0] ?? "").slice(0, 140) + "…",
      platform: m.platform,
      endedAt: m.endedAt
    }));

  return {
    dist,
    sentimentTotal: total,
    positiveShare,
    avgScore,
    sentimentTrend: trend,
    totalSpeakers: names.size,
    activeSpeakers: activeNames.size,
    avgParticipants: items.length ? participantsSum / items.length : 0,
    recentMoments
  };
}

function SummaryStat({ label, value, accent, caption, delay = 0 }: { label: string; value: string; accent: string; caption: string; delay?: number }) {
  return (
    <FadeSlideIn delay={delay} style={{ flexGrow: 1, flexBasis: "46%" }}>
      <Card>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 }}>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: accent }} />
          <Text variant="caption" tone="mute">
            {label.toUpperCase()}
          </Text>
        </View>
        <Text style={{ fontSize: 28, fontWeight: "700", color: accent, marginBottom: 2, fontVariant: ["tabular-nums"] }}>{value}</Text>
        <Text variant="caption" tone="faint">
          {caption}
        </Text>
      </Card>
    </FadeSlideIn>
  );
}

export function InsightsScreen() {
  const { theme } = useTheme();
  const [range, setRange] = useState<InsightRange>("30d");
  const { data: meetings, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ["meetings", "insights-src"],
    queryFn: () => listMeetings({ pageSize: 100 })
  });
  const items = meetings?.items ?? [];
  const ins = useMemo(() => deriveInsights(items), [items]);
  const chartW = Dimensions.get("window").width - 48 - 40;

  return (
    <Screen scroll>
      <Text variant="title">Insights</Text>
      <Text variant="body" tone="mute" style={{ marginBottom: 20 }}>
        Sentiment, participation and themes across your recent meetings.
      </Text>

      {isLoading ? (
        <View style={{ gap: 12 }}>
          <Skeleton height={120} />
          <Skeleton height={220} />
        </View>
      ) : isError ? (
        <ErrorRetry title="Couldn't load insights." description="Check your connection and try again." onRetry={refetch} retrying={isRefetching} />
      ) : items.length === 0 ? (
        <Card>
          <EmptyState icon="Sparkles" title="Not enough data yet" description="Insights appear once you have a few recorded meetings." />
        </Card>
      ) : (
        <View style={{ gap: 16 }}>
          {/* Summary metrics */}
          <View style={styles.grid}>
            <SummaryStat
              label="Avg sentiment"
              value={ins.avgScore.toFixed(2)}
              accent={ins.avgScore > 0.1 ? theme.color.success : ins.avgScore < -0.1 ? theme.color.danger : theme.color.inkMute}
              caption={ins.avgScore > 0.2 ? "Mostly positive" : ins.avgScore < -0.2 ? "Mostly negative" : "Mostly neutral"}
              delay={0}
            />
            <SummaryStat label="Positive share" value={`${ins.positiveShare}%`} accent={theme.color.success} caption={`${ins.dist.positive} of ${ins.sentimentTotal} meetings`} delay={40} />
            <SummaryStat label="Speakers tracked" value={String(ins.totalSpeakers)} accent={theme.color.ink} caption={`${ins.activeSpeakers} active recently`} delay={80} />
            <SummaryStat label="Avg participants" value={ins.avgParticipants.toFixed(1)} accent={theme.color.accent} caption="Per meeting" delay={120} />
          </View>

          {/* Sentiment ring + trend */}
          <Card style={{ alignItems: "center" }}>
            <SectionTitle title="Sentiment" icon="Trend" />
            <SentimentRing positive={ins.dist.positive} neutral={ins.dist.neutral} negative={ins.dist.negative} size={150} />
          </Card>
          <Card>
            <SectionTitle title="Sentiment trend" icon="Insights" />
            <Sparkline values={ins.sentimentTrend} width={chartW} height={120} fillId="trend" />
          </Card>

          {/* Participation & themes */}
          <View style={styles.rowBetween}>
            <Text variant="heading">Participation & themes</Text>
            <RangeFilterWrap value={range} onChange={setRange} />
          </View>
          <ActionItemsCard range={range} />
          <ParticipationCard range={range} />
          <TopicsCard range={range} />

          {/* Recent highlights */}
          <Card style={{ marginBottom: 8 }}>
            <SectionTitle title="Recent highlights" icon="Quote" />
            {ins.recentMoments.length === 0 ? (
              <Text tone="mute" style={{ fontStyle: "italic" }}>
                No moments captured yet.
              </Text>
            ) : (
              <View style={{ gap: 12 }}>
                {ins.recentMoments.map((m, i) => (
                  <View key={i} style={{ padding: 12, borderRadius: theme.radii.md, borderWidth: 1, borderColor: theme.color.line }}>
                    <Text variant="caption" tone="faint" style={{ marginBottom: 4 }}>
                      {formatRelative(m.endedAt)}
                    </Text>
                    <Text variant="body" tone="soft" style={{ fontStyle: "italic" }}>
                      “{m.quote}”
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </Card>
        </View>
      )}
    </Screen>
  );
}

function RangeFilterWrap({ value, onChange }: { value: InsightRange; onChange: (v: InsightRange) => void }) {
  return (
    <View style={{ width: 200 }}>
      <RangeFilter value={value} onChange={onChange} />
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }
});
