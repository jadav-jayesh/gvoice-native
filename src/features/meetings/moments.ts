import type { Meeting, SentimentMoment } from "../../core/api/types";

// Ported from web MeetingDetailPage deriveMoments: prefer the AI topMoments,
// else derive from diarized segments whose |sentiment.score| >= 0.15, capped to
// 2 per speaker and 5 total, in chronological order.
export function deriveMoments(meeting: Meeting): SentimentMoment[] {
  const top = meeting.sentimentSummary?.topMoments ?? [];
  if (top.length > 0) return top;

  const perSpeaker: Record<string, number> = {};
  const out: SentimentMoment[] = [];
  for (const seg of meeting.diarizedTranscript ?? []) {
    const s = seg.sentiment;
    if (!s || Math.abs(s.score) < 0.15) continue;
    const speaker = seg.speaker || "";
    if ((perSpeaker[speaker] ?? 0) >= 2) continue;
    perSpeaker[speaker] = (perSpeaker[speaker] ?? 0) + 1;
    out.push({
      startTime: seg.startTime,
      endTime: seg.endTime,
      label: s.label,
      score: s.score,
      quote: seg.text,
      speaker
    });
    if (out.length >= 5) break;
  }
  return out.sort((a, b) => a.startTime - b.startTime);
}
