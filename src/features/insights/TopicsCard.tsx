import { useQuery } from "@tanstack/react-query";
import type { NavigationProp } from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";
import React from "react";
import { Pressable, View } from "react-native";
import { getTopics, type InsightRange } from "../../core/api/endpoints";
import { useTheme } from "../../core/theme/ThemeProvider";
import { Card } from "../../ui/Card";
import { Skeleton } from "../../ui/Skeleton";
import { Text } from "../../ui/Text";
import type { AppTabsParamList } from "../../navigation/types";

// Ported from web insights/TopicsCard: theme chips, opacity by relative count,
// tapping a topic jumps to Meetings (web navigates to a search of the label).
export function TopicsCard({ range }: { range: InsightRange }) {
  const { theme } = useTheme();
  const nav = useNavigation<NavigationProp<AppTabsParamList>>();
  const { data, isLoading } = useQuery({ queryKey: ["insights", "topics", range], queryFn: () => getTopics(range) });
  const max = data?.topics[0]?.count ?? 1;

  return (
    <Card>
      <Text variant="heading">Top themes</Text>
      <Text variant="caption" tone="mute" style={{ marginBottom: 14 }}>
        What recent meetings were about
      </Text>
      {isLoading ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <Skeleton key={i} width={90} height={28} radius={999} />
          ))}
        </View>
      ) : !data || data.topics.length === 0 ? (
        <Text tone="mute" style={{ fontStyle: "italic" }}>
          No themes yet — captured once meetings have chapters.
        </Text>
      ) : (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {data.topics.map((t, i) => (
            <Pressable
              key={i}
              onPress={() => nav.navigate("Meetings")}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                paddingHorizontal: 12,
                paddingVertical: 7,
                borderRadius: 999,
                backgroundColor: theme.color.surfaceHi,
                opacity: 0.5 + 0.5 * (t.count / max)
              }}
            >
              <Text variant="label" numberOfLines={1} style={{ maxWidth: 160 }}>
                {t.label}
              </Text>
              <Text variant="caption" tone="mute">
                {t.count}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </Card>
  );
}
