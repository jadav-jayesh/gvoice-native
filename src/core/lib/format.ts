import type { BotPlatform, BotStatus, Meeting, SentimentLabel } from "../api/types";

// Vendored from web/src/lib/format.ts. Pure helpers reused as-is. The only
// native adjustment is buildWatchBase (web read window.location.origin, which
// does not exist in RN — see below). The bg-* class helpers are kept for parity
// but native screens map tones to theme colours instead of Tailwind classes.

export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const remaining = Math.floor(seconds % 60);
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${hours}:${String(m).padStart(2, "0")}:${String(remaining).padStart(2, "0")}`;
  }
  return `${minutes}:${String(remaining).padStart(2, "0")}`;
}

export function formatRelative(iso: string | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  const diff = Date.now() - date.getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diff < minute) return "just now";
  if (diff < hour) return `${Math.floor(diff / minute)}m ago`;
  if (diff < day) return `${Math.floor(diff / hour)}h ago`;
  if (diff < 7 * day) return `${Math.floor(diff / day)}d ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function platformLabel(platform: BotPlatform): string {
  switch (platform) {
    case "google_meet":
      return "Meet";
    case "microsoft_teams":
      return "Teams";
    case "zoom":
      return "Zoom";
  }
}

export type BadgeTone = "neutral" | "positive" | "negative" | "warn" | "info" | "brand";

export function platformTone(platform: BotPlatform): BadgeTone {
  switch (platform) {
    case "google_meet":
      return "positive";
    case "microsoft_teams":
      return "info";
    case "zoom":
      return "brand";
  }
}

export function statusTone(status: BotStatus): BadgeTone {
  switch (status) {
    case "completed":
      return "positive";
    case "failed":
    case "transcript_unavailable":
      return "negative";
    case "queued":
    case "starting":
    case "joining":
    case "uploading":
    case "processing":
    case "awaiting_transcript":
      return "warn";
    case "recording":
      return "info";
    default:
      return "neutral";
  }
}

export function statusLabel(status: BotStatus): string {
  switch (status) {
    case "awaiting_transcript":
      return "Awaiting transcript";
    case "transcript_ready":
      return "Transcript ready";
    case "transcript_unavailable":
      return "No transcript";
    default:
      return status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, " ");
  }
}

// Statuses where the pipeline is still working — the detail screen keeps polling
// while the meeting is in one of these; downloads stay hidden until completed.
const IN_PROGRESS_STATUSES: ReadonlySet<BotStatus> = new Set<BotStatus>([
  "queued",
  "starting",
  "joining",
  "recording",
  "uploading",
  "processing",
  "awaiting_transcript",
  "transcript_ready"
]);

export function isMeetingInProgress(status: BotStatus): boolean {
  return IN_PROGRESS_STATUSES.has(status);
}

const STALE_AFTER_MS = 6 * 60 * 60 * 1000;

export function isMeetingStale(status: BotStatus, lastActivity?: string | Date | null): boolean {
  if (!isMeetingInProgress(status)) return false;
  if (!lastActivity) return false;
  const t = new Date(lastActivity).getTime();
  return !Number.isNaN(t) && Date.now() - t > STALE_AFTER_MS;
}

export function sentimentTone(label: SentimentLabel | undefined): BadgeTone {
  switch (label) {
    case "positive":
      return "positive";
    case "negative":
      return "negative";
    default:
      return "neutral";
  }
}

interface HasSentiment {
  sentimentSummary?: { overall: { label: SentimentLabel; score: number } };
}
export function meetingSentimentScore(item: HasSentiment): number | null {
  return item.sentimentSummary?.overall.score ?? null;
}
export function isNegativeMeeting(item: HasSentiment): boolean {
  const overall = item.sentimentSummary?.overall;
  if (!overall) return false;
  return overall.label === "negative" || overall.score <= -0.15;
}
export function isCriticalNegativeMeeting(item: HasSentiment): boolean {
  const score = item.sentimentSummary?.overall.score;
  return typeof score === "number" && score <= -0.4;
}
export function byMostNegative(a: HasSentiment, b: HasSentiment): number {
  return (meetingSentimentScore(a) ?? 1) - (meetingSentimentScore(b) ?? 1);
}

// Fathom-style plain-text transcript (used by the Share / copy actions). Ported
// verbatim except buildWatchBase: RN has no window.location, so WATCH links are
// derived from the configured web origin passed by the caller instead.
export function buildFathomTranscript(meeting: Meeting, webOrigin?: string): string {
  const title = meeting.meetingName?.trim() || meeting.summary?.split(/[.!?]/)[0]?.trim() || "Meeting";
  const dateLabel = formatLongDate(meeting.startedAt ?? meeting.createdAt);
  const transcript = meeting.diarizedTranscript ?? [];
  const duration = transcript.length ? Math.max(...transcript.map((s) => s.endTime)) : 0;
  const watchBase = webOrigin ? `${webOrigin}/meetings/${encodeURIComponent(meeting.sessionId)}` : undefined;
  const companyByName = buildCompanyLookup(meeting.participants ?? []);

  const lines: string[] = [];
  lines.push(dateLabel ? `${title} - ${dateLabel}` : title);
  if (meeting.recordingUrl) {
    const lengthLabel = duration > 0 ? formatLengthLong(duration) : "recording";
    lines.push(`VIEW RECORDING - ${lengthLabel}: ${meeting.recordingUrl}`);
  }
  lines.push("");
  lines.push("---");
  lines.push("");

  type Group = { speaker: string; startTime: number; text: string };
  const groups: Group[] = [];
  for (const segment of transcript) {
    const last = groups[groups.length - 1];
    if (last && last.speaker === segment.speaker) {
      last.text = `${last.text} ${segment.text}`.trim();
    } else {
      groups.push({ speaker: segment.speaker, startTime: segment.startTime, text: segment.text });
    }
  }

  const chapters = [...(meeting.chapters ?? [])].sort((a, b) => a.startTime - b.startTime);
  const moments = [...(meeting.sentimentSummary?.topMoments ?? [])].sort((a, b) => a.startTime - b.startTime);
  let chapterIdx = 0;
  let momentIdx = 0;

  for (const group of groups) {
    while (chapterIdx < chapters.length && chapters[chapterIdx].startTime <= group.startTime) {
      lines.push(formatChapterLine(chapters[chapterIdx], watchBase));
      lines.push("");
      chapterIdx += 1;
    }
    while (momentIdx < moments.length && moments[momentIdx].startTime <= group.startTime) {
      lines.push(formatHighlightLine(moments[momentIdx], watchBase));
      lines.push("");
      momentIdx += 1;
    }
    lines.push(`${formatDuration(group.startTime)} - ${formatSpeakerLabel(group.speaker, companyByName)}`);
    lines.push(`  ${group.text}`);
    lines.push("");
  }
  while (chapterIdx < chapters.length) {
    lines.push(formatChapterLine(chapters[chapterIdx], watchBase));
    chapterIdx += 1;
  }
  while (momentIdx < moments.length) {
    lines.push(formatHighlightLine(moments[momentIdx], watchBase));
    momentIdx += 1;
  }

  return lines.join("\n").trim() + "\n";
}

function formatWatchUrl(base: string | undefined, startTime: number): string | undefined {
  if (!base) return undefined;
  return `${base}?t=${Math.max(0, Math.floor(startTime))}`;
}

function buildCompanyLookup(participants: Array<{ name: string; company?: string }>): Map<string, string> {
  const map = new Map<string, string>();
  for (const participant of participants) {
    if (!participant.name || !participant.company) continue;
    map.set(participant.name.toLowerCase(), participant.company);
  }
  return map;
}

function formatSpeakerLabel(name: string, companies: Map<string, string>): string {
  const company = companies.get(name.toLowerCase());
  return company ? `${name} (${company})` : name;
}

function formatChapterLine(chapter: { title: string; startTime: number }, watchBase?: string): string {
  const stamp = formatDuration(chapter.startTime);
  const watch = formatWatchUrl(watchBase, chapter.startTime);
  const tail = watch ? ` - WATCH: ${watch}` : "";
  return `  BOOKMARK [${stamp}]: ${chapter.title}${tail}`;
}

function formatHighlightLine(
  moment: { startTime: number; speaker?: string; quote?: string; label: SentimentLabel },
  watchBase?: string
): string {
  const stamp = formatDuration(moment.startTime);
  const who = moment.speaker ? ` ${moment.speaker} —` : "";
  const text = moment.quote ? `"${moment.quote}"` : `(${moment.label} moment)`;
  const watch = formatWatchUrl(watchBase, moment.startTime);
  const tail = watch ? ` - WATCH: ${watch}` : "";
  return `  HIGHLIGHT [${stamp}]${who} ${text}${tail}`;
}

function formatLengthLong(seconds: number): string {
  const total = Math.round(seconds);
  if (total < 60) return `${total} sec${total === 1 ? "" : "s"}`;
  const minutes = Math.round(total / 60);
  if (minutes < 60) return `${minutes} min${minutes === 1 ? "" : "s"}`;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return remaining === 0 ? `${hours} hr${hours === 1 ? "" : "s"}` : `${hours} hr ${remaining} min`;
}

function formatLongDate(iso: string | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
}
