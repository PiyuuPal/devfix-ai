import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { SolutionSteps } from '@/components/analysis/SolutionSteps';
import {
  AppText,
  Badge,
  CodeBlock,
  CopyButton,
  GradientButton,
  Icon,
  Screen,
  ScreenHeader,
  SectionCard,
  StateView,
} from '@/components/ui';
import { CONFIDENCE_LABELS, LANGUAGE_OPTIONS, labelFor, techOption } from '@/constants/options';
import { useApp } from '@/context/AppProvider';
import { useCopy } from '@/hooks/useCopy';
import { spacing, useColors } from '@/theme';
import type { Confidence } from '@/types/analysis';
import { collectCommands, formatFix, formatReport, timeAgo } from '@/utils/format';

const CONFIDENCE_TONE: Record<Confidence, 'success' | 'warning' | 'danger'> = {
  high: 'success',
  medium: 'warning',
  low: 'danger',
};

export default function ResultScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { history } = useApp();
  const colors = useColors();
  const fixCopy = useCopy();
  const entry = history.find((e) => e.id === id);

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/home'));

  if (!entry) {
    return (
      <Screen header={<ScreenHeader title="Analysis Result" large={false} onBack={goBack} />} contentStyle={styles.fill}>
        <StateView
          icon="doc"
          title="Analysis not found"
          message="It may have been deleted from your history."
          actionLabel="Analyze an Error"
          onAction={() => router.replace('/home')}
        />
      </Screen>
    );
  }

  const { request, result } = entry;
  const tech = techOption(request.tech);
  const commands = collectCommands(result);

  return (
    <Screen
      edges={['top', 'bottom']}
      header={
        <ScreenHeader
          title="Analysis Result"
          large={false}
          onBack={goBack}
          right={<CopyButton text={formatReport(result)} label="Copy All" accessibilityLabel="Copy full report" />}
        />
      }
      footer={
        <GradientButton
          label={fixCopy.copied ? 'Fix Copied' : 'Copy Fix'}
          icon={fixCopy.copied ? 'check' : 'copy'}
          variant="secondary"
          onPress={() => fixCopy.copy(formatFix(result))}
        />
      }>
      <View style={styles.summary}>
        <View style={styles.badges}>
          <Badge label={tech.label} icon={tech.icon} tone="danger" />
          <Badge
            label={`Confidence: ${CONFIDENCE_LABELS[result.confidence]}`}
            tone={CONFIDENCE_TONE[result.confidence]}
          />
          {request.language !== 'auto' && <Badge label={labelFor(LANGUAGE_OPTIONS, request.language)} tone="neutral" />}
        </View>
        <AppText variant="title" accessibilityRole="header" selectable>
          {result.title}
        </AppText>
        <AppText variant="small" tone="muted">
          Analyzed {timeAgo(entry.createdAt)}
        </AppText>
      </View>

      <SectionCard title="Root Cause" icon="bug" accent="success">
        <AppText variant="body" selectable>
          {result.rootCause}
        </AppText>
      </SectionCard>

      {!!result.explanation && (
        <SectionCard title="Explanation" icon="lightbulb" accent="info">
          <AppText variant="body" tone="secondary" selectable>
            {result.explanation}
          </AppText>
        </SectionCard>
      )}

      {!!result.evidence && (
        <SectionCard title="Evidence" icon="warning" accent="danger">
          <CodeBlock code={result.evidence} />
        </SectionCard>
      )}

      <SectionCard title="Solution" icon="wrench" accent="primary">
        <SolutionSteps steps={result.solution} />
      </SectionCard>

      {commands.length > 1 && (
        <SectionCard
          title="All Commands"
          icon="terminal"
          accent="accent"
          right={<CopyButton text={commands.join('\n')} label="Copy" accessibilityLabel="Copy all commands" />}>
          <CodeBlock code={commands.join('\n')} shell copyable={false} />
        </SectionCard>
      )}

      {result.verification.length > 0 && (
        <SectionCard title="Verify the Fix" icon="checkCircle" accent="success">
          <View style={styles.checklist}>
            {result.verification.map((v) => (
              <View key={v} style={styles.checkRow}>
                <Icon name="checkCircle" size={16} color={colors.success} />
                <AppText variant="body" style={styles.flex}>
                  {v}
                </AppText>
              </View>
            ))}
          </View>
        </SectionCard>
      )}

      {!!result.additionalInfo && (
        <SectionCard title="Additional Info" icon="info" accent="warning">
          <AppText variant="body" tone="secondary">
            {result.additionalInfo}
          </AppText>
        </SectionCard>
      )}

      <SectionCard title="Your Input" icon="doc" accent="info">
        <CodeBlock code={request.errorText} />
        {!!request.context && (
          <AppText variant="small" tone="secondary">
            Context: {request.context}
          </AppText>
        )}
      </SectionCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  fill: { flexGrow: 1 },
  flex: { flex: 1 },
  summary: { gap: spacing.sm },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  checklist: { gap: spacing.md },
  checkRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
});
