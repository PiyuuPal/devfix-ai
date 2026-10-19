import { StyleSheet, View } from 'react-native';

import { makeStyles, radius, spacing, useColors } from '@/theme';

import { AppText } from './AppText';
import { GradientButton } from './GradientButton';
import { Icon, type IconName } from './Icon';

interface StateViewProps {
  icon: IconName;
  title: string;
  message?: string;
  tone?: 'neutral' | 'danger';
  actionLabel?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
}

/** Shared layout for empty, not-found and error states. */
export function StateView({
  icon,
  title,
  message,
  tone = 'neutral',
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
}: StateViewProps) {
  const colors = useColors();
  const styles = useStyles();
  const color = tone === 'danger' ? colors.danger : colors.primary;

  return (
    <View style={styles.container} accessibilityLiveRegion="polite">
      <View style={[styles.iconWrap, { backgroundColor: `${color}1A`, borderColor: `${color}40` }]}>
        <Icon name={icon} size={30} color={color} />
      </View>
      <AppText variant="heading" style={styles.center} accessibilityRole="header">
        {title}
      </AppText>
      {message && (
        <AppText variant="body" tone="secondary" style={styles.center}>
          {message}
        </AppText>
      )}
      {(actionLabel || secondaryLabel) && (
        <View style={styles.actions}>
          {actionLabel && onAction && <GradientButton label={actionLabel} onPress={onAction} />}
          {secondaryLabel && onSecondary && (
            <GradientButton label={secondaryLabel} onPress={onSecondary} variant="secondary" />
          )}
        </View>
      )}
    </View>
  );
}

const useStyles = makeStyles(() =>
  StyleSheet.create({
    container: {
      flexGrow: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.md,
      padding: spacing.xl,
    },
    iconWrap: {
      width: 72,
      height: 72,
      borderRadius: radius.xl,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.sm,
    },
    center: { textAlign: 'center', maxWidth: 360 },
    actions: {
      alignSelf: 'stretch',
      maxWidth: 360,
      width: '100%',
      marginHorizontal: 'auto',
      gap: spacing.sm,
      marginTop: spacing.md,
    },
  }),
);
