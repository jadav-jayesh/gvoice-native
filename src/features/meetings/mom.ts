import type { Meeting, MomReport } from "../../core/api/types";

// Ported from web lib/mom.ts buildLocalFallback. When a meeting has no AI
// momReport, we synthesize an equivalent shape from summary/sentiment/chapters/
// actions/participants so the native MoM view always has something to render.
function buildLocalFallback(meeting: Meeting): MomReport {
  const score = meeting.sentimentSummary?.overall.score ?? 0;
  const positive = Math.round(Math.min(90, Math.max(25, 57.5 + score * 32.5)));
  const concerns = Math.round(Math.min(50, Math.max(5, 15 - score * 15)));
  const neutral = Math.max(0, 100 - positive - concerns);
  return {
    executiveSummary: meeting.summary?.trim() || "No AI summary available for this session.",
    toneBreakdown: { positive, neutral, concerns },
    notableQuotes: (meeting.sentimentSummary?.topMoments ?? [])
      .filter((m) => m.quote)
      .slice(0, 3)
      .map((m) => ({ text: m.quote as string, speaker: m.speaker ?? "" })),
    positives: [],
    concerns: [],
    momSections: (meeting.chapters ?? []).map((chapter, index) => ({
      index,
      tag: "Topic",
      topic: chapter.title,
      body: ""
    })),
    actionItems: meeting.actionItems.map((item) => ({
      task: item.task,
      owners: item.assignee ? [item.assignee] : [],
      priority: "medium" as const,
      status: "open" as const
    })),
    topTodos: [],
    risks: [],
    nextSteps: [],
    attendees: meeting.participants.map((p) => ({ name: p.name, role: p.company })),
    generatedAt: new Date().toISOString(),
    source: "fallback"
  };
}

// Real report when present, otherwise the local fallback.
export function resolveMom(meeting: Meeting): MomReport {
  return meeting.momReport ?? buildLocalFallback(meeting);
}
