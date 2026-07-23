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

function IconButton({ name, onPress, color }: { name: any; onPress: () => void; color?: string }) {
  const { theme } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={{
        width: 44,
        height: 44,
        borderRadius: theme.radii.md,
        borderWidth: 1,
        borderColor: theme.color.line,
        backgroundColor: theme.color.surface,
        alignItems: "center",
        justifyContent: "center"
      }}
    >
      <Icon name={name} size={18} color={color ?? theme.color.inkMute} />
    </Pressable>
  );
}

// Labeled pill action (icon + text), matches the web meeting-detail action bar.
function ActionPill({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  const { theme } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        height: 44,
        paddingHorizontal: 16,
        borderRadius: theme.radii.md,
        borderWidth: 1,
        borderColor: theme.color.line,
        backgroundColor: pressed ? theme.color.surfaceHi : theme.color.surface
      })}
    >
      <Icon name={icon} size={17} color={theme.color.accent} />
      <Text variant="label" style={{ color: theme.color.ink }}>
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
          <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: sentimentHex(overall.label) }} />
            <Text variant="caption" tone="mute">
              {overall.label} · {overall.score.toFixed(2)}
            </Text>
          </View>
        ) : null}
      </View>
      <Text variant="title">{meeting.meetingName || "Untitled meeting"}</Text>
      <View style={styles.metaRow}>
        <Icon name="Calendar" size={13} color={theme.color.inkFaint} />
        <Text variant="caption" tone="faint">
          {formatRelative(meeting.endedAt ?? meeting.startedAt ?? meeting.createdAt)}
        </Text>
        {effectiveDuration > 0 ? (
          <>
            <Icon name="Clock" size={13} color={theme.color.inkFaint} />
            <Text variant="caption" tone="faint">
              {formatDuration(effectiveDuration)}
            </Text>
          </>
        ) : null}
        {meeting.participants.length > 0 ? (
          <>
            <Icon name="Users" size={13} color={theme.color.inkFaint} />
            <Text variant="caption" tone="faint">
              {meeting.participants.length}
            </Text>
          </>
        ) : null}
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <ActionPill icon="Sparkles" label="View MoM" onPress={() => setMomOpen(true)} />
        <View style={{ flex: 1 }} />
        {meeting.recordingUrl ? (
          <IconButton name="Video" onPress={() => Linking.openURL(meeting.recordingUrl as string)} />
        ) : null}
        <IconButton name="Link" onPress={() => setShareOpen(true)} />
        <IconButton name="Trash" color={theme.color.danger} onPress={() => setConfirmDeleteOpen(true)} />
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

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 18 }} contentContainerStyle={{ gap: 8 }}>
        {TABS.map((t) => {
          const active = t.key === tab;
          return (
            <Pressable
              key={t.key}
              onPress={() => setTab(t.key)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: theme.radii.pill,
                backgroundColor: active ? theme.color.accent : theme.color.surfaceHi
              }}
            >
              <Text variant="label" style={{ color: active ? "#fff" : theme.color.inkMute }}>
                {t.label}
              </Text>
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
          <View style={{ gap: 10 }}>
            {meeting.participants.map((p, i) => (
              <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <Avatar name={p.name} size={28} />
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

function FilterChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const { theme } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: theme.radii.pill,
        backgroundColor: active ? theme.color.accent : theme.color.surfaceHi
      }}
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
          {meeting.actionItems.length} item{meeting.actionItems.length === 1 ? "" : "s"} · tap to mark complete
        </Text>
        <Text variant="caption" tone="mute">
          {completed}/{meeting.actionItems.length} done
        </Text>
      </View>
      <View style={{ gap: 12, marginTop: 12 }}>
        {meeting.actionItems.map((a, i) => {
          const isDone = !!done[i];
          return (
            <Pressable key={i} onPress={() => setDone((d) => ({ ...d, [i]: !d[i] }))} style={{ flexDirection: "row", gap: 10, alignItems: "flex-start" }}>
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 6,
                  borderWidth: 1.5,
                  borderColor: isDone ? theme.color.success : theme.color.line,
                  backgroundColor: isDone ? theme.color.success : "transparent",
                  alignItems: "center",
                  justifyContent: "center",
                  marginTop: 1
                }}
              >
                {isDone ? <Icon name="Check" size={12} color="#fff" /> : null}
              </View>
              <Text variant="body" style={{ flex: 1, textDecorationLine: isDone ? "line-through" : "none", color: isDone ? theme.color.inkFaint : theme.color.ink }}>
                {a.task}
                {a.assignee ? ` — ${a.assignee}` : ""}
              </Text>
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
      <View style={{ gap: 14 }}>
        {moments.map((m, i) => (
          <Pressable key={i} onPress={() => onSeek(m.startTime)} style={{ flexDirection: "row", gap: 10 }}>
            <Avatar name={m.speaker || "?"} size={28} />
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 2 }}>
                <Text variant="label">{m.speaker}</Text>
                <Badge label={m.label} tone={m.label === "positive" ? "positive" : m.label === "negative" ? "negative" : "neutral"} />
                <Text variant="caption" tone="faint">
                  {formatDuration(m.startTime)}
                </Text>
              </View>
              {m.quote ? (
                <Text variant="body" tone="soft" style={{ fontStyle: "italic" }}>
                  “{m.quote}”
                </Text>
              ) : null}
            </View>
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
            <Pressable key={name} onPress={() => onFilter(name)} style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
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
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 10, flexWrap: "wrap" },
  actions: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 16 },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }
});
