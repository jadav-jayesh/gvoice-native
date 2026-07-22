import { useQuery } from "@tanstack/react-query";
import React from "react";
import { StyleSheet, View } from "react-native";
import { getActionItemInsights, type InsightRange } from "../../core/api/endpoints";
import { useTheme } from "../../core/theme/ThemeProvider";
import { Card } from "../../ui/Card";
import { CompletionRing } from "../../ui/charts/CompletionRing";
import { Icon } from "../../ui/Icon";
import { ErrorRetry } from "../../ui/ErrorRetry";
import { Skeleton } from "../../ui/Skeleton";
import { Text } from "../../ui/Text";

// Ported from web dashboard/ActionItemsCard.
function Stat({ label, value, tone }: { label: string; value: number; tone?: "ink" | "positive" | "negative" | "mute" }) {
  const { theme } = useTheme();
  const color =
    tone === "positive" ? theme.color.success : tone === "negative" ? theme.color.danger : tone === "mute" ? theme.color.inkMute : theme.color.ink;
  return (
    <View style={{ flexBasis: "48%" }}>
      <Text style={{ fontSize: 22, fontWeight: "700", color }}>{value}</Text>
      <Text variant="caption" tone="mute">
        {label.toUpperCase()}
      </Text>
    </View>
  );
}

export function ActionItemsCard({ range }: { range: InsightRange }) {
  const { theme } = useTheme();
  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ["insights", "action-items", range],
    queryFn: () => getActionItemInsights(range)
  });

  return (
    <Card>
      <View style={styles.header}>
        <Text variant="heading">Action items</Text>
        {data && data.overdueCount > 0 ? (
          <View style={{ backgroundColor: theme.color.danger + "22", borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 }}>
            <Text variant="caption" style={{ color: theme.color.danger }}>
              {data.overdueCount} overdue
            </Text>
          </View>
        ) : null}
      </View>
      <Text variant="caption" tone="mute" style={{ marginBottom: 14 }}>
        Open work across recent meetings
      </Text>

      {isLoading ? (
        <Skeleton height={120} />
      ) : isError ? (
        <ErrorRetry compact title="Couldn't load action items." onRetry={refetch} retrying={isRefetching} />
      ) : !data || data.total === 0 ? (
        <Text tone="mute" style={{ paddingVertical: 16, textAlign: "center" }}>
          No action items captured yet.
        </Text>
      ) : (
        <>
          <View style={{ flexDirection: "row", gap: 18, alignItems: "center" }}>
            <CompletionRing rate={data.completionRate} />
            <View style={{ flex: 1, flexDirection: "row", flexWrap: "wrap", rowGap: 12 }}>
              <Stat label="Open" value={data.open} />
              <Stat label="Done" value={data.done} tone="positive" />
              <Stat label="Total" value={data.total} />
              <Stat label="Overdue" value={data.overdueCount} tone={data.overdueCount > 0 ? "negative" : "mute"} />
            </View>
          </View>

          {data.byOwner.length > 0 ? (
            <View style={styles.section}>
              <Text variant="caption" tone="mute" style={{ marginBottom: 8 }}>
                TOP OWNERS
              </Text>
              {data.byOwner.slice(0, 4).map((o, i) => (
                <View key={i} style={styles.ownerRow}>
                  <Text variant="body" numberOfLines={1} style={{ flex: 1 }}>
                    {o.owner}
                  </Text>
                  <Text variant="caption" tone="mute">
                    {o.open} open / {o.total}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}

          {data.overdue.length > 0 ? (
            <View style={styles.section}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 8 }}>
                <Icon name="AlertCircle" size={12} color={theme.color.danger} />
                <Text variant="caption" tone="mute">
                  OVERDUE
                </Text>
              </View>
              {data.overdue.slice(0, 3).map((o, i) => (
                <View key={i} style={styles.ownerRow}>
                  <Text variant="body" numberOfLines={1} style={{ flex: 1 }}>
                    {o.task}
                  </Text>
                  <Text variant="caption" style={{ color: theme.color.danger }}>
                    {o.due}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
        </>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  section: { marginTop: 16, paddingTop: 14, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "#8883" },
  ownerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 6 }
});
