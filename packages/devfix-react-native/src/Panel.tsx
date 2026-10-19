import { useSyncExternalStore, type ReactNode } from 'react';
import { ActivityIndicator, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { explain } from './client';
import { cleanStack } from './stack';
import { store } from './store';
import type { CapturedError, Explanation } from './types';

const C = {
  bg: '#0B1020',
  card: '#151B2E',
  border: '#26304A',
  text: '#E6E9F2',
  muted: '#8A93AD',
  accent: '#6D7CFF',
  danger: '#FF6B6B',
  confidence: { high: '#34D399', medium: '#FBBF24', low: '#F87171' },
};
const mono = Platform.select({ ios: 'Menlo', default: 'monospace' });

export function useDevFixState() {
  return useSyncExternalStore(store.subscribe, store.getState, store.getState);
}

/** Floating button that appears once at least one error was captured. */
export function Bubble() {
  const { errors, panelOpen } = useDevFixState();
  if (!errors.length || panelOpen) return null;
  return (
    <Pressable
      onPress={() => store.open(errors.length === 1 ? errors[0].id : null)}
      style={styles.bubble}
      accessibilityRole="button"
      accessibilityLabel={`DevFix: ${errors.length} captured errors. Open to explain with AI.`}>
      <Text style={styles.bubbleText}>🩺 {errors.length}</Text>
    </Pressable>
  );
}

export function Panel() {
  const { errors, panelOpen, selectedId } = useDevFixState();
  const selected = selectedId ? errors.find((e) => e.id === selectedId) : undefined;

  return (
    <Modal visible={panelOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={store.close}>
      <View style={styles.sheet}>
        <View style={styles.header}>
          {selected ? (
            <HeaderButton label="‹ Errors" onPress={() => store.select(null)} />
          ) : (
            <HeaderButton label="Clear" onPress={store.clear} disabled={!errors.length} />
          )}
          <Text style={styles.headerTitle}>DevFix AI</Text>
          <HeaderButton label="Close" onPress={store.close} />
        </View>
        <ScrollView contentContainerStyle={styles.content}>
          {selected ? <ErrorDetail entry={selected} /> : <ErrorList errors={errors} />}
        </ScrollView>
      </View>
    </Modal>
  );
}

function HeaderButton({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable onPress={onPress} disabled={disabled} hitSlop={12} accessibilityRole="button">
      <Text style={[styles.headerButton, disabled && { opacity: 0.4 }]}>{label}</Text>
    </Pressable>
  );
}

function ErrorList({ errors }: { errors: CapturedError[] }) {
  if (!errors.length) return <Text style={styles.muted}>No errors captured yet.</Text>;
  return (
    <>
      {errors.map((e) => (
        <Pressable key={e.id} onPress={() => store.select(e.id)} style={styles.card} accessibilityRole="button">
          <Text style={styles.meta}>
            {new Date(e.at).toLocaleTimeString()} · {e.source}
            {e.isFatal ? ' · fatal' : ''}
            {e.status === 'done' ? ' · explained ✓' : ''}
          </Text>
          <Text style={styles.errorText} numberOfLines={3}>
            {e.name}: {e.message}
          </Text>
        </Pressable>
      ))}
    </>
  );
}

function ErrorDetail({ entry }: { entry: CapturedError }) {
  return (
    <>
      <View style={styles.card}>
        <Text style={styles.meta}>
          {entry.name} · {entry.source}
          {entry.isFatal ? ' · fatal' : ''}
        </Text>
        <Text style={styles.errorText} selectable>
          {entry.message}
        </Text>
      </View>

      {entry.status === 'idle' && <PrimaryButton label="✨ Explain with AI" onPress={() => explain(entry.id)} />}
      {entry.status === 'loading' && (
        <View style={styles.loading}>
          <ActivityIndicator color={C.accent} />
          <Text style={styles.muted}>Analyzing…</Text>
        </View>
      )}
      {entry.status === 'failed' && (
        <>
          <Text style={[styles.body, { color: C.danger }]}>{entry.failure}</Text>
          <PrimaryButton label="Try again" onPress={() => explain(entry.id)} />
        </>
      )}
      {entry.explanation && <ExplanationView data={entry.explanation} />}

      {!!entry.stack && (
        <Section title="Stack trace">
          <Text style={styles.code} selectable>
            {cleanStack(entry.stack)}
          </Text>
        </Section>
      )}
    </>
  );
}

function ExplanationView({ data }: { data: Explanation }) {
  return (
    <>
      <View style={styles.titleRow}>
        <Text style={styles.title}>{data.title}</Text>
        <Text style={[styles.badge, { color: C.confidence[data.confidence] }]}>{data.confidence}</Text>
      </View>
      <Section title="Root cause">
        <Text style={styles.body} selectable>
          {data.rootCause}
        </Text>
      </Section>
      {!!data.explanation && (
        <Section title="Why it happens">
          <Text style={styles.body} selectable>
            {data.explanation}
          </Text>
        </Section>
      )}
      {data.solution.length > 0 && (
        <Section title="Fix">
          {data.solution.map((step, i) => (
            <View key={i} style={styles.step}>
              <Text style={styles.body} selectable>
                {i + 1}. {step.title}
              </Text>
              {!!step.description && (
                <Text style={styles.muted} selectable>
                  {step.description}
                </Text>
              )}
              {!!step.command && (
                <Text style={styles.code} selectable>
                  {step.command}
                </Text>
              )}
            </View>
          ))}
        </Section>
      )}
      {data.verification.length > 0 && (
        <Section title="Verify">
          {data.verification.map((v, i) => (
            <Text key={i} style={styles.body} selectable>
              • {v}
            </Text>
          ))}
        </Section>
      )}
      {!!data.additionalInfo && (
        <Section title="Notes">
          <Text style={styles.muted} selectable>
            {data.additionalInfo}
          </Text>
        </Section>
      )}
    </>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function PrimaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.button} accessibilityRole="button">
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bubble: {
    position: 'absolute',
    right: 16,
    bottom: 110,
    backgroundColor: C.accent,
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 10,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  bubbleText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  sheet: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 40 : 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.border,
  },
  headerTitle: { color: C.text, fontSize: 17, fontWeight: '700' },
  headerButton: { color: C.accent, fontSize: 16 },
  content: { padding: 16, gap: 12, paddingBottom: 48 },
  card: { backgroundColor: C.card, borderColor: C.border, borderWidth: 1, borderRadius: 12, padding: 12, gap: 6 },
  meta: { color: C.muted, fontSize: 12 },
  errorText: { color: C.danger, fontFamily: mono, fontSize: 13 },
  title: { color: C.text, fontSize: 18, fontWeight: '700', flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 4 },
  badge: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', marginTop: 4 },
  section: { gap: 6 },
  sectionTitle: { color: C.muted, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  body: { color: C.text, fontSize: 15, lineHeight: 21 },
  muted: { color: C.muted, fontSize: 14, lineHeight: 20 },
  code: {
    color: C.text,
    fontFamily: mono,
    fontSize: 12,
    backgroundColor: C.card,
    borderRadius: 8,
    padding: 10,
    overflow: 'hidden',
  },
  step: { gap: 4 },
  loading: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  button: { backgroundColor: C.accent, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
