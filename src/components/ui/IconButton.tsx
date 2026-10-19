import { Pressable, StyleSheet } from 'react-native';

import { makeStyles, minTouchTarget, radius, useColors } from '@/theme';

import { Icon, type IconName } from './Icon';

interface IconButtonProps {
  icon: IconName;
  label: string;
  onPress: () => void;
  size?: number;
}

export function IconButton({ icon, label, onPress, size = 20 }: IconButtonProps) {
  const colors = useColors();
  const styles = useStyles();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
      <Icon name={icon} size={size} color={colors.text} />
    </Pressable>
  );
}

const useStyles = makeStyles((c) =>
  StyleSheet.create({
    button: {
      width: minTouchTarget,
      height: minTouchTarget,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    pressed: { backgroundColor: c.surfaceAlt },
  }),
);
