import { Platform } from "react-native";
import ReactNativeBlobUtil from "react-native-blob-util";
import { cacheDirectory, writeAsStringAsync, EncodingType } from "expo-file-system/legacy";
import { isAvailableAsync, shareAsync } from "expo-sharing";
import type { Meeting } from "../../core/api/types";
import { buildMomHtml, momFileBase } from "./momHtml";

export interface DownloadResult {
  savedTo: string; // human-friendly location, or "" when it went through the share sheet
}

// Save the MoM as an HTML file straight into the phone's public Downloads
// folder — no prompt, no share sheet. Android uses MediaStore (works on
// Android 10+ without any storage permission). iOS has no public Downloads,
// so it falls back to the share sheet ("Save to Files").
export async function downloadMomHtml(meeting: Meeting): Promise<DownloadResult> {
  const html = buildMomHtml(meeting);
  const fileName = `${momFileBase(meeting)}-MOM.html`;

  if (Platform.OS === "android") {
    // Write a temp copy, then hand it to MediaStore's Downloads collection.
    const tmp = `${ReactNativeBlobUtil.fs.dirs.CacheDir}/${fileName}`;
    await ReactNativeBlobUtil.fs.writeFile(tmp, html, "utf8");
    try {
      await ReactNativeBlobUtil.MediaCollection.copyToMediaStore(
        { name: fileName, parentFolder: "", mimeType: "text/html" },
        "Download",
        tmp
      );
    } finally {
      await ReactNativeBlobUtil.fs.unlink(tmp).catch(() => undefined);
    }
    return { savedTo: "Downloads" };
  }

  // iOS / other: save into the app cache and let the OS "Save to Files".
  const uri = `${cacheDirectory}${fileName}`;
  await writeAsStringAsync(uri, html, { encoding: EncodingType.UTF8 });
  if (!(await isAvailableAsync())) throw new Error("Saving isn't available on this device.");
  await shareAsync(uri, { mimeType: "text/html", dialogTitle: "Save Minutes of Meeting", UTI: "public.html" });
  return { savedTo: "" };
}
