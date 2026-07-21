import React, { useState } from "react";
import { TextInput, View } from "react-native";
import { createBotSession } from "../../core/api/endpoints";
import type { BotPlatform } from "../../core/api/types";
import { useTheme } from "../../core/theme/ThemeProvider";
import { Button } from "../../ui/Button";
import { Segmented } from "../../ui/Segmented";
import { Sheet } from "../../ui/Sheet";
import { Text } from "../../ui/Text";

// Joinable platforms only — in-person is captured via the recorder, not a URL join.
type JoinPlatform = Exclude<BotPlatform, "in_person">;

const SAMPLE: Record<JoinPlatform, string> = {
  google_meet: "https://meet.google.com/abc-defg-hij",
  microsoft_teams: "https://teams.microsoft.com/l/meetup-join/…",
  zoom: "https://zoom.us/j/1234567890"
};
const URL_RE = /^https?:\/\/[^\s/$.?#].[^\s]*$/;

// Ported from web JoinMeetingModal: platform + URL (+ Zoom passcode) -> createBotSession.
export function JoinMeetingSheet({
  visible,
  onClose,
  onCreated
}: {
  visible: boolean;
  onClose: () => void;
  onCreated: (sessionId: string) => void;
}) {
  const { theme } = useTheme();
  const [platform, setPlatform] = useState<JoinPlatform>("google_meet");
  const [url, setUrl] = useState("");
  const [passcode, setPasscode] = useState("");
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const urlError = touched && (!url.trim() ? "Meeting URL is required" : !URL_RE.test(url.trim()) ? "Enter a valid http(s) URL" : null);

  async function submit() {
    setTouched(true);
    setServerError(null);
    setInfo(null);
    if (!url.trim() || !URL_RE.test(url.trim())) return;
    setBusy(true);
    try {
      const res = await createBotSession({
        platform,
        meetingUrl: url.trim(),
        meetingPasscode: platform === "zoom" ? passcode.trim() || undefined : undefined
      });
      if (res.attached) {
        setInfo("A gVoice bot is already recording this meeting. No second bot was added.");
      } else {
        onCreated(res.sessionId);
      }
    } catch (e) {
      setServerError(e instanceof Error ? e.message.replace(/^\d+\s.*?—\s/, "") : "Couldn't start the bot. Try again.");
    } finally {
      setBusy(false);
    }
  }

  const input = {
    height: 48,
    borderWidth: 1,
    borderColor: theme.color.line,
    borderRadius: theme.radii.md,
    paddingHorizontal: 14,
    color: theme.color.ink,
    backgroundColor: theme.color.surface,
    fontSize: theme.fontSize.md
  };

  return (
    <Sheet visible={visible} onClose={onClose} eyebrow="New session" title="Join a meeting">
      <Text tone="mute" variant="body" style={{ marginBottom: 16 }}>
        Paste a meeting link — we'll spin up a bot and capture the transcript.
      </Text>

      {serverError ? (
        <Text tone="danger" variant="label" style={{ marginBottom: 12 }}>
          {serverError}
        </Text>
      ) : null}
      {info ? (
        <Text variant="label" style={{ color: theme.color.success, marginBottom: 12 }}>
          {info}
        </Text>
      ) : null}

      <Text variant="label" tone="mute" style={{ marginBottom: 8 }}>
        Platform
      </Text>
      <Segmented<JoinPlatform>
        value={platform}
        onChange={setPlatform}
        options={[
          { value: "google_meet", label: "Meet" },
          { value: "microsoft_teams", label: "Teams" },
          { value: "zoom", label: "Zoom" }
        ]}
      />

      <Text variant="label" tone="mute" style={{ marginTop: 16, marginBottom: 8 }}>
        Meeting URL
      </Text>
      <TextInput
        value={url}
        onChangeText={setUrl}
        placeholder={SAMPLE[platform]}
        placeholderTextColor={theme.color.inkFaint}
        autoCapitalize="none"
        keyboardType="url"
        style={input}
      />
      {urlError ? (
        <Text tone="danger" variant="caption" style={{ marginTop: 6 }}>
          {urlError}
        </Text>
      ) : null}

      {platform === "zoom" ? (
        <>
          <Text variant="label" tone="mute" style={{ marginTop: 16, marginBottom: 8 }}>
            Passcode (optional)
          </Text>
          <TextInput
            value={passcode}
            onChangeText={setPasscode}
            placeholder="Zoom passcode if the link needs one"
            placeholderTextColor={theme.color.inkFaint}
            autoCapitalize="none"
            style={input}
          />
        </>
      ) : null}

      <View style={{ flexDirection: "row", gap: 10, marginTop: 20 }}>
        <View style={{ flex: 1 }}>
          <Button title="Cancel" variant="ghost" onPress={onClose} />
        </View>
        <View style={{ flex: 1 }}>
          <Button title="Join meeting" onPress={submit} loading={busy} />
        </View>
      </View>
    </Sheet>
  );
}
