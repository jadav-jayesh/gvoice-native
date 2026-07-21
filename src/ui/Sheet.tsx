import React from "react";
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, View } from "react-native";
import { useTheme } from "../core/theme/ThemeProvider";
import { Icon } from "./Icon";
import { Text } from "./Text";

// Bottom sheet built on RN Modal (no extra native module). Used for Join, Share,
// and delete-confirm flows. Tapping the scrim or the X closes it.
export function Sheet({
  visible,
  onClose,
  title,
  eyebrow,
  children
}: {
  visible: boolean;
  onClose: () => void;
  title?: string;
  eyebrow?: string;
  children: React.ReactNode;
}) {
  const { theme } = useTheme();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View
            style={[
              styles.card,
              { backgroundColor: theme.color.bgElev, borderColor: theme.color.line, borderTopLeftRadius: theme.radii.xl, borderTopRightRadius: theme.radii.xl }
            ]}
          >
            <View style={styles.grabber}>
              <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: theme.color.line }} />
            </View>
            <View style={styles.header}>
              <View style={{ flex: 1 }}>
                {eyebrow ? (
                  <Text variant="caption" tone="accent" style={{ marginBottom: 2 }}>
                    {eyebrow.toUpperCase()}
                  </Text>
                ) : null}
                {title ? <Text variant="heading">{title}</Text> : null}
              </View>
              <Pressable onPress={onClose} hitSlop={10} style={{ padding: 4 }}>
                <Icon name="Close" size={20} color={theme.color.inkMute} />
              </Pressable>
            </View>
            {children}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  card: { borderWidth: 1, paddingHorizontal: 20, paddingBottom: 34, paddingTop: 8 },
  grabber: { alignItems: "center", paddingVertical: 8 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 16 }
});
