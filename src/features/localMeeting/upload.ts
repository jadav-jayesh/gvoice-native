import { FileSystemUploadType, uploadAsync } from "expo-file-system/legacy";
import { nativeCookieStore } from "../../core/api/cookieStore";
import { API_BASE_URL } from "../../core/config";

// Upload a locally-recorded in-person meeting.
//
// Uses expo-file-system's native multipart upload instead of fetch + FormData:
// on React Native's new architecture a FormData file part (`{uri,...}`) throws
// "Unsupported FormDataPart implementation". uploadAsync streams the file
// natively (OkHttp/NSURLSession), which also carries the session cookies from
// the native jar; the csrf cookie is echoed as a header. `meetingName` and
// `participants` ride along as multipart text fields.
export async function uploadLocalMeeting(opts: {
  fileUri: string;
  meetingName: string;
  participants: string[];
}): Promise<{ sessionId: string; status: string }> {
  const csrf = await nativeCookieStore.getCookie("csrf");

  const res = await uploadAsync(`${API_BASE_URL}/api/meetings/local`, opts.fileUri, {
    httpMethod: "POST",
    uploadType: FileSystemUploadType.MULTIPART,
    fieldName: "audio",
    mimeType: "audio/m4a",
    parameters: {
      meetingName: opts.meetingName,
      participants: JSON.stringify(opts.participants)
    },
    headers: csrf ? { "X-CSRF-Token": csrf } : {}
  });

  if (res.status < 200 || res.status >= 300) {
    throw new Error(`Upload failed (${res.status})${res.body ? ` — ${res.body}` : ""}`);
  }
  return JSON.parse(res.body) as { sessionId: string; status: string };
}
