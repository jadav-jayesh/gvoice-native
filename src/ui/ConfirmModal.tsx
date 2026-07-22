import React from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import { useTheme } from "../core/theme/ThemeProvider";
import { Button } from "./Button";
import { Icon } from "./Icon";
import { Text } from "./Text";

// Centered confirmation dialog for destructive / hard-to-undo actions
// (delete meeting, sign out, …). Tapping the scrim cancels; the confirm
// button shows a spinner while the action runs.
export function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  loading = false,
  onConfirm,
  onCancel
}: {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { theme } = useTheme();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel} statusBarTranslucent>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={loading ? undefined : onCancel} />
        <View
          style={[
            styles.card,
            { backgroundColor: theme.color.bgElev, borderColor: theme.color.line, borderRadius: theme.radii.xl }
          ]}
        >
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: theme.radii.md,
              borderWidth: 1,
              borderColor: theme.color.line,
              backgroundColor: theme.color.surfaceHi,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 14
            }}
          >
            <Icon name="AlertCircle" size={20} color={destructive ? theme.color.danger : theme.color.accent} />
          </View>
          <Text variant="heading">{title}</Text>
          {message ? (
            <Text variant="body" tone="mute" style={{ marginTop: 6, lineHeight: 21 }}>
              {message}
            </Text>
          ) : null}
          <View style={{ flexDirection: "row", gap: 10, marginTop: 20 }}>
            <Button title={cancelLabel} variant="secondary" onPress={onCancel} disabled={loading} style={{ flex: 1 }} />
            <Button
              title={confirmLabel}
              variant={destructive ? "danger" : "primary"}
              onPress={onConfirm}
              loading={loading}
              style={{ flex: 1 }}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", alignItems: "center", justifyContent: "center", padding: 24 },
  card: { width: "100%", maxWidth: 400, borderWidth: 1, padding: 20 }
});
