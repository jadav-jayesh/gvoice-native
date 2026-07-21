import React from "react";
import { StyleSheet, View } from "react-native";
import type { Meeting } from "../../core/api/types";
import { formatDuration } from "../../core/lib/format";
import { useTheme } from "../../core/theme/ThemeProvider";
import { Avatar } from "../../ui/Avatar";
import { Card } from "../../ui/Card";
import { ProgressBar } from "../../ui/ProgressBar";
import { SectionTitle } from "../../ui/Section";
import { Text } from "../../ui/Text";
import { resolveMom } from "./mom";

function Chip({ label, color }: { label: string; color: string }) {
  return (
    <View style={{ backgroundColor: color + "22", borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3, alignSelf: "flex-start" }}>
      <Text style={{ color, fontSize: 11, fontWeight: "600" }}>{label}</Text>
    </View>
  );
}

// Native render of the full MoM report (all 9 sections). Mirrors the web
// downloadable MoM document's structure, but as native views.
export function MomReportView({ meeting }: { meeting: Meeting }) {
  const { theme } = useTheme();
  const r = resolveMom(meeting);
  const segs = meeting.diarizedTranscript ?? [];

  const priColor = (p?: string) =>
    p === "high" || p === "critical" ? theme.color.danger : p === "low" ? theme.color.inkMute : theme.color.warning;

  return (
    <View style={{ gap: 14 }}>
      {/* 1. Executive summary */}
      <Card>
        <SectionTitle title="Executive summary" icon="Sparkles" />
        <Text variant="body" tone="soft" style={styles.body}>
          {r.executiveSummary}
        </Text>
      </Card>

      {/* 2. Sentiment */}
      <Card>
        <SectionTitle title="Sentiment" icon="Trend" />
        {[
          { label: "Positive", v: r.toneBreakdown.positive, c: theme.color.success },
          { label: "Neutral", v: r.toneBreakdown.neutral, c: theme.color.inkMute },
          { label: "Concerns", v: r.toneBreakdown.concerns, c: theme.color.danger }
        ].map((t) => (
          <View key={t.label} style={{ marginBottom: 10 }}>
            <View style={styles.rowBetween}>
              <Text variant="label" tone="mute">
                {t.label}
              </Text>
              <Text variant="label">{t.v}%</Text>
            </View>
            <ProgressBar value={t.v / 100} color={t.c} />
          </View>
        ))}
        {r.notableQuotes.length > 0 ? (
          <View style={{ marginTop: 8, gap: 10 }}>
            <Text variant="label" tone="mute">
              NOTABLE QUOTES
            </Text>
            {r.notableQuotes.map((q, i) => (
              <View key={i} style={{ flexDirection: "row", gap: 10 }}>
                <Avatar name={q.speaker || "?"} size={26} />
                <View style={{ flex: 1 }}>
                  <Text variant="body" tone="soft" style={{ fontStyle: "italic" }}>
                    “{q.text}”
                  </Text>
                  <Text variant="caption" tone="faint">
                    {q.speaker}
                    {q.company ? ` · ${q.company}` : ""}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ) : null}
      </Card>

      {/* 3. Ups & downs */}
      {r.positives.length > 0 || r.concerns.length > 0 ? (
        <Card>
          <SectionTitle title="Ups & downs" icon="Layers" />
          {r.positives.map((p, i) => (
            <View key={`p${i}`} style={styles.item}>
              <Text style={{ color: theme.color.success }}>▲</Text>
              <Text variant="body" style={{ flex: 1 }}>
                <Text style={{ fontWeight: "700" }}>{p.title}</Text>
                {p.detail ? ` — ${p.detail}` : ""}
              </Text>
            </View>
          ))}
          {r.concerns.map((c, i) => (
            <View key={`c${i}`} style={styles.item}>
              <Text style={{ color: theme.color.danger }}>▼</Text>
              <Text variant="body" style={{ flex: 1 }}>
                <Text style={{ fontWeight: "700" }}>{c.title}</Text>
                {c.detail ? ` — ${c.detail}` : ""}
              </Text>
            </View>
          ))}
        </Card>
      ) : null}

      {/* 4. Minutes */}
      {r.momSections.length > 0 ? (
        <Card>
          <SectionTitle title="Minutes" icon="Hash" count={r.momSections.length} />
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
                  <Text variant="body" tone="soft" style={styles.body}>
                    {s.body}
                  </Text>
                ) : null}
              </View>
            ))}
          </View>
        </Card>
      ) : null}

      {/* 5. Action items */}
      {r.actionItems.length > 0 ? (
        <Card>
          <SectionTitle title="Action items" icon="CheckCircle" count={r.actionItems.length} />
          <View style={{ gap: 12 }}>
            {r.actionItems.map((a, i) => {
              const owners = a.owners && a.owners.length ? a.owners : a.owner ? [a.owner] : [];
              return (
                <View key={i} style={{ gap: 4 }}>
                  <Text variant="body" style={{ fontWeight: "600" }}>
                    {a.task}
                  </Text>
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
        </Card>
      ) : null}

      {/* 6. Top to-dos */}
      {r.topTodos.length > 0 ? (
        <Card>
          <SectionTitle title="Top to-dos" icon="Bolt" count={r.topTodos.length} />
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
        </Card>
      ) : null}

      {/* 7. Risks */}
      {r.risks.length > 0 ? (
        <Card>
          <SectionTitle title="Risks & blockers" icon="AlertCircle" count={r.risks.length} />
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
                  <Text variant="body" tone="soft">
                    {risk.detail}
                  </Text>
                ) : null}
                <Text variant="caption" tone="faint">
                  Owner: {risk.owner ?? "—"}
                </Text>
              </View>
            ))}
          </View>
        </Card>
      ) : null}

      {/* 8. Next steps */}
      {r.nextSteps.length > 0 ? (
        <Card>
          <SectionTitle title="Next steps" icon="ArrowRight" count={r.nextSteps.length} />
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
        </Card>
      ) : null}

      {/* 9. Attendees */}
      {r.attendees.length > 0 ? (
        <Card>
          <SectionTitle title="Attendees" icon="Users" count={r.attendees.length} />
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
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
        </Card>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  body: { lineHeight: 22 },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  item: { flexDirection: "row", gap: 8, marginBottom: 8 }
});
