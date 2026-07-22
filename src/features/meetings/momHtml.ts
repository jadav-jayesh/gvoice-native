import type { Meeting } from "../../core/api/types";
import { resolveMom } from "./mom";

// Build a self-contained, styled HTML document of the full Minutes of Meeting.
// Mirrors the web MoM download so a file exported from the phone reads the same
// as one downloaded from the web app. No external assets — safe to open offline
// in any browser or attach to an email.

const esc = (s: unknown): string =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

// Prose fields from the AI sometimes carry inline formatting (<strong>, <em>,
// <br>). Escape everything for safety, then restore only that small whitelist
// so the exported document renders bold/italic instead of showing literal tags.
const rich = (s: unknown): string =>
  esc(s)
    .replace(/&lt;(\/?)(strong|b|em|i)&gt;/gi, "<$1$2>")
    .replace(/&lt;br\s*\/?&gt;/gi, "<br>");

/** Filesystem-safe base name derived from the meeting title. */
export function momFileBase(meeting: Meeting): string {
  const raw = meeting.meetingName?.trim() || "meeting";
  return (
    raw
      .replace(/[^\w\-\s.]+/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .slice(0, 60) || "meeting"
  );
}

export function buildMomHtml(meeting: Meeting): string {
  const r = resolveMom(meeting);
  const title = meeting.meetingName?.trim() || "Untitled meeting";
  const date = new Date(meeting.endedAt ?? meeting.startedAt ?? meeting.createdAt ?? r.generatedAt);
  const dateStr = Number.isNaN(date.getTime()) ? "" : date.toLocaleString();

  const section = (heading: string, inner: string): string =>
    inner.trim() ? `<section><h2>${esc(heading)}</h2>${inner}</section>` : "";

  const purpose = r.meetingPurpose?.trim()
    ? `<p class="lead">${rich(r.meetingPurpose)}</p>`
    : "";

  const takeaways = (r.keyTakeaways ?? []).filter((k) => k.title).length
    ? `<ul>${r.keyTakeaways!
        .filter((k) => k.title)
        .map((k) => `<li><strong>${esc(k.title)}</strong>${k.detail ? ` — ${rich(k.detail)}` : ""}</li>`)
        .join("")}</ul>`
    : "";

  const tone = `
    <table class="tone">
      <tr><td>Positive</td><td>${r.toneBreakdown.positive}%</td></tr>
      <tr><td>Neutral</td><td>${r.toneBreakdown.neutral}%</td></tr>
      <tr><td>Concerns</td><td>${r.toneBreakdown.concerns}%</td></tr>
    </table>`;

  const quotes = r.notableQuotes.length
    ? r.notableQuotes
        .map(
          (q) =>
            `<blockquote>“${rich(q.text)}”<footer>${esc(q.speaker)}${q.company ? `, ${esc(q.company)}` : ""}</footer></blockquote>`
        )
        .join("")
    : "";

  const topics = r.momSections.length
    ? r.momSections
        .map(
          (s) =>
            `<div class="topic"><span class="tag">${esc(s.tag || "Topic")}</span><h3>${esc(s.topic)}</h3>${s.body ? `<p>${rich(s.body)}</p>` : ""}</div>`
        )
        .join("")
    : "";

  const actions = r.actionItems.length
    ? `<table class="grid">
        <thead><tr><th>Task</th><th>Owner</th><th>Priority</th><th>Status</th></tr></thead>
        <tbody>${r.actionItems
          .map((a) => {
            const owner = (a.owners && a.owners.length ? a.owners.join(", ") : a.owner) || "—";
            return `<tr><td>${rich(a.task)}${a.detail ? `<br><span class="muted">${rich(a.detail)}</span>` : ""}</td><td>${esc(owner)}</td><td>${esc(a.priority ?? "—")}</td><td>${esc(a.status ?? "—")}</td></tr>`;
          })
          .join("")}</tbody>
      </table>`
    : "";

  const risks = r.risks.length
    ? `<ul>${r.risks
        .map(
          (x) =>
            `<li><strong>[${esc(x.severity)}]</strong> ${esc(x.title)}${x.detail ? ` — ${rich(x.detail)}` : ""}${x.owner ? ` <span class="muted">(${esc(x.owner)})</span>` : ""}</li>`
        )
        .join("")}</ul>`
    : "";

  const nextSteps = r.nextSteps.length
    ? `<ul>${r.nextSteps
        .map((n) => `<li><strong>${esc(n.period)}:</strong> ${esc(n.title)}${n.detail ? ` — ${rich(n.detail)}` : ""}</li>`)
        .join("")}</ul>`
    : "";

  const attendees = r.attendees.length
    ? `<ul class="cols">${r.attendees
        .map((p) => `<li>${esc(p.name)}${p.role ? ` <span class="muted">— ${esc(p.role)}</span>` : ""}</li>`)
        .join("")}</ul>`
    : "";

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)} — Minutes</title>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body { font-family: -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #0f172a; background: #fff; margin: 0; padding: 32px 20px; line-height: 1.6; }
  .doc { max-width: 760px; margin: 0 auto; }
  header.top { border-bottom: 3px solid #06b6d4; padding-bottom: 16px; margin-bottom: 8px; }
  header.top h1 { margin: 0 0 6px; font-size: 26px; }
  header.top .meta { color: #475569; font-size: 13px; }
  section { margin-top: 28px; }
  h2 { font-size: 18px; border-left: 4px solid #06b6d4; padding-left: 10px; margin: 0 0 12px; }
  h3 { font-size: 15px; margin: 4px 0; }
  p { margin: 8px 0; }
  p.lead { font-size: 16px; color: #0f172a; }
  ul { margin: 8px 0; padding-left: 20px; }
  ul.cols { columns: 2; }
  li { margin: 4px 0; }
  .muted { color: #64748b; }
  blockquote { margin: 12px 0; padding: 10px 14px; background: #f1f5f9; border-left: 3px solid #94a3b8; border-radius: 4px; }
  blockquote footer { margin-top: 6px; color: #475569; font-size: 13px; }
  .topic { padding: 10px 0; border-bottom: 1px solid #e2e8f0; }
  .tag { display: inline-block; background: #cffafe; color: #0e7490; font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 999px; }
  table { border-collapse: collapse; width: 100%; font-size: 14px; }
  table.grid th, table.grid td { border: 1px solid #e2e8f0; padding: 8px 10px; text-align: left; vertical-align: top; }
  table.grid th { background: #f8fafc; }
  table.tone td { padding: 4px 0; }
  table.tone td:last-child { text-align: right; font-weight: 600; }
  footer.foot { margin-top: 36px; padding-top: 12px; border-top: 1px solid #e2e8f0; color: #94a3b8; font-size: 12px; }
</style>
</head>
<body>
<div class="doc">
  <header class="top">
    <h1>${esc(title)}</h1>
    <div class="meta">Minutes of Meeting${dateStr ? ` · ${esc(dateStr)}` : ""}</div>
  </header>
  ${section("Meeting purpose", purpose)}
  ${section("Key takeaways", takeaways)}
  ${section("Executive summary", `<p>${rich(r.executiveSummary)}</p>`)}
  ${section("Sentiment", tone)}
  ${section("Notable quotes", quotes)}
  ${section("Discussion topics", topics)}
  ${section("Action items", actions)}
  ${section("Risks", risks)}
  ${section("Next steps", nextSteps)}
  ${section("Attendees", attendees)}
  <footer class="foot">Generated by gVoice${r.source === "fallback" ? " (summary-based)" : ""} · ${esc(new Date(r.generatedAt).toLocaleString())}</footer>
</div>
</body>
</html>`;
}
