import { router } from 'expo-router';
import { useState } from 'react';
import { AccessibilityInfo, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { TechSelector } from '@/components/home/TechSelector';
import { AppText, Badge, GradientButton, IconButton, Screen, ScreenHeader, Select, TextArea } from '@/components/ui';
import { LANGUAGE_OPTIONS, techOption } from '@/constants/options';
import { useApp } from '@/context/AppProvider';
import { isMockMode } from '@/services/analysisService';
import { SAMPLE_ERRORS } from '@/services/mockAnalyses';
import { makeStyles, radius, spacing } from '@/theme';
import type { CodeLanguage, TechType } from '@/types/analysis';
import {
  CONTEXT_MAX,
  ERROR_TEXT_MAX,
  hasErrors,
  validateAnalysisForm,
  type AnalysisFormErrors,
} from '@/utils/validation';

export default function HomeScreen() {
  const styles = useStyles();
  const { setPendingRequest } = useApp();
  const [tech, setTech] = useState<TechType>('react-native');
  const [errorText, setErrorText] = useState('');
  const [context, setContext] = useState('');
  const [language, setLanguage] = useState<CodeLanguage>('auto');
  const [errors, setErrors] = useState<AnalysisFormErrors>({});
  const [submitted, setSubmitted] = useState(false);

  const examples = techOption(tech).examples;
  const placeholder = `Paste your error message, stack trace or log here…\n\nExamples:\n${examples.map((e) => `• ${e}`).join('\n')}`;

  // Re-validate live only after the first submit attempt, so users aren't nagged while typing.
  const revalidate = (nextError: string, nextContext: string) => {
    if (submitted) setErrors(validateAnalysisForm(nextError, nextContext));
  };

  const submit = () => {
    setSubmitted(true);
    const result = validateAnalysisForm(errorText, context);
    setErrors(result);
    if (hasErrors(result)) {
      AccessibilityInfo.announceForAccessibility(result.errorText ?? result.context ?? 'Please fix the form');
      return;
    }
    setPendingRequest({
      tech,
      errorText: errorText.trim(),
      context: context.trim() || undefined,
      language,
    });
    router.push('/analyzing');
  };

  const fillSample = (sample: (typeof SAMPLE_ERRORS)[number]) => {
    setTech(sample.tech);
    setErrorText(sample.text);
    revalidate(sample.text, context);
  };

  return (
    <Screen
      header={
        <ScreenHeader
          title="DevFix AI"
          subtitle="Smart Error Explainer"
          right={<IconButton icon="settings" label="Settings" onPress={() => router.navigate('/settings')} />}
        />
      }>
      {isMockMode && <Badge label="Demo mode · offline mock analysis" tone="neutral" icon="sparkles" />}

      <TechSelector value={tech} onChange={setTech} />

      <TextArea
        label="Error message"
        value={errorText}
        onChangeText={(t) => {
          setErrorText(t);
          revalidate(t, context);
        }}
        placeholder={placeholder}
        error={errors.errorText}
        maxLength={ERROR_TEXT_MAX}
        minHeight={180}
        monospace
      />

      <View style={styles.samples}>
        <AppText variant="small" tone="muted">
          Try a sample:
        </AppText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sampleList}>
          {SAMPLE_ERRORS.map((s) => (
            <Pressable
              key={s.label}
              onPress={() => fillSample(s)}
              accessibilityRole="button"
              accessibilityLabel={`Use sample ${s.label} error`}
              style={({ pressed }) => [styles.chip, pressed && styles.chipPressed]}>
              <AppText variant="caption" tone="secondary">
                {s.label}
              </AppText>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <TextArea
        label="Additional context"
        optional
        value={context}
        onChangeText={(t) => {
          setContext(t);
          revalidate(errorText, t);
        }}
        placeholder="Code snippet, package versions, what you were doing…"
        error={errors.context}
        maxLength={CONTEXT_MAX}
        minHeight={88}
      />

      <Select label="Code language" options={LANGUAGE_OPTIONS} value={language} onChange={setLanguage} />

      <GradientButton
        label="Explain Error"
        icon="sparkles"
        onPress={submit}
        accessibilityHint="Analyzes the error and shows the root cause and fix"
      />
    </Screen>
  );
}

const useStyles = makeStyles((c) =>
  StyleSheet.create({
    samples: { gap: spacing.sm, marginTop: -spacing.sm },
    sampleList: { gap: spacing.sm },
    chip: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.pill,
      backgroundColor: c.surfaceAlt,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
    },
    chipPressed: { opacity: 0.7 },
  }),
);
