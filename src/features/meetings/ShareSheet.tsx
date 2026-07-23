import React, { useState } from "react";
import { Share, View } from "react-native";
import { API_BASE_URL } from "../../core/config";
import { UnauthorizedError } from "../../core/api/client";
import { createShareLink, revokeShareLink } from "../../core/api/endpoints";
import { useTheme } from "../../core/theme/ThemeProvider";
import { Button } from "../../ui/Button";
import { Sheet } from "../../ui/Sheet";
import { Text } from "../../ui/Text";

// Turn a transport error into a message the user can act on. The raw status is
// kept (shortened) so QA reports pinpoint the failing case instead of a
// generic "try again".
function shareErrorMessage(e: unknown, action: "create" | "revoke"): string {
  if (e instanceof UnauthorizedError) return "Your session expired. Please sign in again.";
  const msg = e instanceof Error ? e.message : "";
  if (msg.includes("csrf_invalid")) return "Security check failed. Close and reopen the app, then try again.";
  if (msg.startsWith("403")) return "You don't have permission to share this meeting.";
  if (msg.startsWith("404")) return "This meeting wasn't found on the server.";
  if (e instanceof TypeError) return "Network error. Check your connection and try again.";
  const fallback = action === "create" ? "Couldn't create the link." : "Couldn't revoke the link.";
  return `${fallback}${msg ? ` (${msg.slice(0, 120)})` : " Try again."}`;
}

// Ported from web ShareControl: create / share / revoke a public link.
export function ShareSheet({
  visible,
  onClose,
  sessionId,
  initialEnabled,
  initialToken
}: {
  visible: boolean;
  onClose: () => void;
  sessionId: string;
  initialEnabled?: boolean;
  initialToken?: string;
}) {
  const { theme } = useTheme();
  const urlFrom = (token?: string | null) => (token ? `${API_BASE_URL}/share/${token}` : null);
  const [enabled, setEnabled] = useState(!!(initialEnabled && initialToken));
  const [url, setUrl] = useState<string | null>(enabled ? urlFrom(initialToken) : null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create() {
    setBusy(true);
    setError(null);
    try {
      const res = await createShareLink(sessionId);
      setEnabled(res.enabled);
      setUrl(res.url ?? urlFrom(res.token));
    } catch (e) {
      setError(shareErrorMessage(e, "create"));
    } finally {
      setBusy(false);
    }
  }

  async function revoke() {
    setBusy(true);
    setError(null);
    try {
      await revokeShareLink(sessionId);
      setEnabled(false);
      setUrl(null);
    } catch (e) {
      setError(shareErrorMessage(e, "revoke"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet visible={visible} onClose={onClose} eyebrow="Share" title="Public link">
      <Text tone="mute" variant="body" style={{ marginBottom: 16 }}>
        Anyone with the link can view this meeting's summary, transcript and recording without signing in.
      </Text>

      {error ? (
        <Text tone="danger" variant="label" style={{ marginBottom: 12 }}>
          {error}
        </Text>
      ) : null}

      {enabled && url ? (
        <View style={{ gap: 12 }}>
          <View style={{ padding: 12, borderRadius: theme.radii.md, backgroundColor: theme.color.surfaceHi }}>
            <Text variant="caption" tone="mute" numberOfLines={1}>
              {url}
            </Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: theme.color.success }} />
            <Text variant="caption" tone="mute">
              Public link is live
            </Text>
          </View>
          <Button title="Share link" onPress={() => Share.share({ message: url })} />
          <Button title="Stop sharing" variant="ghost" onPress={revoke} loading={busy} />
        </View>
      ) : (
        <Button title="Create public link" onPress={create} loading={busy} />
      )}
    </Sheet>
  );
}
