import { FlashList } from "@shopify/flash-list";
import { useQuery } from "@tanstack/react-query";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useEffect, useMemo, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { getMeetingStats, listMeetings } from "../core/api/endpoints";
import type { BotPlatform, MeetingListItem } from "../core/api/types";
import {
  formatRelative,
  isMeetingInProgress,
  isNegativeMeeting,
  platformLabel,
  platformTone,
  statusLabel,
  statusTone,
} from "../core/lib/format";
import { Equalizer, PulsingDot } from "../features/meetings/LiveCaptureCard";
import { useTheme } from "../core/theme/ThemeProvider";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { EmptyState } from "../ui/EmptyState";
import { ErrorRetry } from "../ui/ErrorRetry";
import { Icon, type IconName } from "../ui/Icon";
import { Screen } from "../ui/Screen";
import { Segmented } from "../ui/Segmented";
import { Skeleton } from "../ui/Skeleton";
import { Text } from "../ui/Text";
import { JoinMeetingSheet } from "../features/meetings/JoinMeetingSheet";
import type { MeetingsStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<MeetingsStackParamList, "MeetingsList">;

const MeetingRow = React.memo(function MeetingRow({
  item,
  onPress,
}: {
  item: MeetingListItem;
  onPress: () => void;
}) {
  const { theme } = useTheme();
  const critical = isNegativeMeeting(item);
  const live = isMeetingInProgress(item.status);
  return (
    <Card
      style={{
        marginBottom: 12,
        borderLeftWidth: critical ? 3 : 1,
        borderLeftColor: critical ? theme.color.danger : theme.color.line,
      }}
      onPress={onPress}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <Text variant="heading" numberOfLines={1} style={{ flex: 1 }}>
          {item.meetingName || "Untitled meeting"}
        </Text>
        {live ? (
          <Equalizer
            color={theme.color.accent}
            barCount={5}
            height={18}
            barWidth={3}
            gap={3}
          />
        ) : null}
      </View>
      <View style={styles.metaRow}>
        <Badge
          label={platformLabel(item.platform)}
          tone={platformTone(item.platform)}
        />
        {live ? (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 999,
              backgroundColor: "rgba(239,68,68,0.12)",
            }}
          >
            <PulsingDot color={theme.color.danger} size={7} />
            <Text
              variant="caption"
              style={{ color: theme.color.danger, fontWeight: "600" }}
            >
              {statusLabel(item.status)}
            </Text>
          </View>
        ) : (
          <Badge
            label={statusLabel(item.status)}
            tone={statusTone(item.status)}
          />
        )}
        <Text variant="caption" tone="faint">
          {formatRelative(item.startedAt ?? item.createdAt)}
        </Text>
      </View>
      {item.summary ? (
        <Text
          variant="body"
          tone="soft"
          numberOfLines={2}
          style={{ marginTop: 8 }}
        >
          {item.summary}
        </Text>
      ) : null}
      <View
        style={{ flexDirection: "row", alignItems: "center", marginTop: 10 }}
      >
        {item.actionItems.length > 0 ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
            <Icon name="Check" size={13} color={theme.color.inkMute} />
            <Text variant="caption" tone="mute">
              {item.actionItems.length} action item
              {item.actionItems.length === 1 ? "" : "s"}
            </Text>
          </View>
        ) : (
          <View />
        )}
        <View
          style={{
            marginLeft: "auto",
            flexDirection: "row",
            alignItems: "center",
            gap: 2,
          }}
        >
          <Text variant="caption" tone="accent">
            Open
          </Text>
          <Icon name="ChevronRight" size={13} color={theme.color.accent} />
        </View>
      </View>
    </Card>
  );
});

// Compact stat chip — a single horizontal strip replaces the old 2×2 card grid
// so the meeting list starts above the fold.
function StatChip({
  icon,
  label,
  value,
}: {
  icon: IconName;
  label: string;
  value: string;
}) {
  const { theme } = useTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: theme.radii.md,
        borderWidth: 1,
        borderColor: theme.color.line,
        backgroundColor: theme.color.surface,
      }}
    >
      <View
        style={{
          width: 26,
          height: 26,
          borderRadius: theme.radii.sm,
          backgroundColor: theme.color.surfaceHi,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon name={icon} size={14} color={theme.color.accent} />
      </View>
      <Text
        style={{
          fontSize: 16,
          fontWeight: "700",
          color: theme.color.ink,
          fontVariant: ["tabular-nums"],
        }}
      >
        {value}
      </Text>
      <Text variant="caption" tone="mute">
        {label}
      </Text>
    </View>
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
    queryFn: () =>
      listMeetings({
        page: 1,
        pageSize: 20,
        platform: platform || undefined,
        search: search || undefined,
      }),
  });
  const { data: stats } = useQuery({
    queryKey: ["meetingStats"],
    queryFn: getMeetingStats,
  });

  const items = data?.items ?? [];
  const input = {
    height: 46,
    borderWidth: 1,
    borderColor: theme.color.line,
    borderRadius: theme.radii.md,
    paddingHorizontal: 40,
    color: theme.color.ink,
    backgroundColor: theme.color.surface,
    fontSize: theme.fontSize.md,
  };

  const header = useMemo(
    () => (
      <View style={{ paddingTop: theme.spacing.lg }}>
        <View style={styles.headRow}>
          <Text variant="title">Meetings</Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Button
              title="Record"
              variant="secondary"
              onPress={() => navigation.navigate("RecordMeeting")}
              style={{ height: 44 }}
            />
            <Button
              title="Join"
              onPress={() => setJoinOpen(true)}
              style={{ height: 44 }}
            />
          </View>
        </View>

        {/* Compact stat strip — one row, scrolls if it overflows */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginTop: 14 }}
          contentContainerStyle={{ gap: 8 }}
        >
          <StatChip
            icon="Meetings"
            label="total"
            value={String(stats?.total ?? data?.total ?? items.length)}
          />
          <StatChip
            icon="Video"
            label="recorded"
            value={String(stats?.recorded ?? 0)}
          />
          <StatChip
            icon="Trend"
            label="positive"
            value={
              stats?.positiveShare != null ? `${stats.positiveShare}%` : "—"
            }
          />
          <StatChip
            icon="Check"
            label="actions"
            value={String(stats?.actionItems ?? 0)}
          />
        </ScrollView>

        <View style={{ marginTop: 14 }}>
          <View style={{ position: "absolute", left: 12, top: 14, zIndex: 1 }}>
            <Icon name="Search" size={18} color={theme.color.inkFaint} />
          </View>
          <TextInput
            value={searchInput}
            onChangeText={setSearchInput}
            placeholder="Search meetings…"
            placeholderTextColor={theme.color.inkFaint}
            autoCapitalize="none"
            style={input}
          />
          {searchInput.length > 0 ? (
            <Pressable
              onPress={() => setSearchInput("")}
              accessibilityRole="button"
              accessibilityLabel="Clear search"
              style={({ pressed }) => ({
                position: "absolute",
                right: 4,
                top: 1,
                width: 44,
                height: 44,
                alignItems: "center",
                justifyContent: "center",
                opacity: pressed ? 0.6 : 1,
              })}
            >
              <Icon name="Close" size={16} color={theme.color.inkMute} />
            </Pressable>
          ) : null}
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
              { value: "in_person", label: "In-person" },
            ]}
          />
        </View>
      </View>
    ),
    [
      stats,
      data?.total,
      items.length,
      searchInput,
      platform,
      theme,
      navigation,
    ],
  );

  return (
    <Screen padded={false}>
      {isError ? (
        <ErrorRetry
          title="Couldn't load meetings."
          description="Check your connection and try again."
          onRetry={refetch}
          retrying={isRefetching}
        />
      ) : (
        <FlashList
          data={items}
          keyExtractor={(m) => m.sessionId}
          contentContainerStyle={{
            paddingHorizontal: theme.spacing.lg,
            paddingBottom: 24,
          }}
          ListHeaderComponent={header}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={theme.color.accent}
            />
          }
          renderItem={({ item }) => (
            <MeetingRow
              item={item}
              onPress={() =>
                navigation.navigate("MeetingDetail", {
                  sessionId: item.sessionId,
                  title: item.meetingName,
                })
              }
            />
          )}
          ListEmptyComponent={
            isLoading ? (
              <View style={{ gap: 12 }}>
                {[0, 1, 2, 3, 4].map((i) => (
                  <Card key={i}>
                    <Skeleton width="70%" height={20} />
                    <View
                      style={{ flexDirection: "row", gap: 8, marginTop: 10 }}
                    >
                      <Skeleton width={84} height={24} radius={999} />
                      <Skeleton width={96} height={24} radius={999} />
                    </View>
                    <Skeleton
                      width="95%"
                      height={13}
                      style={{ marginTop: 12 }}
                    />
                    <Skeleton
                      width="60%"
                      height={13}
                      style={{ marginTop: 6 }}
                    />
                  </Card>
                ))}
              </View>
            ) : search || platform ? (
              <EmptyState
                icon="Search"
                title="No meetings match"
                description="Try a different search or filter."
              />
            ) : (
              <EmptyState
                icon="Meetings"
                title="No meetings yet"
                description="Record an in-person meeting or invite the bot to a call — everything lands here."
                action={
                  <Button
                    title="Record a meeting"
                    onPress={() => navigation.navigate("RecordMeeting")}
                  />
                }
              />
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
  headRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
    flexWrap: "wrap",
  },
});
