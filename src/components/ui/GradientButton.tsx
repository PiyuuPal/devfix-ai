import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { makeStyles, minTouchTarget, radius, spacing, useColors } from '@/theme';

import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';

interface GradientButtonProps {
  label: string;
  onPress: () => void;
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  /** `secondary` renders an outlined surface button instead of the gradient. */
  variant?: 'primary' | 'secondary';
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
}

export function GradientButton({
  label,
  onPress,
  icon,
  loading = false,
  disabled = false,
  variant = 'primary',
  accessibilityHint,
  style,
}: GradientButtonProps) {
  const colors = useColors();
  const styles = useStyles();
  const inactive = disabled || loading;
  const fg = variant === 'primary' ? colors.onPrimary : colors.text;

  const content = (
    <View style={styles.content}>
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        icon && <Icon name={icon} size={18} color={fg} />
      )}
      <AppText variant="subheading" style={{ color: fg }}>
        {label}
      </AppText>
    </View>
  );

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive, busy: loading }}
      style={({ pressed }) => [styles.base, { opacity: inactive ? 0.55 : pressed ? 0.85 : 1 }, style]}>
      {variant === 'primary' ? (
        <LinearGradient colors={colors.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.fill}>
          {content}
        </LinearGradient>
      ) : (
        <View style={[styles.fill, styles.secondary]}>{content}</View>
      )}
    </Pressable>
  );
}

const useStyles = makeStyles((c) =>
  StyleSheet.create({
    base: {
      borderRadius: radius.md,
      overflow: 'hidden',
    },
    fill: {
      minHeight: minTouchTarget + 8,
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.md,
      justifyContent: 'center',
      borderRadius: radius.md,
    },
    secondary: {
      backgroundColor: c.surfaceAlt,
      borderWidth: 1,
      borderColor: c.borderStrong,
    },
    content: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
    },
  }),
);
