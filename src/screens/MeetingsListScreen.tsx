import { FlashList } from "@shopify/flash-list";
import { useQuery } from "@tanstack/react-query";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import React from "react";
import { RefreshControl, StyleSheet, View } from "react-native";
import { listMeetings } from "../core/api/endpoints";
import type { MeetingListItem } from "../core/api/types";
import { formatRelative, platformLabel, platformTone, statusLabel, statusTone } from "../core/lib/format";
import { useTheme } from "../core/theme/ThemeProvider";
import { Badge } from "../ui/Badge";
import { Card } from "../ui/Card";
import { Screen } from "../ui/Screen";
import { Text } from "../ui/Text";
import type { MeetingsStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<MeetingsStackParamList, "MeetingsList">;

function MeetingRow({ item, onPress }: { item: MeetingListItem; onPress: () => void }) {
  return (
    <Card style={{ marginBottom: 12 }} onPress={onPress}>
      <Text variant="heading" numberOfLines={1}>
        {item.meetingName || "Untitled meeting"}
      </Text>
      <View style={styles.metaRow}>
        <Badge label={platformLabel(item.platform)} tone={platformTone(item.platform)} />
        <Badge label={statusLabel(item.status)} tone={statusTone(item.status)} />
        <Text variant="caption" tone="faint">
          {formatRelative(item.startedAt ?? item.createdAt)}
        </Text>
      </View>
      {item.summary ? (
        <Text variant="body" tone="soft" numberOfLines={2} style={{ marginTop: 8 }}>
          {item.summary}
        </Text>
      ) : null}
      {item.actionItems.length > 0 ? (
        <Text variant="caption" tone="mute" style={{ marginTop: 8 }}>
          {item.actionItems.length} action item{item.actionItems.length === 1 ? "" : "s"}
        </Text>
      ) : null}
    </Card>
  );
}

export function MeetingsListScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ["meetings", { page: 1, pageSize: 20 }],
    queryFn: () => listMeetings({ page: 1, pageSize: 20 })
  });

  return (
    <Screen padded={false}>
      {isLoading ? (
        <View style={styles.center}>
          <Text tone="mute">Loading meetings…</Text>
        </View>
      ) : isError ? (
        <View style={styles.center}>
          <Text tone="danger">Couldn't load meetings.</Text>
        </View>
      ) : (
        <FlashList
          data={data?.items ?? []}
          keyExtractor={(m) => m.sessionId}
          contentContainerStyle={{ padding: theme.spacing.lg }}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={theme.color.accent} />
          }
          renderItem={({ item }) => (
            <MeetingRow
              item={item}
              onPress={() =>
                navigation.navigate("MeetingDetail", {
                  sessionId: item.sessionId,
                  title: item.meetingName
                })
              }
            />
          )}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text tone="mute">No meetings yet.</Text>
            </View>
          }
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  metaRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8, flexWrap: "wrap" },
  center: { padding: 40, alignItems: "center" }
});
