import { Pressable, StyleSheet } from 'react-native';

import { useCopy } from '@/hooks/useCopy';
import { makeStyles, radius, spacing, useColors } from '@/theme';

import { AppText } from './AppText';
import { Icon } from './Icon';

interface CopyButtonProps {
  text: string;
  label?: string;
  /** What is being copied, for screen readers ("Copy command"). */
  accessibilityLabel?: string;
}

export function CopyButton({ text, label = 'Copy', accessibilityLabel }: CopyButtonProps) {
  const colors = useColors();
  const styles = useStyles();
  const { copied, copy } = useCopy();
  return (
    <Pressable
      onPress={() => copy(text)}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      hitSlop={10}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
      <Icon name={copied ? 'check' : 'copy'} size={14} color={copied ? colors.success : colors.textSecondary} />
      <AppText variant="caption" tone={copied ? 'success' : 'secondary'}>
        {copied ? 'Copied' : label}
      </AppText>
    </Pressable>
  );
}

const useStyles = makeStyles((c) =>
  StyleSheet.create({
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs + 2,
      borderRadius: radius.sm,
      backgroundColor: c.surfaceAlt,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
    },
    pressed: { opacity: 0.7 },
  }),
);
