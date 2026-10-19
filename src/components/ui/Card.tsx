import { StyleSheet, View, type ViewProps } from 'react-native';

import { makeStyles, radius, spacing } from '@/theme';

export function Card({ style, ...rest }: ViewProps) {
  const styles = useStyles();
  return <View {...rest} style={[styles.card, style]} />;
}

const useStyles = makeStyles((c) =>
  StyleSheet.create({
    card: {
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      padding: spacing.lg,
    },
  }),
);
