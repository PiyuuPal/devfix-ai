import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { makeStyles, radius, spacing, typography, useColors } from '@/theme';

import { AppText } from './AppText';

interface TextAreaProps extends Omit<TextInputProps, 'style' | 'multiline'> {
  label: string;
  value: string;
  optional?: boolean;
  error?: string;
  maxLength?: number;
  minHeight?: number;
  monospace?: boolean;
}

export function TextArea({
  label,
  optional,
  error,
  value,
  maxLength,
  minHeight = 140,
  monospace = false,
  ...rest
}: TextAreaProps) {
  const colors = useColors();
  const styles = useStyles();
  const showCounter = maxLength !== undefined && value.length > maxLength * 0.8;

  return (
    <View style={styles.wrapper}>
      <View style={styles.labelRow}>
        <AppText variant="subheading">
          {label}
          {optional && (
            <AppText variant="small" tone="muted">
              {'  '}(optional)
            </AppText>
          )}
        </AppText>
        {showCounter && (
          <AppText variant="caption" tone={value.length > maxLength ? 'danger' : 'muted'}>
            {value.length.toLocaleString()}/{maxLength.toLocaleString()}
          </AppText>
        )}
      </View>
      <TextInput
        {...rest}
        value={value}
        multiline
        textAlignVertical="top"
        autoCapitalize="none"
        autoCorrect={false}
        spellCheck={false}
        placeholderTextColor={colors.textMuted}
        selectionColor={colors.primary}
        accessibilityLabel={label}
        accessibilityHint={error}
        aria-invalid={!!error}
        style={[
          styles.input,
          monospace && styles.mono,
          { minHeight },
          error ? { borderColor: colors.danger } : null,
        ]}
      />
      {error && (
        <AppText variant="small" tone="danger" accessibilityLiveRegion="polite" role="alert">
          {error}
        </AppText>
      )}
    </View>
  );
}

const useStyles = makeStyles((c) =>
  StyleSheet.create({
    wrapper: { gap: spacing.sm },
    labelRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    input: {
      ...typography.body,
      color: c.text,
      backgroundColor: c.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: c.border,
      padding: spacing.md,
      maxHeight: 320,
    },
    mono: {
      ...typography.code,
    },
  }),
);
