import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { spacing } from '@/theme';

import { AppText } from './AppText';
import { IconButton } from './IconButton';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: ReactNode;
  /** Large title for tab roots; compact for pushed screens. */
  large?: boolean;
}

export function ScreenHeader({ title, subtitle, onBack, right, large = true }: ScreenHeaderProps) {
  return (
    <View style={[styles.container, onBack && styles.withBack]}>
      {onBack && <IconButton icon="back" label="Go back" onPress={onBack} />}
      <View style={styles.text}>
        <AppText variant={large ? 'title' : 'heading'} accessibilityRole="header" numberOfLines={1}>
          {title}
        </AppText>
        {subtitle && (
          <AppText variant="small" tone="secondary">
            {subtitle}
          </AppText>
        )}
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  withBack: { paddingLeft: spacing.xs },
  text: { flex: 1, gap: 2 },
});
