import { StyleSheet, View } from 'react-native';

import { radius, spacing, useColors, type Palette } from '@/theme';

import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';

type BadgeTone = 'primary' | 'success' | 'warning' | 'danger' | 'neutral';

const TONES: Record<BadgeTone, keyof Palette> = {
  primary: 'primary',
  success: 'success',
  warning: 'warning',
  danger: 'danger',
  neutral: 'textSecondary',
};

interface BadgeProps {
  label: string;
  tone?: BadgeTone;
  icon?: IconName;
}

export function Badge({ label, tone = 'primary', icon }: BadgeProps) {
  const colors = useColors();
  const color = colors[TONES[tone]] as string;
  return (
    <View style={[styles.badge, { backgroundColor: `${color}1F`, borderColor: `${color}55` }]}>
      {icon && <Icon name={icon} size={12} color={color} />}
      <AppText variant="caption" style={{ color }}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
});
