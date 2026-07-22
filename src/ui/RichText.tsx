import React from "react";
import { Text as RNText } from "react-native";
import { Text } from "./Text";

// The AI's MoM prose sometimes carries inline <strong>/<em> markup. RichText
// parses that small whitelist and renders real bold/italic, so the app shows
// formatted text instead of literal tags. Anything else stays plain.
type Seg = { text: string; bold: boolean; italic: boolean };

function parseInline(input: string): Seg[] {
  const segs: Seg[] = [];
  const re = /<(\/?)(strong|b|em|i)\s*>/gi;
  let bold = 0;
  let italic = 0;
  let last = 0;
  let m: RegExpExecArray | null;
  const push = (text: string) => {
    if (text) segs.push({ text, bold: bold > 0, italic: italic > 0 });
  };
  while ((m = re.exec(input))) {
    push(input.slice(last, m.index));
    const closing = m[1] === "/";
    const isBold = m[2].toLowerCase() === "strong" || m[2].toLowerCase() === "b";
    if (isBold) bold = Math.max(0, bold + (closing ? -1 : 1));
    else italic = Math.max(0, italic + (closing ? -1 : 1));
    last = re.lastIndex;
  }
  push(input.slice(last));
  return segs;
}

export function RichText({ children, ...props }: React.ComponentProps<typeof Text>) {
  const raw = typeof children === "string" ? children : String(children ?? "");
  // Fast path: no markup → render plainly.
  if (!raw.includes("<")) return <Text {...props}>{raw}</Text>;
  const segs = parseInline(raw);
  return (
    <Text {...props}>
      {segs.map((s, i) =>
        s.bold || s.italic ? (
          <RNText key={i} style={{ fontWeight: s.bold ? "700" : undefined, fontStyle: s.italic ? "italic" : undefined }}>
            {s.text}
          </RNText>
        ) : (
          s.text
        )
      )}
    </Text>
  );
}
