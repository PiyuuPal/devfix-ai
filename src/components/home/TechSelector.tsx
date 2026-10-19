import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Icon } from '@/components/ui';
import { TECH_OPTIONS } from '@/constants/options';
import { makeStyles, radius, spacing, useColors } from '@/theme';
import type { TechType } from '@/types/analysis';

interface TechSelectorProps {
  value: TechType;
  onChange: (value: TechType) => void;
}

export function TechSelector({ value, onChange }: TechSelectorProps) {
  const colors = useColors();
  const styles = useStyles();

  return (
    <View style={styles.wrapper}>
      <AppText variant="subheading">Technology</AppText>
      <View style={styles.grid} accessibilityRole="radiogroup" accessibilityLabel="Technology">
        {TECH_OPTIONS.map((o) => {
          const selected = o.value === value;
          return (
            <Pressable
              key={o.value}
              onPress={() => onChange(o.value)}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              accessibilityLabel={o.label}
              style={({ pressed }) => [styles.item, selected && styles.selected, pressed && styles.pressed]}>
              <Icon name={o.icon} size={22} color={selected ? colors.text : colors.textSecondary} />
              <AppText
                variant="caption"
                tone={selected ? 'primary' : 'secondary'}
                numberOfLines={2}
                style={styles.label}>
                {o.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const useStyles = makeStyles((c) =>
  StyleSheet.create({
    wrapper: { gap: spacing.sm },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    item: {
      flexGrow: 1,
      flexBasis: 58,
      minHeight: 72,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.xs,
      borderRadius: radius.md,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
    },
    selected: {
      backgroundColor: `${c.primary}29`,
      borderColor: c.primary,
    },
    pressed: { opacity: 0.8 },
    label: { textAlign: 'center' },
  }),
);
