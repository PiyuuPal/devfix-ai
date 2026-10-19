import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { Icon } from '@/components/ui';
import { makeStyles, useColors } from '@/theme';

const SIZE = 140;

/** Spinning gradient-colored arc around the app logo. Static when Reduce Motion is on. */
export function AnalyzingIndicator() {
  const colors = useColors();
  const styles = useStyles();
  const reduceMotion = useReducedMotion();
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) return;
    rotation.set(withRepeat(withTiming(360, { duration: 1100, easing: Easing.linear }), -1, false));
    return () => cancelAnimation(rotation);
  }, [reduceMotion, rotation]);

  const spin = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotation.get()}deg` }] }));

  return (
    <View style={styles.wrap} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={styles.track} />
      <Animated.View style={[styles.arc, spin]} />
      <View style={styles.core}>
        <Icon name="code" size={36} color={colors.text} />
      </View>
    </View>
  );
}

const useStyles = makeStyles((c) =>
  StyleSheet.create({
    wrap: { width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' },
    track: {
      ...StyleSheet.absoluteFill,
      borderRadius: SIZE / 2,
      borderWidth: 4,
      borderColor: c.surfaceAlt,
    },
    arc: {
      ...StyleSheet.absoluteFill,
      borderRadius: SIZE / 2,
      borderWidth: 4,
      borderColor: 'transparent',
      borderTopColor: c.primary,
      borderRightColor: c.accent,
    },
    core: {
      width: SIZE - 44,
      height: SIZE - 44,
      borderRadius: (SIZE - 44) / 2,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: `${c.primary}66`,
      alignItems: 'center',
      justifyContent: 'center',
    },
  }),
);
