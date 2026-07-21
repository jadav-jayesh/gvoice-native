import React, { useState } from "react";
import { Share, View } from "react-native";
import { API_BASE_URL } from "../../core/config";
import { createShareLink, revokeShareLink } from "../../core/api/endpoints";
import { useTheme } from "../../core/theme/ThemeProvider";
import { Button } from "../../ui/Button";
import { Sheet } from "../../ui/Sheet";
import { Text } from "../../ui/Text";

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
    } catch {
      setError("Couldn't create the link. Try again.");
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
    } catch {
      setError("Couldn't revoke the link. Try again.");
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
