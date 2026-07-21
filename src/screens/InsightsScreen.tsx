import { useQuery } from "@tanstack/react-query";
import React from "react";
import { getActionItemInsights } from "../core/api/endpoints";
import { Card } from "../ui/Card";
import { Screen } from "../ui/Screen";
import { Text } from "../ui/Text";

// M0 stub — proves the insights endpoint end-to-end. Full participation / topics
// charts land in milestone M6.
export function InsightsScreen() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["insights", "action-items", "30d"],
    queryFn: () => getActionItemInsights("30d")
  });

  return (
    <Screen scroll>
      <Text variant="title" style={{ marginBottom: 16 }}>
        Insights
      </Text>
      {isLoading ? (
        <Text tone="mute">Loading…</Text>
      ) : isError ? (
        <Text tone="danger">Couldn't load insights.</Text>
      ) : data ? (
        <Card>
          <Text variant="label" tone="mute" style={{ marginBottom: 10 }}>
            ACTION ITEMS · LAST 30 DAYS
          </Text>
          <Text variant="body">Total: {data.total}</Text>
          <Text variant="body">Open: {data.open}</Text>
          <Text variant="body">Done: {data.done}</Text>
          <Text variant="body">Completion: {Math.round(data.completionRate * 100)}%</Text>
          <Text variant="body" tone={data.overdueCount > 0 ? "danger" : "mute"} style={{ marginTop: 6 }}>
            Overdue: {data.overdueCount}
          </Text>
        </Card>
      ) : null}
    </Screen>
  );
}
