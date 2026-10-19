import { StyleSheet, View } from 'react-native';

import { AppText, CodeBlock } from '@/components/ui';
import { makeStyles, radius, spacing } from '@/theme';
import type { SolutionStep } from '@/types/analysis';

export function SolutionSteps({ steps }: { steps: SolutionStep[] }) {
  const styles = useStyles();
  return (
    <View style={styles.list}>
      {steps.map((step, i) => (
        <View key={`${i}-${step.title}`} style={styles.step}>
          <View style={styles.number} accessibilityElementsHidden importantForAccessibility="no">
            <AppText variant="caption" tone="accent">
              {i + 1}
            </AppText>
          </View>
          <View style={styles.body}>
            <AppText variant="body" accessibilityLabel={`Step ${i + 1}: ${step.title}`}>
              {step.title}
            </AppText>
            {step.description && (
              <AppText variant="small" tone="secondary">
                {step.description}
              </AppText>
            )}
            {step.command && <CodeBlock code={step.command} shell />}
          </View>
        </View>
      ))}
    </View>
  );
}

const useStyles = makeStyles((c) =>
  StyleSheet.create({
    list: { gap: spacing.lg },
    step: { flexDirection: 'row', gap: spacing.md },
    number: {
      width: 24,
      height: 24,
      borderRadius: radius.pill,
      backgroundColor: `${c.primary}26`,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 1,
    },
    body: { flex: 1, gap: spacing.sm },
  }),
);
