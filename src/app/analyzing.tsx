import { Redirect, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AnalyzingIndicator } from '@/components/analysis/AnalyzingIndicator';
import { AppText, GradientButton, Screen, StateView } from '@/components/ui';
import { techOption } from '@/constants/options';
import { useApp } from '@/context/AppProvider';
import { analyzeError, AnalysisError } from '@/services/analysisService';
import { spacing } from '@/theme';

export default function AnalyzingScreen() {
  const { pendingRequest, addHistoryEntry, settings } = useApp();
  // Snapshot on mount so later context changes can't swap the request mid-flight.
  const [request] = useState(pendingRequest);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!request) return;
    const controller = new AbortController();

    analyzeError(request, {
      signal: controller.signal,
      explanationLanguage: settings.explanationLanguage,
    })
      .then((result) => {
        if (controller.signal.aborted) return;
        const entry = addHistoryEntry(request, result);
        router.replace({ pathname: '/result/[id]', params: { id: entry.id } });
      })
      .catch((e: unknown) => {
        if (controller.signal.aborted) return;
        setError(e instanceof AnalysisError ? e.message : 'Something went wrong while analyzing the error.');
      });

    return () => controller.abort();
  }, [request, attempt, addHistoryEntry, settings.explanationLanguage]);

  // Reached without a request (e.g. app reload / deep link) — nothing to analyze.
  if (!request) return <Redirect href="/home" />;

  // Unmounting aborts the in-flight request via the effect cleanup.
  const cancel = () => (router.canGoBack() ? router.back() : router.replace('/home'));

  if (error) {
    return (
      <Screen edges={['top', 'bottom']} contentStyle={styles.fill}>
        <StateView
          icon="warning"
          tone="danger"
          title="Analysis failed"
          message={error}
          actionLabel="Try Again"
          onAction={() => {
            setError(null);
            setAttempt((a) => a + 1);
          }}
          secondaryLabel="Edit Error"
          onSecondary={cancel}
        />
      </Screen>
    );
  }

  return (
    <Screen
      edges={['top', 'bottom']}
      contentStyle={styles.fill}
      footer={<GradientButton label="Cancel" variant="secondary" onPress={cancel} />}>
      <View style={styles.center} accessibilityLiveRegion="polite" accessible accessibilityLabel="Analyzing your error">
        <AnalyzingIndicator />
        <AppText variant="heading" style={styles.text}>
          Analyzing your error…
        </AppText>
        <AppText variant="body" tone="secondary" style={[styles.text, styles.message]}>
          Checking the {techOption(request.tech).label} logs, matching known issues and preparing a step-by-step
          fix.
        </AppText>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  fill: { flexGrow: 1, justifyContent: 'center' },
  center: { alignItems: 'center', gap: spacing.lg, paddingVertical: spacing.xxl },
  text: { textAlign: 'center' },
  message: { maxWidth: 320 },
});
