import { useQuery } from "@tanstack/react-query";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import React from "react";
import { StyleSheet, View } from "react-native";
import { getMeeting } from "../core/api/endpoints";
import { formatRelative, isMeetingInProgress, platformLabel, platformTone, statusLabel, statusTone } from "../core/lib/format";
import { Badge } from "../ui/Badge";
import { Card } from "../ui/Card";
import { Screen } from "../ui/Screen";
import { Text } from "../ui/Text";
import type { MeetingsStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<MeetingsStackParamList, "MeetingDetail">;

// M0 shows the core meeting fields. Transcript / MoM / sentiment / recording get
// their own sections in later milestones (M3–M4). While the pipeline is still
// running, poll every 5s so the status + summary fill in live.
export function MeetingDetailScreen({ route }: Props) {
  const { sessionId } = route.params;
  const { data: meeting, isLoading, isError } = useQuery({
    queryKey: ["meeting", sessionId],
    queryFn: () => getMeeting(sessionId),
    refetchInterval: (query) => (query.state.data && isMeetingInProgress(query.state.data.status) ? 5000 : false)
  });

  if (isLoading) {
    return (
      <Screen>
        <Text tone="mute">Loading…</Text>
      </Screen>
    );
  }
  if (isError || !meeting) {
    return (
      <Screen>
        <Text tone="danger">Couldn't load this meeting.</Text>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <Text variant="title">{meeting.meetingName || "Untitled meeting"}</Text>
      <View style={styles.metaRow}>
        <Badge label={platformLabel(meeting.platform)} tone={platformTone(meeting.platform)} />
        <Badge label={statusLabel(meeting.status)} tone={statusTone(meeting.status)} />
        <Text variant="caption" tone="faint">
          {formatRelative(meeting.startedAt ?? meeting.createdAt)}
        </Text>
      </View>

      {meeting.summary ? (
        <Card style={{ marginTop: 16 }}>
          <Text variant="label" tone="mute" style={{ marginBottom: 6 }}>
            SUMMARY
          </Text>
          <Text variant="body" tone="soft">
            {meeting.summary}
          </Text>
        </Card>
      ) : null}

      {meeting.actionItems.length > 0 ? (
        <Card style={{ marginTop: 16 }}>
          <Text variant="label" tone="mute" style={{ marginBottom: 10 }}>
            ACTION ITEMS
          </Text>
          {meeting.actionItems.map((a, i) => (
            <View key={i} style={styles.actionRow}>
              <Text tone="accent">•</Text>
              <Text variant="body" style={{ flex: 1 }}>
                {a.task}
                {a.assignee ? ` — ${a.assignee}` : ""}
              </Text>
            </View>
          ))}
        </Card>
      ) : null}

      {meeting.participants.length > 0 ? (
        <Card style={{ marginTop: 16 }}>
          <Text variant="label" tone="mute" style={{ marginBottom: 6 }}>
            PARTICIPANTS
          </Text>
          <Text variant="body" tone="soft">
            {meeting.participants.map((p) => p.name).join(", ")}
          </Text>
        </Card>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  metaRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 10, flexWrap: "wrap" },
  actionRow: { flexDirection: "row", gap: 8, marginBottom: 8 }
});
