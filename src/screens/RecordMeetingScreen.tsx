import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AudioModule, RecordingPresets, setAudioModeAsync, useAudioRecorder } from "expo-audio";
import React, { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { formatDuration } from "../core/lib/format";
import { useTheme } from "../core/theme/ThemeProvider";
import { Button } from "../ui/Button";
import { Icon } from "../ui/Icon";
import { Screen } from "../ui/Screen";
import { Text } from "../ui/Text";
import { uploadLocalMeeting } from "../features/localMeeting/upload";
import type { MeetingsStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<MeetingsStackParamList, "RecordMeeting">;
type Phase = "idle" | "recording" | "uploading";

export function RecordMeetingScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

  const [phase, setPhase] = useState<Phase>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [title, setTitle] = useState("");
  const [participants, setParticipants] = useState<string[]>([]);
  const [nameInput, setNameInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [granted, setGranted] = useState<boolean | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    (async () => {
      const perm = await AudioModule.requestRecordingPermissionsAsync();
      setGranted(perm.granted);
      if (perm.granted) {
        await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true }).catch(() => undefined);
      }
    })();
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, []);

  function startTimer() {
    setElapsed(0);
    timer.current = setInterval(() => setElapsed((e) => e + 1), 1000);
  }
  function stopTimer() {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
  }

  async function start() {
    setError(null);
    try {
      await recorder.prepareToRecordAsync();
      recorder.record();
      setPhase("recording");
      startTimer();
    } catch {
      setError("Couldn't start recording.");
    }
  }

  async function stopAndUpload() {
    stopTimer();
    setPhase("uploading");
    try {
      await recorder.stop();
      const uri = recorder.uri;
      if (!uri) throw new Error("no recording produced");
      const res = await uploadLocalMeeting({
        fileUri: uri,
        meetingName: title.trim() || "In-person meeting",
        participants
      });
      navigation.replace("MeetingDetail", { sessionId: res.sessionId, title: title.trim() || "In-person meeting" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
      setPhase("idle");
    }
  }

  function addName() {
    const n = nameInput.trim();
    if (n && !participants.includes(n)) setParticipants((p) => [...p, n]);
    setNameInput("");
  }

  const input = {
    height: 46,
    borderWidth: 1,
    borderColor: theme.color.line,
    borderRadius: theme.radii.md,
    paddingHorizontal: 14,
    color: theme.color.ink,
    backgroundColor: theme.color.surface,
    fontSize: theme.fontSize.md
  };

  if (granted === false) {
    return (
      <Screen scroll>
        <Text variant="title">Microphone needed</Text>
        <Text tone="mute" style={{ marginTop: 8 }}>
          Enable microphone access in Settings to record in-person meetings.
        </Text>
      </Screen>
    );
  }

  const recording = phase === "recording";

  return (
    <Screen scroll contentStyle={{ gap: 16 }}>
      <Text variant="title">Record in-person</Text>
      <Text tone="mute">
        Capture a face-to-face meeting. We'll transcribe it and build the summary, action items and MoM — same as any meeting.
      </Text>

      {/* Title + participants (locked while recording/uploading) */}
      <TextInput
        value={title}
        onChangeText={setTitle}
        editable={phase === "idle"}
        placeholder="Meeting title (optional)"
        placeholderTextColor={theme.color.inkFaint}
        style={input}
      />

      <View>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <TextInput
            value={nameInput}
            onChangeText={setNameInput}
            editable={phase === "idle"}
            placeholder="Add a participant name"
            placeholderTextColor={theme.color.inkFaint}
            onSubmitEditing={addName}
            style={[input, { flex: 1 }]}
          />
          <Button title="Add" variant="secondary" onPress={addName} disabled={phase !== "idle"} />
        </View>
        {participants.length > 0 ? (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
            {participants.map((n) => (
              <Pressable
                key={n}
                onPress={() => phase === "idle" && setParticipants((p) => p.filter((x) => x !== n))}
                style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: theme.color.surfaceHi, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 }}
              >
                <Text variant="label">{n}</Text>
                {phase === "idle" ? <Icon name="Close" size={13} color={theme.color.inkMute} /> : null}
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>

      {/* Record control */}
      <View style={{ alignItems: "center", marginTop: 12, gap: 14 }}>
        <Text style={{ fontSize: 44, fontWeight: "700", color: theme.color.ink, fontVariant: ["tabular-nums"] }}>
          {formatDuration(elapsed)}
        </Text>
        <Pressable
          onPress={phase === "uploading" ? undefined : recording ? stopAndUpload : start}
          disabled={phase === "uploading"}
          style={{
            width: 96,
            height: 96,
            borderRadius: 48,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: recording ? theme.color.danger : theme.color.accent,
            opacity: phase === "uploading" ? 0.6 : 1
          }}
        >
          <Icon name={recording ? "Pause" : "Mic"} size={40} color="#fff" />
        </Pressable>
        <Text tone="mute" variant="label">
          {phase === "uploading" ? "Uploading & processing…" : recording ? "Tap to stop & upload" : "Tap to start recording"}
        </Text>
        {error ? (
          <Text tone="danger" variant="label">
            {error}
          </Text>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({});
