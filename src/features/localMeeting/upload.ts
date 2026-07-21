import { nativeCookieStore } from "../../core/api/cookieStore";
import { API_BASE_URL } from "../../core/config";

// Upload a locally-recorded in-person meeting. Multipart via fetch + FormData so
// the native cookie jar carries the session cookies; the csrf cookie is echoed
// as a header (same double-submit scheme as the rest of the API). Content-Type
// is left unset so fetch adds the multipart boundary itself.
export async function uploadLocalMeeting(opts: {
  fileUri: string;
  meetingName: string;
  participants: string[];
}): Promise<{ sessionId: string; status: string }> {
  const csrf = await nativeCookieStore.getCookie("csrf");
  const form = new FormData();
  // React Native's FormData accepts a {uri,name,type} file part.
  form.append("audio", { uri: opts.fileUri, name: "recording.m4a", type: "audio/m4a" } as unknown as Blob);
  form.append("meetingName", opts.meetingName);
  form.append("participants", JSON.stringify(opts.participants));

  const res = await fetch(`${API_BASE_URL}/api/meetings/local`, {
    method: "POST",
    credentials: "include",
    headers: csrf ? { "X-CSRF-Token": csrf } : undefined,
    body: form
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Upload failed (${res.status})${body ? ` — ${body}` : ""}`);
  }
  return res.json() as Promise<{ sessionId: string; status: string }>;
}
