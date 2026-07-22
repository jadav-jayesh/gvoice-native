import { useQuery } from "@tanstack/react-query";
import React from "react";
import { View } from "react-native";
import { getParticipation, type InsightRange } from "../../core/api/endpoints";
import { Avatar } from "../../ui/Avatar";
import { Card } from "../../ui/Card";
import { ProgressBar } from "../../ui/ProgressBar";
import { ErrorRetry } from "../../ui/ErrorRetry";
import { Skeleton } from "../../ui/Skeleton";
import { Text } from "../../ui/Text";

// Local duration formatter (web ParticipationCard uses its own, distinct from
// lib/format): <60 -> Ns, <3600 -> Nm, else Hh Mm.
function fmt(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

export function ParticipationCard({ range }: { range: InsightRange }) {
  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ["insights", "participation", range],
    queryFn: () => getParticipation(range)
  });

  return (
    <Card>
      <Text variant="heading">Talk share</Text>
      <Text variant="caption" tone="mute" style={{ marginBottom: 14 }}>
        Share of speaking time by participant
      </Text>
      {isLoading ? (
        <View style={{ gap: 10 }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} height={28} />
          ))}
        </View>
      ) : isError ? (
        <ErrorRetry compact title="Couldn't load talk share." onRetry={refetch} retrying={isRefetching} />
      ) : !data || data.speakers.length === 0 ? (
        <Text tone="mute" style={{ fontStyle: "italic" }}>
          No speaker timing data yet.
        </Text>
      ) : (
        <View style={{ gap: 12 }}>
          {data.speakers.map((s, i) => (
            <View key={i} style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
              <Avatar name={s.name} size={26} />
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                  <Text variant="label" numberOfLines={1} style={{ flex: 1 }}>
                    {s.name}
                  </Text>
                  <Text variant="caption" tone="mute">
                    {Math.round(s.share * 100)}% · {fmt(s.talkSeconds)}
                  </Text>
                </View>
                <ProgressBar value={Math.max(0.02, s.share)} height={6} />
              </View>
            </View>
          ))}
        </View>
      )}
    </Card>
  );
}
