import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { makeStyles, minTouchTarget, radius, spacing, typography, useColors } from '@/theme';

import { Icon } from './Icon';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

export function SearchBar({ value, onChangeText, placeholder = 'Search' }: SearchBarProps) {
  const colors = useColors();
  const styles = useStyles();
  return (
    <View style={styles.container}>
      <Icon name="search" size={16} color={colors.textMuted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        selectionColor={colors.primary}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        accessibilityLabel={placeholder}
        role="searchbox"
        style={styles.input}
      />
      {value.length > 0 && (
        <Pressable onPress={() => onChangeText('')} accessibilityRole="button" accessibilityLabel="Clear search" hitSlop={10}>
          <Icon name="close" size={16} color={colors.textSecondary} />
        </Pressable>
      )}
    </View>
  );
}

const useStyles = makeStyles((c) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      minHeight: minTouchTarget,
      paddingHorizontal: spacing.md,
      backgroundColor: c.surface,
      borderRadius: radius.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
    },
    input: {
      ...typography.body,
      flex: 1,
      color: c.text,
      paddingVertical: spacing.sm,
    },
  }),
);
