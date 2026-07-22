import React, { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Modal, Platform, Pressable, ScrollView, View, type NativeScrollEvent, type NativeSyntheticEvent } from "react-native";
import * as IntentLauncher from "expo-intent-launcher";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { Meeting } from "../../core/api/types";
import { formatDuration, platformLabel } from "../../core/lib/format";
import { useTheme } from "../../core/theme/ThemeProvider";
import { Avatar } from "../../ui/Avatar";
import { Icon, type IconName } from "../../ui/Icon";
import { ProgressBar } from "../../ui/ProgressBar";
import { RichText } from "../../ui/RichText";
import { Text } from "../../ui/Text";
import { downloadMomHtml } from "./exportMom";
import { resolveMom } from "./mom";
import { ShareSheet } from "./ShareSheet";

function HeaderButton({ icon, onPress, color }: { icon: IconName; onPress: () => void; color?: string }) {
  const { theme } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => ({
        width: 40,
        height: 40,
        borderRadius: theme.radii.md,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: pressed ? theme.color.surfaceHi : "transparent"
      })}
    >
      <Icon name={icon} size={20} color={color ?? theme.color.ink} />
    </Pressable>
  );
}

function Chip({ label, color }: { label: string; color: string }) {
  return (
    <View style={{ backgroundColor: color + "22", borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3, alignSelf: "flex-start" }}>
      <Text style={{ color, fontSize: 11, fontWeight: "600" }}>{label}</Text>
    </View>
  );
}

const pad2 = (n: number) => String(n).padStart(2, "0");

// Full-screen, web-styled Minutes of Meeting: numbered section tabs that scroll
// to each section, a stat-card overview, and numbered section blocks. Download
// exports the HTML file; Share opens the public link.
export function MomModal({ visible, onClose, meeting }: { visible: boolean; onClose: () => void; meeting: Meeting }) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const r = resolveMom(meeting);
  const segs = meeting.diarizedTranscript ?? [];

  const [phase, setPhase] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [savedTo, setSavedTo] = useState<string>("Downloads");
  const [shareOpen, setShareOpen] = useState(false);
  const [active, setActive] = useState<string>("summary");
  const progress = useRef(new Animated.Value(0)).current;

  // Transient bottom snackbar for the download flow (auto-hides).
  const [snackShown, setSnackShown] = useState(false);
  const snackAnim = useRef(new Animated.Value(0)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
  }, []);

  function showSnack() {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
    setSnackShown(true);
    Animated.timing(snackAnim, { toValue: 1, duration: 220, useNativeDriver: true }).start();
  }
  function hideSnack() {
    Animated.timing(snackAnim, { toValue: 0, duration: 220, useNativeDriver: true }).start(({ finished }) => {
      if (finished) setSnackShown(false);
    });
  }
  function scheduleHide(ms: number) {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(hideSnack, ms);
  }

  const scrollRef = useRef<ScrollView>(null);
  const tabsRef = useRef<ScrollView>(null);
  const offsets = useRef<Record<string, number>>({});
  const tabX = useRef<Record<string, number>>({});

  const priColor = (p?: string) =>
    p === "high" || p === "critical" ? theme.color.danger : p === "low" ? theme.color.inkMute : theme.color.warning;

  // Overview stats.
  const durationSec = useMemo(() => (segs.length ? Math.max(...segs.map((s) => s.endTime)) : 0), [segs]);
  const durationMin = durationSec > 0 ? Math.max(1, Math.round(durationSec / 60)) : 0;
  const date = new Date(meeting.endedAt ?? meeting.startedAt ?? meeting.createdAt ?? r.generatedAt);
  const validDate = !Number.isNaN(date.getTime());

  // Ordered list of sections that actually have content — drives both the tab
  // strip and the numbered blocks.
  const sections = useMemo(() => {
    const list: { key: string; label: string; icon: IconName; body: React.ReactNode }[] = [];

    list.push({
      key: "summary",
      label: "Summary",
      icon: "Sparkles",
      body: (
        <RichText variant="body" tone="soft" style={{ lineHeight: 23 }}>
          {r.executiveSummary}
        </RichText>
      )
    });

    list.push({
      key: "sentiment",
      label: "Sentiment",
      icon: "Trend",
      body: (
        <View>
          {[
            { label: "Positive", v: r.toneBreakdown.positive, c: theme.color.success },
            { label: "Neutral", v: r.toneBreakdown.neutral, c: theme.color.inkMute },
            { label: "Concerns", v: r.toneBreakdown.concerns, c: theme.color.danger }
          ].map((t) => (
            <View key={t.label} style={{ marginBottom: 10 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                <Text variant="label" tone="mute">
                  {t.label}
                </Text>
                <Text variant="label">{t.v}%</Text>
              </View>
              <ProgressBar value={t.v / 100} color={t.c} />
            </View>
          ))}
          {r.notableQuotes.length > 0 ? (
            <View style={{ marginTop: 12, gap: 10 }}>
              <Text variant="label" tone="mute">
                NOTABLE QUOTES
              </Text>
              {r.notableQuotes.map((q, i) => (
                <View key={i} style={{ flexDirection: "row", gap: 10 }}>
                  <Avatar name={q.speaker || "?"} size={26} />
                  <View style={{ flex: 1 }}>
                    <RichText variant="body" tone="soft" style={{ fontStyle: "italic" }}>
                      {`“${q.text}”`}
                    </RichText>
                    <Text variant="caption" tone="faint">
                      {q.speaker}
                      {q.company ? ` · ${q.company}` : ""}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      )
    });

    if (r.positives.length > 0 || r.concerns.length > 0) {
      list.push({
        key: "upsdowns",
        label: "Ups & Downs",
        icon: "Layers",
        body: (
          <View style={{ gap: 8 }}>
            {r.positives.map((p, i) => (
              <View key={`p${i}`} style={{ flexDirection: "row", gap: 8 }}>
                <Text style={{ color: theme.color.success }}>▲</Text>
                <RichText variant="body" style={{ flex: 1 }}>
                  {`<strong>${p.title}</strong>${p.detail ? ` — ${p.detail}` : ""}`}
                </RichText>
              </View>
            ))}
            {r.concerns.map((c, i) => (
              <View key={`c${i}`} style={{ flexDirection: "row", gap: 8 }}>
                <Text style={{ color: theme.color.danger }}>▼</Text>
                <RichText variant="body" style={{ flex: 1 }}>
                  {`<strong>${c.title}</strong>${c.detail ? ` — ${c.detail}` : ""}`}
                </RichText>
              </View>
            ))}
          </View>
        )
      });
    }

    if (r.momSections.length > 0) {
      list.push({
        key: "minutes",
        label: "Minutes",
        icon: "Hash",
        body: (
          <View style={{ gap: 14 }}>
            {r.momSections.map((s, i) => (
              <View key={i} style={{ gap: 4 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Chip label={s.tag} color={theme.color.accent} />
                  <Text variant="caption" tone="faint">
                    {segs[s.index] ? formatDuration(segs[s.index].startTime) : "—"}
                  </Text>
                </View>
                <Text variant="heading">{s.topic}</Text>
                {s.body ? (
                  <RichText variant="body" tone="soft" style={{ lineHeight: 22 }}>
                    {s.body}
                  </RichText>
                ) : null}
              </View>
            ))}
          </View>
        )
      });
    }

    if (r.actionItems.length > 0) {
      list.push({
        key: "actions",
        label: "Actions",
        icon: "CheckCircle",
        body: (
          <View style={{ gap: 12 }}>
            {r.actionItems.map((a, i) => {
              const owners = a.owners && a.owners.length ? a.owners : a.owner ? [a.owner] : [];
              return (
                <View key={i} style={{ gap: 4 }}>
                  <RichText variant="body" style={{ fontWeight: "600" }}>
                    {a.task}
                  </RichText>
                  {a.detail ? (
                    <Text variant="caption" tone="mute">
                      {a.detail}
                    </Text>
                  ) : null}
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    {owners.map((o, oi) => (
                      <View key={oi} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                        <Avatar name={o} size={18} />
                        <Text variant="caption" tone="mute">
                          {o}
                        </Text>
                      </View>
                    ))}
                    {a.due ? <Chip label={a.due} color={theme.color.inkMute} /> : null}
                    <Chip label={(a.priority ?? "medium").toUpperCase()} color={priColor(a.priority)} />
                    <Chip label={(a.status ?? "open").replace(/_/g, " ")} color={theme.color.accent} />
                  </View>
                </View>
              );
            })}
          </View>
        )
      });
    }

    if (r.topTodos.length > 0) {
      list.push({
        key: "todos",
        label: "To-dos",
        icon: "Bolt",
        body: (
          <View style={{ gap: 12 }}>
            {r.topTodos.map((t, i) => (
              <View key={i} style={{ gap: 4 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Chip label={(t.priority ?? "medium").toUpperCase()} color={priColor(t.priority)} />
                  <Text variant="heading" style={{ flex: 1 }}>
                    {t.title}
                  </Text>
                </View>
                {t.detail ? (
                  <Text variant="body" tone="soft">
                    {t.detail}
                  </Text>
                ) : null}
                {t.owner || t.due ? (
                  <Text variant="caption" tone="faint">
                    {t.owner ?? ""}
                    {t.due ? ` · ${t.due}` : ""}
                  </Text>
                ) : null}
              </View>
            ))}
          </View>
        )
      });
    }

    if (r.risks.length > 0) {
      list.push({
        key: "risks",
        label: "Risks",
        icon: "AlertCircle",
        body: (
          <View style={{ gap: 12 }}>
            {r.risks.map((risk, i) => (
              <View key={i} style={{ gap: 4 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Chip label={risk.severity === "red" ? "Blocker" : "Risk"} color={risk.severity === "red" ? theme.color.danger : theme.color.warning} />
                  <Text variant="heading" style={{ flex: 1 }}>
                    {risk.title}
                  </Text>
                </View>
                {risk.detail ? (
                  <RichText variant="body" tone="soft">
                    {risk.detail}
                  </RichText>
                ) : null}
                <Text variant="caption" tone="faint">
                  Owner: {risk.owner ?? "—"}
                </Text>
              </View>
            ))}
          </View>
        )
      });
    }

    if (r.nextSteps.length > 0) {
      list.push({
        key: "next",
        label: "Next Steps",
        icon: "ArrowRight",
        body: (
          <View style={{ gap: 12 }}>
            {r.nextSteps.map((s, i) => (
              <View key={i} style={{ gap: 2 }}>
                <Text variant="caption" tone="accent">
                  {s.period?.toUpperCase()}
                </Text>
                <Text variant="heading">{s.title}</Text>
                {s.detail ? (
                  <Text variant="body" tone="soft">
                    {s.detail}
                  </Text>
                ) : null}
              </View>
            ))}
          </View>
        )
      });
    }

    if (r.attendees.length > 0) {
      list.push({
        key: "attendees",
        label: "Attendees",
        icon: "Users",
        body: (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 14 }}>
            {r.attendees.map((a, i) => (
              <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Avatar name={a.name} size={28} />
                <View>
                  <Text variant="label">{a.name}</Text>
                  {a.role ? (
                    <Text variant="caption" tone="faint">
                      {a.role}
                    </Text>
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        )
      });
    }

    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meeting]);

  function goTo(key: string) {
    const y = offsets.current[key];
    if (y != null) scrollRef.current?.scrollTo({ y: Math.max(0, y - 8), animated: true });
    setActive(key);
  }

  function onScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const y = e.nativeEvent.contentOffset.y + 12;
    let current = sections[0]?.key ?? "summary";
    for (const s of sections) {
      const oy = offsets.current[s.key];
      if (oy != null && oy <= y) current = s.key;
    }
    if (current !== active) {
      setActive(current);
      const x = tabX.current[current];
      if (x != null) tabsRef.current?.scrollTo({ x: Math.max(0, x - 16), animated: true });
    }
  }

  async function download() {
    if (phase === "saving") return;
    setError(null);
    setPhase("saving");
    showSnack();
    // Visible progress feedback: fill toward 90% while the file writes, then
    // snap to 100% on completion.
    progress.setValue(0);
    Animated.timing(progress, { toValue: 0.9, duration: 600, useNativeDriver: false }).start();
    try {
      const res = await downloadMomHtml(meeting);
      Animated.timing(progress, { toValue: 1, duration: 200, useNativeDriver: false }).start();
      setSavedTo(res.savedTo || "your files");
      setPhase("done");
      scheduleHide(5000); // toast lingers, then slides away
    } catch (err) {
      progress.setValue(0);
      setPhase("error");
      setError(err instanceof Error ? err.message : "Couldn't download the minutes.");
      scheduleHide(4000);
    }
  }

  async function openDownloads() {
    try {
      if (Platform.OS === "android") {
        await IntentLauncher.startActivityAsync("android.intent.action.VIEW_DOWNLOADS");
      }
    } catch {
      // Some devices have no Downloads UI activity — ignore.
    }
  }

  const stats = [
    { label: "DATE", big: validDate ? String(date.getDate()).padStart(2, "0") : "—", unit: validDate ? date.toLocaleString(undefined, { month: "short" }) : "", sub: validDate ? date.toLocaleDateString(undefined, { weekday: "long", year: "numeric" }) : "" },
    { label: "DURATION", big: durationMin ? String(durationMin) : "—", unit: durationMin ? "min" : "", sub: "Recorded session" },
    { label: "ATTENDEES", big: pad2(r.attendees.length || meeting.participants.length), unit: "", sub: `${r.attendees.length || meeting.participants.length} participants` },
    { label: "SENTIMENT", big: String(r.toneBreakdown.positive), unit: "%", sub: "Positive tone share", accent: true },
    { label: "ACTIONS", big: pad2(r.actionItems.length), unit: "", sub: "Captured this session", accent: true }
  ];

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={{ flex: 1, backgroundColor: theme.color.bg, paddingTop: insets.top }}>
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
            paddingHorizontal: 8,
            paddingVertical: 8,
            borderBottomWidth: 1,
            borderBottomColor: theme.color.line
          }}
        >
          <HeaderButton icon="ChevronLeft" onPress={onClose} />
          <Text variant="heading" style={{ flex: 1, marginLeft: 4 }} numberOfLines={1}>
            Minutes of Meeting
          </Text>
          <HeaderButton icon="Download" onPress={download} color={phase === "saving" ? theme.color.inkFaint : theme.color.ink} />
          <HeaderButton icon="Link" onPress={() => setShareOpen(true)} />
        </View>

        {/* Numbered section tabs — tap to scroll to a section */}
        <View style={{ borderBottomWidth: 1, borderBottomColor: theme.color.line }}>
          <ScrollView
            ref={tabsRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingHorizontal: 12, paddingVertical: 10 }}
          >
            {sections.map((s, i) => {
              const on = s.key === active;
              return (
                <Pressable
                  key={s.key}
                  onPress={() => goTo(s.key)}
                  onLayout={(e) => (tabX.current[s.key] = e.nativeEvent.layout.x)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    paddingHorizontal: 12,
                    height: 34,
                    borderRadius: theme.radii.md,
                    backgroundColor: on ? theme.color.accent : theme.color.surfaceHi
                  }}
                >
                  <Text style={{ fontSize: 11, fontWeight: "700", color: on ? "#fff" : theme.color.inkFaint }}>{pad2(i + 1)}</Text>
                  <Text variant="label" style={{ color: on ? "#fff" : theme.color.inkMute }}>
                    {s.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <ScrollView
          ref={scrollRef}
          scrollEventThrottle={16}
          onScroll={onScroll}
          contentContainerStyle={{ padding: theme.spacing.lg, paddingBottom: insets.bottom + 48 }}
        >
          {/* Eyebrow */}
          <View style={{ alignSelf: "flex-start", backgroundColor: theme.color.accent + "22", borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5, marginBottom: 12 }}>
            <Text style={{ color: theme.color.accent, fontSize: 11, fontWeight: "700", letterSpacing: 0.6 }}>
              {`${platformLabel(meeting.platform).toUpperCase()} · MINUTES OF MEETING`}
            </Text>
          </View>

          {/* Title */}
          <Text style={{ fontSize: 34, fontWeight: "800", fontStyle: "italic", color: theme.color.accent, marginBottom: 18 }} numberOfLines={3}>
            {meeting.meetingName || "Untitled meeting"}
          </Text>

          {/* Stat cards */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingBottom: 4, marginBottom: 20 }}>
            {stats.map((s) => (
              <View
                key={s.label}
                style={{
                  width: 140,
                  padding: 14,
                  borderRadius: theme.radii.lg,
                  borderWidth: 1,
                  borderColor: theme.color.line,
                  backgroundColor: theme.color.surface
                }}
              >
                <Text variant="caption" tone="mute" style={{ letterSpacing: 0.5, marginBottom: 8 }}>
                  {s.label}
                </Text>
                <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 4 }}>
                  <Text style={{ fontSize: 30, fontWeight: "800", color: s.accent ? theme.color.accent : theme.color.ink }}>{s.big}</Text>
                  {s.unit ? (
                    <Text variant="caption" tone="mute" style={{ marginBottom: 6 }}>
                      {s.unit}
                    </Text>
                  ) : null}
                </View>
                <Text variant="caption" tone="faint" style={{ marginTop: 6 }} numberOfLines={1}>
                  {s.sub}
                </Text>
              </View>
            ))}
          </ScrollView>


          {/* Numbered sections */}
          <View style={{ gap: 26 }}>
            {sections.map((s, i) => (
              <View key={s.key} onLayout={(e) => (offsets.current[s.key] = e.nativeEvent.layout.y)}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <Text style={{ fontSize: 13, fontWeight: "700", color: theme.color.inkFaint }}>{pad2(i + 1)}</Text>
                  <Icon name={s.icon} size={18} color={theme.color.accent} />
                  <Text variant="heading">{s.label === "Summary" ? "Executive summary" : s.label}</Text>
                </View>
                {s.body}
              </View>
            ))}
          </View>
        </ScrollView>

        {/* Transient download snackbar — auto-hides after the save completes. */}
        {snackShown ? (
          <Animated.View
            pointerEvents="box-none"
            style={{
              position: "absolute",
              left: 16,
              right: 16,
              bottom: insets.bottom + 16,
              opacity: snackAnim,
              transform: [{ translateY: snackAnim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }]
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
                padding: 14,
                borderRadius: theme.radii.lg,
                borderWidth: 1,
                borderColor: theme.color.line,
                backgroundColor: theme.color.surfaceHi,
                elevation: 6,
                shadowColor: "#000",
                shadowOpacity: 0.25,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 4 }
              }}
            >
              {phase === "saving" ? (
                <>
                  <Icon name="Download" size={16} color={theme.color.accent} />
                  <View style={{ flex: 1, gap: 6 }}>
                    <Text variant="label">Downloading minutes…</Text>
                    <View style={{ height: 6, borderRadius: 6, backgroundColor: theme.color.surfaceMax, overflow: "hidden" }}>
                      <Animated.View
                        style={{
                          height: "100%",
                          borderRadius: 6,
                          backgroundColor: theme.color.accent,
                          width: progress.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] })
                        }}
                      />
                    </View>
                  </View>
                </>
              ) : phase === "error" ? (
                <>
                  <Icon name="AlertCircle" size={18} color={theme.color.danger} />
                  <Text variant="label" style={{ flex: 1, color: theme.color.danger }}>
                    {error}
                  </Text>
                </>
              ) : (
                <>
                  <Icon name="CheckCircle" size={18} color={theme.color.success} />
                  <Text variant="label" style={{ flex: 1, color: theme.color.success }}>
                    Saved to {savedTo}
                  </Text>
                  {Platform.OS === "android" ? (
                    <Pressable
                      onPress={() => {
                        void openDownloads();
                        hideSnack();
                      }}
                      hitSlop={8}
                    >
                      <Text variant="label" style={{ color: theme.color.accent, textDecorationLine: "underline" }}>
                        View
                      </Text>
                    </Pressable>
                  ) : null}
                </>
              )}
            </View>
          </Animated.View>
        ) : null}
      </View>

      <ShareSheet
        visible={shareOpen}
        onClose={() => setShareOpen(false)}
        sessionId={meeting.sessionId}
        initialEnabled={meeting.shareEnabled}
        initialToken={meeting.shareToken}
      />
    </Modal>
  );
}
