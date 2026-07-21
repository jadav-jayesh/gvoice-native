import { useQuery } from "@tanstack/react-query";
import React from "react";
import { StyleSheet, View } from "react-native";
import { getMeetingStats } from "../core/api/endpoints";
import { useAuthStore } from "../core/store/authStore";
import { Card } from "../ui/Card";
import { Screen } from "../ui/Screen";
import { Text } from "../ui/Text";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card style={styles.stat}>
      <Text variant="title">{value}</Text>
      <Text variant="caption" tone="mute" style={{ marginTop: 2 }}>
        {label}
      </Text>
    </Card>
  );
}

export function DashboardScreen() {
  const user = useAuthStore((s) => s.user);
  const { data, isLoading, isError } = useQuery({ queryKey: ["meetingStats"], queryFn: getMeetingStats });

  return (
    <Screen scroll>
      <Text variant="title">Hi{user ? `, ${user.firstName}` : ""}</Text>
      <Text variant="body" tone="mute" style={{ marginBottom: 20 }}>
        Here's your meeting activity.
      </Text>

      {isLoading ? (
        <Text tone="mute">Loading…</Text>
      ) : isError ? (
        <Text tone="danger">Couldn't load stats.</Text>
      ) : data ? (
        <View style={styles.grid}>
          <Stat label="Meetings" value={String(data.total)} />
          <Stat label="Recorded" value={String(data.recorded)} />
          <Stat label="Action items" value={String(data.actionItems)} />
          <Stat label="Positive" value={data.positiveShare != null ? `${data.positiveShare}%` : "—"} />
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  stat: { flexGrow: 1, flexBasis: "45%", minWidth: 140 }
});
