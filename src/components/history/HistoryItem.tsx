import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Icon } from '@/components/ui';
import { techOption } from '@/constants/options';
import { makeStyles, radius, spacing, useColors } from '@/theme';
import type { HistoryEntry } from '@/types/analysis';
import { timeAgo } from '@/utils/format';

/** Each tech gets a distinct accent so the list is scannable at a glance. */
const TECH_TINT = {
  'react-native': 'info',
  expo: 'accent',
  android: 'success',
  ios: 'primary',
  backend: 'warning',
} as const;

interface HistoryItemProps {
  entry: HistoryEntry;
  onPress: () => void;
  onLongPress?: () => void;
}

export function HistoryItem({ entry, onPress, onLongPress }: HistoryItemProps) {
  const colors = useColors();
  const styles = useStyles();
  const tech = techOption(entry.request.tech);
  const tint = colors[TECH_TINT[entry.request.tech]];
  const preview = entry.request.errorText.split('\n')[0];
  const when = timeAgo(entry.createdAt);

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityRole="button"
      accessibilityLabel={`${entry.result.title}. ${tech.label}. ${when}`}
      accessibilityHint="Opens the analysis. Long press to delete."
      style={({ pressed }) => [styles.item, pressed && styles.pressed]}>
      <View style={[styles.iconWrap, { backgroundColor: `${tint}1F` }]}>
        <Icon name={tech.icon} size={18} color={tint} />
      </View>
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <AppText variant="subheading" numberOfLines={1} style={styles.title}>
            {entry.result.title}
          </AppText>
          <AppText variant="caption" tone="muted">
            {when}
          </AppText>
        </View>
        <AppText variant="small" tone="secondary" numberOfLines={1}>
          {preview}
        </AppText>
      </View>
    </Pressable>
  );
}

const useStyles = makeStyles((c) =>
  StyleSheet.create({
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      padding: spacing.md,
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
    },
    pressed: { backgroundColor: c.surfaceAlt },
    iconWrap: {
      width: 40,
      height: 40,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    body: { flex: 1, gap: 2 },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    title: { flex: 1 },
  }),
);
