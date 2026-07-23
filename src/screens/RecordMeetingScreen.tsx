import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState
} from "expo-audio";
import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Animated, Easing, Pressable, TextInput, View } from "react-native";
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

const BAR_COUNT = 36;

// Map the recorder's metering value (dB, roughly -60..0) to a 0..1 bar height.
function levelFromDb(db: number | undefined): number {
  if (typeof db !== "number" || !isFinite(db)) return 0.08;
  const v = (db + 50) / 50;
  return Math.min(1, Math.max(0.08, v));
}

// Pulsing red dot — the universal "REC" live indicator.
function RecDot({ color }: { color: string }) {
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: true })
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);
  return (
    <Animated.View
      style={{
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: color,
        opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 0.35] })
      }}
    />
  );
}

// Expanding halo behind the stop button so "live" is unmissable.
function Halo({ color }: { color: string }) {
  const ring = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(ring, { toValue: 1, duration: 1600, easing: Easing.out(Easing.quad), useNativeDriver: true })
    );
    loop.start();
    return () => loop.stop();
  }, [ring]);
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: "absolute",
        width: 96,
        height: 96,
        borderRadius: 48,
        borderWidth: 2,
        borderColor: color,
        opacity: ring.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 0.5, 0] }),
        transform: [{ scale: ring.interpolate({ inputRange: [0, 1], outputRange: [1, 1.65] }) }]
      }}
    />
  );
}

export function RecordMeetingScreen({ navigation }: Props) {
  const { theme } = useTheme();
  // Metering feeds the live waveform — without it the screen can't prove
  // audio is actually being captured.
  const recorder = useAudioRecorder({ ...RecordingPresets.HIGH_QUALITY, isMeteringEnabled: true });
  const recorderState = useAudioRecorderState(recorder, 150);

  const [phase, setPhase] = useState<Phase>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [title, setTitle] = useState("");
  const [participants, setParticipants] = useState<string[]>([]);
  const [nameInput, setNameInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [granted, setGranted] = useState<boolean | null>(null);
  const [bars, setBars] = useState<number[]>(() => Array(BAR_COUNT).fill(0.08));
  const levelsRef = useRef<number[]>(Array(BAR_COUNT).fill(0.08));
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
      deactivateKeepAwake();
    };
  }, []);

  // Rolling waveform: push the newest mic level, drop the oldest.
  useEffect(() => {
    if (phase !== "recording") return;
    const next = [...levelsRef.current.slice(1), levelFromDb(recorderState.metering)];
    levelsRef.current = next;
    setBars(next);
  }, [recorderState.metering, phase]);

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
      // Keep the screen on so an auto screen-timeout lock can't suspend the app
      // and stop the recording mid-meeting.
      await activateKeepAwakeAsync();
      levelsRef.current = Array(BAR_COUNT).fill(0.08);
      setBars(levelsRef.current);
      setPhase("recording");
      startTimer();
    } catch {
      setError("Couldn't start recording.");
    }
  }

  async function stopAndUpload() {
    stopTimer();
    deactivateKeepAwake();
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
  const uploading = phase === "uploading";
  const displayTitle = title.trim() || "In-person meeting";

  return (
    <Screen scroll contentStyle={{ gap: 16 }}>
      {phase === "idle" ? (
        <>
          <Text variant="title">Record in-person</Text>
          <Text tone="mute">
            Capture a face-to-face meeting. We'll transcribe it and build the summary, action items and MoM — same as
            any meeting.
          </Text>

          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Meeting title (optional)"
            placeholderTextColor={theme.color.inkFaint}
            style={input}
          />

          <View>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <TextInput
                value={nameInput}
                onChangeText={setNameInput}
                placeholder="Add a participant name"
                placeholderTextColor={theme.color.inkFaint}
                onSubmitEditing={addName}
                style={[input, { flex: 1 }]}
              />
              <Button title="Add" variant="secondary" onPress={addName} />
            </View>
            {participants.length > 0 ? (
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
                {participants.map((n) => (
                  <Pressable
                    key={n}
                    onPress={() => setParticipants((p) => p.filter((x) => x !== n))}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                      backgroundColor: theme.color.surfaceHi,
                      borderRadius: 999,
                      paddingHorizontal: 12,
                      paddingVertical: 6
                    }}
                  >
                    <Text variant="label">{n}</Text>
                    <Icon name="Close" size={13} color={theme.color.inkMute} />
                  </Pressable>
                ))}
              </View>
            ) : null}
          </View>

          <View style={{ alignItems: "center", marginTop: 12, gap: 14 }}>
            <Pressable
              onPress={start}
              style={{
                width: 96,
                height: 96,
                borderRadius: 48,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: theme.color.accent
              }}
            >
              <Icon name="Mic" size={40} color="#fff" />
            </Pressable>
            <Text tone="mute" variant="label">
              Tap to start recording
            </Text>
            {error ? (
              <Text tone="danger" variant="label">
                {error}
              </Text>
            ) : null}
          </View>
        </>
      ) : null}

      {recording ? (
        <>
          {/* Status card: REC pill + timer + live waveform */}
          <View
            style={{
              borderRadius: theme.radii.lg,
              borderWidth: 1,
              borderColor: theme.color.line,
              backgroundColor: theme.color.surface,
              padding: 20,
              alignItems: "center",
              gap: 16,
              marginTop: 4
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                paddingHorizontal: 14,
                paddingVertical: 7,
                borderRadius: 999,
                backgroundColor: "rgba(239,68,68,0.12)"
              }}
            >
              <RecDot color={theme.color.danger} />
              <Text variant="label" style={{ color: theme.color.danger, letterSpacing: 1.5 }}>
                RECORDING
              </Text>
            </View>

            <Text style={{ fontSize: 54, fontWeight: "700", color: theme.color.ink, fontVariant: ["tabular-nums"] }}>
              {formatDuration(elapsed)}
            </Text>

            {/* Live mic levels — proof audio is being captured */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 3,
                height: 64,
                paddingHorizontal: 8
              }}
            >
              {bars.map((b, i) => (
                <View
                  key={i}
                  style={{
                    width: 4,
                    borderRadius: 2,
                    height: Math.max(5, b * 64),
                    backgroundColor: i === bars.length - 1 ? theme.color.accent : theme.color.accent + "99"
                  }}
                />
              ))}
            </View>

            <Text variant="caption" tone="mute">
              Listening… keep the phone near whoever is speaking.
            </Text>
          </View>

          {/* What's being recorded */}
          <View
            style={{
              borderRadius: theme.radii.md,
              backgroundColor: theme.color.surfaceHi,
              paddingHorizontal: 14,
              paddingVertical: 12,
              gap: 6
            }}
          >
            <Text variant="label" tone="mute">
              MEETING
            </Text>
            <Text variant="body">{displayTitle}</Text>
            {participants.length > 0 ? (
              <Text variant="caption" tone="mute">
                {participants.join(" · ")}
              </Text>
            ) : null}
          </View>

          {/* Stop control */}
          <View style={{ alignItems: "center", marginTop: 8, gap: 14 }}>
            <View style={{ alignItems: "center", justifyContent: "center" }}>
              <Halo color={theme.color.danger} />
              <Pressable
                onPress={stopAndUpload}
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: 48,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: theme.color.danger
                }}
              >
                {/* Square = stop, the universal affordance */}
                <View style={{ width: 30, height: 30, borderRadius: 6, backgroundColor: "#fff" }} />
              </Pressable>
            </View>
            <Text tone="mute" variant="label">
              Tap to stop &amp; upload
            </Text>
            <Text variant="caption" tone="mute">
              Screen stays awake while recording.
            </Text>
          </View>
        </>
      ) : null}

      {uploading ? (
        <View
          style={{
            borderRadius: theme.radii.lg,
            borderWidth: 1,
            borderColor: theme.color.line,
            backgroundColor: theme.color.surface,
            padding: 24,
            alignItems: "center",
            gap: 14,
            marginTop: 12
          }}
        >
          <ActivityIndicator size="large" color={theme.color.accent} />
          <Text variant="body" style={{ fontWeight: "600" }}>
            Uploading recording…
          </Text>
          <Text variant="caption" tone="mute" style={{ textAlign: "center" }}>
            {formatDuration(elapsed)} of audio · "{displayTitle}"{"\n"}
            Transcription and summary start automatically after upload.
          </Text>
          {error ? (
            <Text tone="danger" variant="label">
              {error}
            </Text>
          ) : null}
        </View>
      ) : null}
    </Screen>
  );
}
