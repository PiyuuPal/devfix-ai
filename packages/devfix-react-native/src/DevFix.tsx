import { Component, useEffect, type ErrorInfo, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { installCapture, reportError } from './capture';
import { Bubble, Panel } from './Panel';
import { store } from './store';
import type { DevFixOptions } from './types';

export interface DevFixProps extends DevFixOptions {
  children: ReactNode;
  /** Defaults to __DEV__. DevFix never runs in production builds unless you force it. */
  enabled?: boolean;
}

/**
 * Wrap your app root with this. In development it captures runtime errors and
 * shows a floating 🩺 button that explains them with AI via devfix-server.
 * In production it renders children only.
 */
export function DevFix({ children, enabled = __DEV__, ...options }: DevFixProps) {
  const { serverUrl, serverPort, tech, language, captureConsoleErrors } = options;

  useEffect(() => {
    if (!enabled) return;
    store.setOptions({ serverUrl, serverPort, tech, language, captureConsoleErrors });
  }, [enabled, serverUrl, serverPort, tech, language, captureConsoleErrors]);

  useEffect(() => {
    if (!enabled) return;
    return installCapture({ captureConsoleErrors });
  }, [enabled, captureConsoleErrors]);

  if (!enabled) return <>{children}</>;
  return (
    <View style={styles.root}>
      <DevFixErrorBoundary>{children}</DevFixErrorBoundary>
      <Bubble />
      <Panel />
    </View>
  );
}

interface BoundaryState {
  error: Error | null;
  entryId: string | null;
}

/**
 * Catches render errors below it and offers "Explain with AI" + "Try again".
 * <DevFix> already includes one; use this directly to protect a single screen.
 * Pass-through in production so it never changes release behaviour.
 */
class Boundary extends Component<{ children: ReactNode }, BoundaryState> {
  state: BoundaryState = { error: null, entryId: null };

  static getDerivedStateFromError(error: Error): Partial<BoundaryState> {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    const entry = reportError(error, {
      componentStack: info.componentStack ?? undefined,
      source: 'boundary',
      isFatal: true,
    });
    this.setState({ entryId: entry.id });
  }

  render() {
    const { error, entryId } = this.state;
    if (!error) return this.props.children;
    return (
      <View style={styles.fallback}>
        <Text style={styles.fallbackTitle}>Something crashed while rendering</Text>
        <Text style={styles.fallbackMessage} selectable>
          {error.name}: {error.message}
        </Text>
        <Pressable style={styles.primary} onPress={() => store.open(entryId)} accessibilityRole="button">
          <Text style={styles.primaryText}>✨ Explain with AI</Text>
        </Pressable>
        <Pressable
          style={styles.secondary}
          onPress={() => this.setState({ error: null, entryId: null })}
          accessibilityRole="button">
          <Text style={styles.secondaryText}>Try again</Text>
        </Pressable>
      </View>
    );
  }
}

function PassThrough({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export const DevFixErrorBoundary = __DEV__ ? Boundary : PassThrough;

const styles = StyleSheet.create({
  root: { flex: 1 },
  fallback: { flex: 1, justifyContent: 'center', padding: 24, gap: 14, backgroundColor: '#0B1020' },
  fallbackTitle: { color: '#E6E9F2', fontSize: 20, fontWeight: '700' },
  fallbackMessage: { color: '#FF6B6B', fontFamily: 'monospace', fontSize: 13 },
  primary: { backgroundColor: '#6D7CFF', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  primaryText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  secondary: { borderColor: '#26304A', borderWidth: 1, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  secondaryText: { color: '#E6E9F2', fontSize: 16 },
});
