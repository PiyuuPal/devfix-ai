import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { makeStyles, maxContentWidth, spacing } from '@/theme';

interface ScreenProps {
  children: ReactNode;
  /** Wrap content in a ScrollView (default). Disable for FlatList screens. */
  scroll?: boolean;
  header?: ReactNode;
  footer?: ReactNode;
  edges?: Edge[];
  contentStyle?: StyleProp<ViewStyle>;
}

/** Safe-area aware, keyboard-aware, width-capped screen container. */
export function Screen({ children, scroll = true, header, footer, edges = ['top'], contentStyle }: ScreenProps) {
  const styles = useStyles();
  return (
    <SafeAreaView style={styles.root} edges={edges}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {header && <View style={styles.constrained}>{header}</View>}
        {scroll ? (
          <ScrollView
            style={styles.flex}
            contentContainerStyle={[styles.constrained, styles.content, contentStyle]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive">
            {children}
          </ScrollView>
        ) : (
          <View style={[styles.flex, styles.constrained, contentStyle]}>{children}</View>
        )}
        {footer && <View style={[styles.constrained, styles.footer]}>{footer}</View>}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const useStyles = makeStyles((c) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: c.background },
    flex: { flex: 1 },
    constrained: {
      width: '100%',
      maxWidth: maxContentWidth,
      alignSelf: 'center',
    },
    content: {
      padding: spacing.lg,
      paddingBottom: spacing.xxl,
      gap: spacing.lg,
    },
    footer: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.border,
      backgroundColor: c.background,
    },
  }),
);
