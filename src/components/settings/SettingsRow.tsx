import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Card, Icon, type IconName } from '@/components/ui';
import { makeStyles, minTouchTarget, spacing, useColors } from '@/theme';

interface SettingsRowProps {
  icon: IconName;
  label: string;
  value?: string;
  onPress?: () => void;
  destructive?: boolean;
  accessibilityHint?: string;
}

export function SettingsRow({ icon, label, value, onPress, destructive, accessibilityHint }: SettingsRowProps) {
  const colors = useColors();
  const styles = useStyles();
  const color = destructive ? colors.danger : colors.text;

  const content = (
    <>
      <Icon name={icon} size={18} color={destructive ? colors.danger : colors.textSecondary} />
      <AppText variant="body" style={[styles.label, { color }]}>
        {label}
      </AppText>
      {value && (
        <AppText variant="small" tone="secondary" numberOfLines={1} style={styles.value}>
          {value}
        </AppText>
      )}
      {onPress && <Icon name="chevronRight" size={14} color={colors.textMuted} />}
    </>
  );

  if (!onPress) {
    return (
      <View style={styles.row} accessible accessibilityLabel={value ? `${label}: ${value}` : label}>
        {content}
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={value ? `${label}: ${value}` : label}
      accessibilityHint={accessibilityHint}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      {content}
    </Pressable>
  );
}

interface SettingsGroupProps {
  title: string;
  children: ReactNode;
}

export function SettingsGroup({ title, children }: SettingsGroupProps) {
  const styles = useStyles();
  return (
    <Card style={styles.group}>
      <AppText variant="small" tone="accent" style={styles.groupTitle} accessibilityRole="header">
        {title}
      </AppText>
      {children}
    </Card>
  );
}

const useStyles = makeStyles((c) =>
  StyleSheet.create({
    group: { paddingVertical: spacing.sm, paddingHorizontal: 0 },
    groupTitle: {
      fontWeight: '600',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
    },
    row: {
      minHeight: minTouchTarget + 8,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingHorizontal: spacing.lg,
    },
    pressed: { backgroundColor: c.surfaceAlt },
    label: { flex: 1 },
    value: { maxWidth: '45%' },
  }),
);
