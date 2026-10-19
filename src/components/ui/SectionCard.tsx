import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { spacing, useColors, type Palette } from '@/theme';

import { AppText } from './AppText';
import { Card } from './Card';
import { Icon, type IconName } from './Icon';

interface SectionCardProps {
  title: string;
  icon: IconName;
  accent?: keyof Pick<Palette, 'primary' | 'accent' | 'success' | 'warning' | 'danger' | 'info'>;
  right?: ReactNode;
  children: ReactNode;
}

export function SectionCard({ title, icon, accent = 'primary', right, children }: SectionCardProps) {
  const colors = useColors();
  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleRow} accessibilityRole="header">
          <Icon name={icon} size={16} color={colors[accent]} />
          <AppText variant="subheading" style={{ color: colors[accent] }}>
            {title}
          </AppText>
        </View>
        {right}
      </View>
      {children}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.md },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexShrink: 1,
  },
});
