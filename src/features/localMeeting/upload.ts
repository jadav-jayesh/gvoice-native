import { FileSystemUploadType, uploadAsync } from "expo-file-system/legacy";
import { performRefresh } from "../../core/api/client";
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
  // uploadAsync doesn't share the app's cookie jar, so attach the session
  // cookies (token/refresh/csrf) + the csrf header explicitly. It also
  // bypasses client.ts's 401→refresh→retry, so replicate it here: on a 401,
  // refresh the session once and retry with the fresh cookies.
  const doUpload = async () => {
    const cookieHeader = await nativeCookieStore.getCookieHeader();
    const csrf = await nativeCookieStore.getCookie("csrf");
    const headers: Record<string, string> = {};
    if (cookieHeader) headers.Cookie = cookieHeader;
    if (csrf) headers["X-CSRF-Token"] = csrf;

    return uploadAsync(`${API_BASE_URL}/api/meetings/local`, opts.fileUri, {
      httpMethod: "POST",
      uploadType: FileSystemUploadType.MULTIPART,
      fieldName: "audio",
      mimeType: "audio/m4a",
      parameters: {
        meetingName: opts.meetingName,
        participants: JSON.stringify(opts.participants)
      },
      headers
    });
  };

  let res = await doUpload();
  if (res.status === 401 && (await performRefresh())) {
    res = await doUpload();
  }

  if (res.status < 200 || res.status >= 300) {
    throw new Error(`Upload failed (${res.status})${res.body ? ` — ${res.body}` : ""}`);
  }
  return JSON.parse(res.body) as { sessionId: string; status: string };
}
