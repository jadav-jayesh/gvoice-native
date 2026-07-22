import { FlashList } from "@shopify/flash-list";
import { useQuery } from "@tanstack/react-query";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useEffect, useMemo, useState } from "react";
import { RefreshControl, StyleSheet, TextInput, View } from "react-native";
import { getMeetingStats, listMeetings } from "../core/api/endpoints";
import type { BotPlatform, MeetingListItem } from "../core/api/types";
import { formatRelative, isNegativeMeeting, platformLabel, platformTone, statusLabel, statusTone } from "../core/lib/format";
import { useTheme } from "../core/theme/ThemeProvider";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { EmptyState } from "../ui/EmptyState";
import { Icon } from "../ui/Icon";
import { Screen } from "../ui/Screen";
import { Segmented } from "../ui/Segmented";
import { Skeleton } from "../ui/Skeleton";
import { Text } from "../ui/Text";
import { JoinMeetingSheet } from "../features/meetings/JoinMeetingSheet";
import type { MeetingsStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<MeetingsStackParamList, "MeetingsList">;

const MeetingRow = React.memo(function MeetingRow({ item, onPress }: { item: MeetingListItem; onPress: () => void }) {
  const { theme } = useTheme();
  const critical = isNegativeMeeting(item);
  return (
    <Card style={{ marginBottom: 12, borderLeftWidth: critical ? 3 : 1, borderLeftColor: critical ? theme.color.danger : theme.color.line }} onPress={onPress}>
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
});

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <Card style={{ flexGrow: 1, flexBasis: "46%", paddingVertical: 12 }}>
      <Text style={{ fontSize: 20, fontWeight: "700" }}>{value}</Text>
      <Text variant="caption" tone="mute">
        {label}
      </Text>
    </Card>
  );
}

export function MeetingsListScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [platform, setPlatform] = useState<BotPlatform | "">("");
  const [joinOpen, setJoinOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 250);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ["meetings", { page: 1, platform, search }],
    queryFn: () => listMeetings({ page: 1, pageSize: 20, platform: platform || undefined, search: search || undefined })
  });
  const { data: stats } = useQuery({ queryKey: ["meetingStats"], queryFn: getMeetingStats });

  const items = data?.items ?? [];
  const input = {
    height: 46,
    borderWidth: 1,
    borderColor: theme.color.line,
    borderRadius: theme.radii.md,
    paddingHorizontal: 40,
    color: theme.color.ink,
    backgroundColor: theme.color.surface,
    fontSize: theme.fontSize.md
  };

  const header = useMemo(
    () => (
      <View style={{ paddingTop: theme.spacing.lg }}>
        <View style={styles.headRow}>
          <Text variant="title">Meetings</Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Button title="Record" variant="secondary" onPress={() => navigation.navigate("RecordMeeting")} style={{ height: 40 }} />
            <Button title="Join" onPress={() => setJoinOpen(true)} style={{ height: 40 }} />
          </View>
        </View>

        <View style={[styles.grid, { marginTop: 14 }]}>
          <StatPill label="Total" value={String(stats?.total ?? data?.total ?? items.length)} />
          <StatPill label="Recorded" value={String(stats?.recorded ?? 0)} />
          <StatPill label="Positive" value={stats?.positiveShare != null ? `${stats.positiveShare}%` : "—"} />
          <StatPill label="Action items" value={String(stats?.actionItems ?? 0)} />
        </View>

        <View style={{ marginTop: 14 }}>
          <View style={{ position: "absolute", left: 12, top: 14, zIndex: 1 }}>
            <Icon name="Search" size={18} color={theme.color.inkFaint} />
          </View>
          <TextInput value={searchInput} onChangeText={setSearchInput} placeholder="Search meetings…" placeholderTextColor={theme.color.inkFaint} autoCapitalize="none" style={input} />
        </View>

        <View style={{ marginTop: 12, marginBottom: 6 }}>
          <Segmented<BotPlatform | "">
            value={platform}
            onChange={setPlatform}
            options={[
              { value: "", label: "All" },
              { value: "google_meet", label: "Meet" },
              { value: "microsoft_teams", label: "Teams" },
              { value: "zoom", label: "Zoom" },
              { value: "in_person", label: "In-person" }
            ]}
          />
        </View>
      </View>
    ),
    [stats, data?.total, items.length, searchInput, platform, theme, navigation]
  );

  return (
    <Screen padded={false}>
      {isError ? (
        <View style={{ padding: 40, alignItems: "center" }}>
          <Text tone="danger">Couldn't load meetings.</Text>
        </View>
      ) : (
        <FlashList
          data={items}
          keyExtractor={(m) => m.sessionId}
          contentContainerStyle={{ paddingHorizontal: theme.spacing.lg, paddingBottom: 24 }}
          ListHeaderComponent={header}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={theme.color.accent} />}
          renderItem={({ item }) => (
            <MeetingRow item={item} onPress={() => navigation.navigate("MeetingDetail", { sessionId: item.sessionId, title: item.meetingName })} />
          )}
          ListEmptyComponent={
            isLoading ? (
              <View style={{ gap: 12 }}>
                {[0, 1, 2, 3, 4].map((i) => (
                  <Card key={i}>
                    <Skeleton width="70%" height={20} />
                    <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
                      <Skeleton width={84} height={24} radius={999} />
                      <Skeleton width={96} height={24} radius={999} />
                    </View>
                    <Skeleton width="95%" height={13} style={{ marginTop: 12 }} />
                    <Skeleton width="60%" height={13} style={{ marginTop: 6 }} />
                  </Card>
                ))}
              </View>
            ) : (
              <EmptyState icon="Meetings" title="No meetings match" description="Try a different search or filter." />
            )
          }
        />
      )}

      <JoinMeetingSheet
        visible={joinOpen}
        onClose={() => setJoinOpen(false)}
        onCreated={(sessionId) => {
          setJoinOpen(false);
          refetch();
          navigation.navigate("MeetingDetail", { sessionId });
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  headRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8, flexWrap: "wrap" }
});
