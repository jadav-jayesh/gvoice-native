import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Animated, Easing, type ViewStyle } from "react-native";

// Shared motion primitives. Everything runs on the native driver
// (transform/opacity only) and collapses to an instant, static presentation
// when the OS "Reduce Motion" setting is on. No extra dependency — plain
// Animated, so it works in the current bare build without a native rebuild.

const ReduceMotionContext = createContext(false);

export function MotionProvider({ children }: { children: React.ReactNode }) {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((v) => mounted && setReduce(v));
    const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduce);
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);
  return <ReduceMotionContext.Provider value={reduce}>{children}</ReduceMotionContext.Provider>;
}

export function useReduceMotion(): boolean {
  return useContext(ReduceMotionContext);
}

// Fade + small upward slide on mount. `delay` staggers siblings; keep total
// stagger under ~300ms so content never feels held back.
export function FadeSlideIn({
  children,
  delay = 0,
  distance = 12,
  style
}: {
  children: React.ReactNode;
  delay?: number;
  distance?: number;
  style?: ViewStyle;
}) {
  const reduce = useReduceMotion();
  const anim = useRef(new Animated.Value(reduce ? 1 : 0)).current;

  useEffect(() => {
    if (reduce) {
      anim.setValue(1);
      return;
    }
    const t = Animated.timing(anim, {
      toValue: 1,
      duration: 240,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true
    });
    t.start();
    return () => t.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduce]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: anim,
          transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [distance, 0] }) }]
        }
      ]}
    >
      {children}
    </Animated.View>
  );
}

// Press-scale for touchable surfaces (cards, buttons). Spread the handlers onto
// a Pressable and put `pressStyle` on an Animated.View wrapping it.
export function usePressScale(scaleTo = 0.97) {
  const reduce = useReduceMotion();
  const scale = useRef(new Animated.Value(1)).current;
  const to = (v: number) =>
    Animated.timing(scale, { toValue: v, duration: 140, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
  return {
    onPressIn: () => !reduce && to(scaleTo),
    onPressOut: () => !reduce && to(1),
    pressStyle: { transform: [{ scale }] } as const
  };
}
