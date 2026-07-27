import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useMemo, useState } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { deleteMeeting, getMeeting } from "../core/api/endpoints";
import type { Meeting } from "../core/api/types";
import { sentimentHex } from "../core/lib/colors";
import {
  formatDuration,
  formatRelative,
  isMeetingInProgress,
  platformLabel,
  platformTone,
  statusLabel,
  statusTone
} from "../core/lib/format";
import { useTheme } from "../core/theme/ThemeProvider";
import { Avatar } from "../ui/Avatar";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Icon, type IconName } from "../ui/Icon";
import { RichText } from "../ui/RichText";
import { ProgressBar } from "../ui/ProgressBar";
import { Screen } from "../ui/Screen";
import { SectionTitle } from "../ui/Section";
import { ConfirmModal } from "../ui/ConfirmModal";
import { ErrorRetry } from "../ui/ErrorRetry";
import { Skeleton } from "../ui/Skeleton";
import { Text } from "../ui/Text";
import { MomModal } from "../features/meetings/MomModal";
import { MomReportView } from "../features/meetings/MomReportView";
import { deriveMoments } from "../features/meetings/moments";
import { RecordingPlayer, RecordingUnavailable } from "../features/meetings/RecordingPlayer";
import { LiveCaptureCard } from "../features/meetings/LiveCaptureCard";
import { SentimentTimeline } from "../features/meetings/SentimentTimeline";
import { ShareSheet } from "../features/meetings/ShareSheet";
import { TranscriptList } from "../features/meetings/TranscriptList";
import type { MeetingsStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<MeetingsStackParamList, "MeetingDetail">;
type Tab = "summary" | "actions" | "moments" | "speakers" | "minutes";

const TABS: { key: Tab; label: string }[] = [
  { key: "summary", label: "Summary" },
  { key: "actions", label: "Actions" },
  { key: "moments", label: "Moments" },
  { key: "speakers", label: "Speakers" },
  { key: "minutes", label: "Minutes" }
];

function IconButton({ name, onPress, color, label }: { name: IconName; onPress: () => void; color?: string; label: string }) {
  const { theme } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => ({
        width: 44,
        height: 44,
        borderRadius: theme.radii.md,
        borderWidth: 1,
        borderColor: theme.color.line,
        backgroundColor: pressed ? theme.color.surfaceHi : theme.color.surface,
        alignItems: "center",
        justifyContent: "center",
        opacity: pressed ? 0.8 : 1
      })}
    >
      <Icon name={name} size={18} color={color ?? theme.color.inkMute} />
    </Pressable>
  );
}

// Primary action of the screen — filled accent pill so it clearly outranks the
// neutral icon buttons beside it.
function ActionPill({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  const { theme } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        height: 44,
        paddingHorizontal: 18,
        borderRadius: theme.radii.md,
        backgroundColor: theme.color.accent,
        opacity: pressed ? 0.85 : 1
      })}
    >
      <Icon name={icon} size={17} color="#fff" />
      <Text variant="label" style={{ color: "#fff" }}>
        {label}
      </Text>
    </Pressable>
  );
}

export function MeetingDetailScreen({ route, navigation }: Props) {
  const { sessionId } = route.params;
  const { theme } = useTheme();
  const qc = useQueryClient();

  const { data: meeting, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ["meeting", sessionId],
    queryFn: () => getMeeting(sessionId),
    refetchInterval: (q) => (q.state.data && isMeetingInProgress(q.state.data.status) ? 4000 : false)
  });

  const [tab, setTab] = useState<Tab>("summary");
  const [currentTime, setCurrentTime] = useState(0);
  const [seekTo, setSeekTo] = useState<number | undefined>(undefined);
  const [videoDuration, setVideoDuration] = useState(0);
  const [speakerFilter, setSpeakerFilter] = useState<string | undefined>(undefined);
  const [shareOpen, setShareOpen] = useState(false);
  const [done, setDone] = useState<Record<number, boolean>>({});
  const [deleting, setDeleting] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [momOpen, setMomOpen] = useState(false);

  const segments = meeting?.diarizedTranscript ?? [];
  const transcriptDuration = useMemo(
    () => (segments.length ? Math.max(...segments.map((s) => s.endTime)) : 0),
    [segments]
  );
  const effectiveDuration = videoDuration || transcriptDuration;
  const speakers = useMemo(() => [...new Set(segments.map((s) => s.speaker).filter(Boolean))], [segments]);
  const moments = useMemo(() => (meeting ? deriveMoments(meeting) : []), [meeting]);

  function seek(t: number) {
    setCurrentTime(t);
    setSeekTo(t);
  }

  async function confirmDelete() {
    setDeleting(true);
    try {
      await deleteMeeting(sessionId);
      qc.invalidateQueries({ queryKey: ["meetings"] });
      navigation.goBack();
    } catch {
      setDeleting(false);
    }
  }

  if (isLoading) {
    return (
      <Screen scroll>
        {/* Mirrors the loaded layout: badges → title → meta → actions → player → tabs → content */}
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Skeleton width={92} height={26} radius={999} />
          <Skeleton width={104} height={26} radius={999} />
        </View>
        <Skeleton width="85%" height={30} style={{ marginTop: 14 }} />
        <Skeleton width="45%" height={14} style={{ marginTop: 10 }} />
        <View style={{ flexDirection: "row", gap: 10, marginTop: 16 }}>
          <Skeleton height={48} style={{ flex: 1 }} />
          <Skeleton width={56} height={48} />
          <Skeleton width={56} height={48} />
        </View>
        <Skeleton height={220} style={{ marginTop: 16 }} />
        <View style={{ flexDirection: "row", gap: 8, marginTop: 16 }}>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} width={92} height={34} radius={999} />
          ))}
        </View>
        <Skeleton height={140} style={{ marginTop: 16 }} />
        <Skeleton height={200} style={{ marginTop: 12 }} />
      </Screen>
    );
  }
  if (isError || !meeting) {
    return (
      <Screen>
        <ErrorRetry title="Failed to load this meeting." description="It may have been deleted, or the connection dropped." onRetry={refetch} retrying={isRefetching} />
      </Screen>
    );
  }

  const overall = meeting.sentimentSummary?.overall;
  const inProgress = isMeetingInProgress(meeting.status);

  return (
    <Screen scroll>
      {/* Header */}
      <View style={styles.badgeRow}>
        <Badge label={platformLabel(meeting.platform)} tone={platformTone(meeting.platform)} />
        <Badge label={statusLabel(meeting.status)} tone={statusTone(meeting.status)} />
        {overall ? (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: theme.radii.pill,
              backgroundColor: sentimentHex(overall.label) + "22"
            }}
          >
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: sentimentHex(overall.label) }} />
            <Text variant="caption" style={{ color: sentimentHex(overall.label), fontWeight: "600" }}>
              {overall.label} · {overall.score.toFixed(2)}
            </Text>
          </View>
        ) : null}
      </View>
      <Text variant="title">{meeting.meetingName || "Untitled meeting"}</Text>
      <View style={styles.metaRow}>
        <View style={styles.metaChip}>
          <Icon name="Calendar" size={13} color={theme.color.inkMute} />
          <Text variant="caption" tone="mute">
            {formatRelative(meeting.endedAt ?? meeting.startedAt ?? meeting.createdAt)}
          </Text>
        </View>
        {effectiveDuration > 0 ? (
          <View style={styles.metaChip}>
            <Icon name="Clock" size={13} color={theme.color.inkMute} />
            <Text variant="caption" tone="mute">
              {formatDuration(effectiveDuration)}
            </Text>
          </View>
        ) : null}
        {meeting.participants.length > 0 ? (
          <View style={styles.metaChip}>
            <Icon name="Users" size={13} color={theme.color.inkMute} />
            <Text variant="caption" tone="mute">
              {meeting.participants.length} attendee{meeting.participants.length === 1 ? "" : "s"}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <ActionPill icon="Sparkles" label="View MoM" onPress={() => setMomOpen(true)} />
        <View style={{ flex: 1 }} />
        {meeting.recordingUrl ? (
          <IconButton name="Video" label="Open recording video" onPress={() => Linking.openURL(meeting.recordingUrl as string)} />
        ) : null}
        <IconButton name="Link" label="Share public link" onPress={() => setShareOpen(true)} />
        <IconButton name="Trash" label="Delete meeting" color={theme.color.danger} onPress={() => setConfirmDeleteOpen(true)} />
      </View>

      {/* Processing note — only when a player is already visible; without a
          recording the LiveCaptureCard below carries this information. */}
      {inProgress && meeting.recordingUrl ? (
        <Card style={{ marginTop: 16 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Icon name="Clock" size={16} color={theme.color.warning} />
            <Text variant="label">Processing — this page updates automatically.</Text>
          </View>
          {meeting.meetingLogs?.length ? (
            <Text variant="caption" tone="mute" style={{ marginTop: 6 }}>
              {meeting.meetingLogs[meeting.meetingLogs.length - 1].message}
            </Text>
          ) : null}
        </Card>
      ) : null}

      {/* Player + timeline. While the meeting is still being captured or
          processed there's no video yet — show the live status card (pulsing
          pill + equalizer + latest progress log) instead of a dead placeholder. */}
      <View style={{ marginTop: 16, gap: 8 }}>
        {meeting.recordingUrl ? (
          <RecordingPlayer
            uri={meeting.recordingUrl}
            poster={meeting.thumbnailUrl}
            seekTo={seekTo}
            onProgress={(t, d) => {
              setCurrentTime(t);
              if (d) setVideoDuration(d);
            }}
          />
        ) : inProgress ? (
          <LiveCaptureCard
            statusText={statusLabel(meeting.status)}
            detail={meeting.meetingLogs?.length ? meeting.meetingLogs[meeting.meetingLogs.length - 1].message : undefined}
          />
        ) : (
          <RecordingUnavailable />
        )}
        <SentimentTimeline segments={segments} durationSeconds={effectiveDuration} currentTime={currentTime} onSeek={seek} />
        <View style={styles.rowBetween}>
          <Text variant="caption" tone="faint">
            {formatDuration(currentTime)}
          </Text>
          <Text variant="caption" tone="faint">
            {formatDuration(effectiveDuration)}
          </Text>
        </View>
      </View>

      {/* Tabs — counts show each section's volume at a glance */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 18 }} contentContainerStyle={{ gap: 8 }}>
        {TABS.map((t) => {
          const active = t.key === tab;
          const count =
            t.key === "actions"
              ? meeting.actionItems.length
              : t.key === "moments"
                ? moments.length
                : t.key === "speakers"
                  ? speakers.length
                  : undefined;
          return (
            <Pressable
              key={t.key}
              onPress={() => setTab(t.key)}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                paddingHorizontal: 14,
                minHeight: 36,
                borderRadius: theme.radii.pill,
                backgroundColor: active ? theme.color.accent : theme.color.surfaceHi,
                opacity: pressed ? 0.8 : 1
              })}
            >
              <Text variant="label" style={{ color: active ? "#fff" : theme.color.inkMute }}>
                {t.label}
              </Text>
              {typeof count === "number" && count > 0 ? (
                <View
                  style={{
                    minWidth: 20,
                    paddingHorizontal: 5,
                    paddingVertical: 1,
                    borderRadius: 10,
                    alignItems: "center",
                    backgroundColor: active ? "rgba(255,255,255,0.25)" : theme.color.surface
                  }}
                >
                  <Text variant="caption" style={{ color: active ? "#fff" : theme.color.inkMute, fontVariant: ["tabular-nums"] }}>
                    {count}
                  </Text>
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={{ marginTop: 14 }}>
        {tab === "summary" ? <SummaryTab meeting={meeting} /> : null}
        {tab === "actions" ? <ActionsTab meeting={meeting} done={done} setDone={setDone} /> : null}
        {tab === "moments" ? <MomentsTab moments={moments} onSeek={seek} /> : null}
        {tab === "speakers" ? (
          <SpeakersTab meeting={meeting} active={speakerFilter} onFilter={(s) => setSpeakerFilter((f) => (f === s ? undefined : s))} />
        ) : null}
        {tab === "minutes" ? <MomReportView meeting={meeting} /> : null}
      </View>

      {/* Transcript */}
      <Card style={{ marginTop: 16 }}>
        <SectionTitle title="Transcript" icon="Users" />
        {speakers.length > 1 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }} contentContainerStyle={{ gap: 6 }}>
            <FilterChip label="All" active={!speakerFilter} onPress={() => setSpeakerFilter(undefined)} />
            {speakers.map((s) => (
              <FilterChip key={s} label={s} active={speakerFilter === s} onPress={() => setSpeakerFilter(s)} />
            ))}
          </ScrollView>
        ) : null}
        <TranscriptList segments={segments} currentTime={currentTime} onSeek={seek} speakerFilter={speakerFilter} />
      </Card>

      {/* Participants */}
      {meeting.participants.length > 0 ? (
        <Card style={{ marginTop: 16, marginBottom: 8 }}>
          <SectionTitle title="Participants" icon="Users" count={meeting.participants.length} />
          <View style={{ gap: 4 }}>
            {meeting.participants.map((p, i) => (
              <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 12, minHeight: 44 }}>
                <Avatar name={p.name} size={32} />
                <Text variant="body">{p.name}</Text>
              </View>
            ))}
          </View>
        </Card>
      ) : null}

      <ShareSheet
        visible={shareOpen}
        onClose={() => setShareOpen(false)}
        sessionId={sessionId}
        initialEnabled={meeting.shareEnabled}
        initialToken={meeting.shareToken}
      />

      <MomModal visible={momOpen} onClose={() => setMomOpen(false)} meeting={meeting} />
      {deleting ? null : null}
      <ConfirmModal
        visible={confirmDeleteOpen}
        title="Delete this meeting?"
        message="The recording, transcript and reports are permanently removed. This cannot be undone."
        confirmLabel="Delete"
        destructive
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setConfirmDeleteOpen(false)}
      />
    </Screen>
  );
}

// Small accent chip showing where a tap will seek to in the recording.
function PlayTimeChip({ time }: { time: number }) {
  const { theme } = useTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        alignSelf: "flex-start",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: theme.radii.pill,
        backgroundColor: theme.color.accent + "1A"
      }}
    >
      <Icon name="Play" size={10} color={theme.color.accent} />
      <Text variant="caption" style={{ color: theme.color.accent, fontVariant: ["tabular-nums"] }}>
        {formatDuration(time)}
      </Text>
    </View>
  );
}

function FilterChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const { theme } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={`Filter transcript: ${label}`}
      style={({ pressed }) => ({
        paddingHorizontal: 14,
        minHeight: 34,
        justifyContent: "center",
        borderRadius: theme.radii.pill,
        backgroundColor: active ? theme.color.accent : theme.color.surfaceHi,
        opacity: pressed ? 0.8 : 1
      })}
    >
      <Text variant="caption" style={{ color: active ? "#fff" : theme.color.inkMute }}>
        {label}
      </Text>
    </Pressable>
  );
}

function SummaryTab({ meeting }: { meeting: Meeting }) {
  const purpose = meeting.momReport?.meetingPurpose || meeting.momReport?.executiveSummary || meeting.summary?.split(/[.!?]/)[0];
  const takeaways = (meeting.momReport?.keyTakeaways ?? []).filter((k) => k.title);
  if (!purpose && takeaways.length === 0) {
    return (
      <Card>
        <Text tone="mute">No summary available yet.</Text>
      </Card>
    );
  }
  return (
    <Card>
      {purpose ? (
        <>
          <SectionTitle title="Meeting purpose" icon="Sparkles" />
          <RichText variant="body" tone="soft" style={{ lineHeight: 22, marginBottom: takeaways.length ? 16 : 0 }}>
            {purpose}
          </RichText>
        </>
      ) : null}
      {takeaways.length > 0 ? (
        <>
          <SectionTitle title="Key takeaways" icon="Check" />
          <View style={{ gap: 10 }}>
            {takeaways.map((k, i) => (
              <View key={i} style={{ flexDirection: "row", gap: 8 }}>
                <Text tone="accent">•</Text>
                <RichText variant="body" style={{ flex: 1 }}>
                  {`<strong>${k.title}</strong>${k.detail ? ` — ${k.detail}` : ""}`}
                </RichText>
              </View>
            ))}
          </View>
        </>
      ) : null}
    </Card>
  );
}

function ActionsTab({ meeting, done, setDone }: { meeting: Meeting; done: Record<number, boolean>; setDone: (f: (d: Record<number, boolean>) => Record<number, boolean>) => void }) {
  const { theme } = useTheme();
  if (meeting.actionItems.length === 0) {
    return (
      <Card>
        <Text tone="mute">No action items captured for this meeting.</Text>
      </Card>
    );
  }
  const completed = Object.values(done).filter(Boolean).length;
  return (
    <Card>
      <View style={styles.rowBetween}>
        <Text variant="caption" tone="mute">
          Tap to mark complete
        </Text>
        <Text variant="caption" tone="mute" style={{ fontVariant: ["tabular-nums"] }}>
          {completed}/{meeting.actionItems.length} done
        </Text>
      </View>
      <View style={{ marginTop: 8 }}>
        <ProgressBar value={meeting.actionItems.length ? completed / meeting.actionItems.length : 0} />
      </View>
      <View style={{ gap: 4, marginTop: 10 }}>
        {meeting.actionItems.map((a, i) => {
          const isDone = !!done[i];
          return (
            <Pressable
              key={i}
              onPress={() => setDone((d) => ({ ...d, [i]: !d[i] }))}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: isDone }}
              accessibilityLabel={a.task}
              style={({ pressed }) => ({
                flexDirection: "row",
                gap: 12,
                alignItems: "flex-start",
                minHeight: 44,
                paddingVertical: 8,
                opacity: pressed ? 0.7 : 1
              })}
            >
              <View
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 7,
                  borderWidth: 1.5,
                  borderColor: isDone ? theme.color.success : theme.color.line,
                  backgroundColor: isDone ? theme.color.success : "transparent",
                  alignItems: "center",
                  justifyContent: "center",
                  marginTop: 1
                }}
              >
                {isDone ? <Icon name="Check" size={13} color="#fff" /> : null}
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  variant="body"
                  style={{
                    textDecorationLine: isDone ? "line-through" : "none",
                    color: isDone ? theme.color.inkFaint : theme.color.ink
                  }}
                >
                  {a.task}
                </Text>
                {a.assignee ? (
                  <Text variant="caption" tone="mute" style={{ marginTop: 2 }}>
                    {a.assignee}
                  </Text>
                ) : null}
              </View>
            </Pressable>
          );
        })}
      </View>
    </Card>
  );
}

function MomentsTab({ moments, onSeek }: { moments: ReturnType<typeof deriveMoments>; onSeek: (t: number) => void }) {
  if (moments.length === 0) {
    return (
      <Card>
        <Text tone="mute">No key moments detected for this meeting.</Text>
      </Card>
    );
  }
  return (
    <Card>
      <View style={{ gap: 6 }}>
        {moments.map((m, i) => (
          <Pressable
            key={i}
            onPress={() => onSeek(m.startTime)}
            accessibilityRole="button"
            accessibilityLabel={`Jump to ${m.speaker} at ${formatDuration(m.startTime)}`}
            style={({ pressed }) => ({ flexDirection: "row", gap: 10, minHeight: 44, paddingVertical: 8, opacity: pressed ? 0.7 : 1 })}
          >
            <Avatar name={m.speaker || "?"} size={28} />
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 2, flexWrap: "wrap" }}>
                <Text variant="label">{m.speaker}</Text>
                <Badge label={m.label} tone={m.label === "positive" ? "positive" : m.label === "negative" ? "negative" : "neutral"} />
              </View>
              {m.quote ? (
                <Text variant="body" tone="soft" style={{ fontStyle: "italic" }}>
                  “{m.quote}”
                </Text>
              ) : null}
            </View>
            {/* Play-time chip: makes "tap to jump" obvious */}
            <PlayTimeChip time={m.startTime} />
          </Pressable>
        ))}
      </View>
    </Card>
  );
}

function SpeakersTab({ meeting, active, onFilter }: { meeting: Meeting; active?: string; onFilter: (s: string) => void }) {
  const { theme } = useTheme();
  const counts: Record<string, number> = {};
  for (const s of meeting.diarizedTranscript ?? []) {
    if (!s.speaker) continue;
    counts[s.speaker] = (counts[s.speaker] ?? 0) + 1;
  }
  const perSpeaker = meeting.sentimentSummary?.perSpeaker ?? [];
  const rows = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const max = rows.length ? rows[0][1] : 1;
  if (rows.length === 0) {
    return (
      <Card>
        <Text tone="mute">No speakers detected.</Text>
      </Card>
    );
  }
  return (
    <Card>
      <View style={{ gap: 14 }}>
        {rows.map(([name, count]) => {
          const sent = perSpeaker.find((p) => p.speaker === name);
          const isActive = active === name;
          return (
            <Pressable
              key={name}
              onPress={() => onFilter(name)}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={`Filter transcript by ${name}`}
              style={({ pressed }) => ({ flexDirection: "row", gap: 10, alignItems: "center", minHeight: 44, opacity: pressed ? 0.7 : 1 })}
            >
              <Avatar name={name} size={30} />
              <View style={{ flex: 1 }}>
                <View style={styles.rowBetween}>
                  <Text variant="label" style={{ color: isActive ? theme.color.accent : theme.color.ink }}>
                    {name}
                  </Text>
                  <Text variant="caption" tone="faint">
                    {count} segments
                  </Text>
                </View>
                <ProgressBar value={count / max} />
              </View>
              {sent ? <Badge label={sent.score.toFixed(2)} tone={sent.label === "positive" ? "positive" : sent.label === "negative" ? "negative" : "neutral"} /> : null}
            </Pressable>
          );
        })}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  badgeRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10, flexWrap: "wrap" },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 12, flexWrap: "wrap" },
  metaChip: { flexDirection: "row", alignItems: "center", gap: 5 },
  actions: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 16 },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }
});
