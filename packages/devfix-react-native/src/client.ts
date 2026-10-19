import { Platform } from 'react-native';

import { cleanStack } from './stack';
import { store } from './store';
import type { CapturedError, DevFixOptions, Explanation } from './types';

const MAX_ERROR_TEXT = 10_000; // devfix-server's limit
const TIMEOUT_MS = 60_000;

function metroHost(): string | undefined {
  try {
    // Optional: present in Expo projects. Bare RN apps should pass serverUrl.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Constants = require('expo-constants').default;
    const hostUri: string | undefined = Constants?.expoConfig?.hostUri;
    return hostUri?.split(':')[0];
  } catch {
    return undefined;
  }
}

export function resolveServerUrl(opts: DevFixOptions = store.getOptions()): string {
  if (opts.serverUrl) return opts.serverUrl.replace(/\/$/, '');
  const host = metroHost() ?? (Platform.OS === 'android' ? '10.0.2.2' : 'localhost');
  return `http://${host}:${opts.serverPort ?? 3000}`;
}

function buildErrorText(e: CapturedError): string {
  const parts = [`${e.name}: ${e.message}`];
  const stack = e.stack ? cleanStack(e.stack) : undefined;
  if (stack && !stack.includes(e.message)) parts.push(stack);
  else if (stack) parts[0] = stack;
  if (e.componentStack) parts.push(`Component stack:\n${cleanStack(e.componentStack.trim())}`);
  const text = parts.join('\n\n');
  // Keep the top of the trace; that's where the cause usually is.
  return text.length > MAX_ERROR_TEXT ? `${text.slice(0, MAX_ERROR_TEXT - 20)}\n…(truncated)` : text;
}

function buildContext(e: CapturedError): string {
  const rn = (Platform.constants as { reactNativeVersion?: { major: number; minor: number; patch: number } })
    .reactNativeVersion;
  return [
    `Runtime error captured inside a running ${Platform.OS} app (OS version ${Platform.Version}).`,
    rn ? `React Native ${rn.major}.${rn.minor}.${rn.patch}.` : '',
    `Captured via ${e.source}${e.isFatal ? ', fatal' : ''}.`,
  ]
    .filter(Boolean)
    .join(' ');
}

/** Sends a captured error to devfix-server and stores the explanation on it. */
export async function explain(id: string): Promise<Explanation | undefined> {
  const entry = store.get(id);
  if (!entry || entry.status === 'loading') return entry?.explanation;
  const opts = store.getOptions();
  const url = `${resolveServerUrl(opts)}/analyze`;

  store.update(id, { status: 'loading', failure: undefined });
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tech: opts.tech ?? 'expo',
        errorText: buildErrorText(entry),
        context: buildContext(entry),
        language: 'auto',
        explanationLanguage: opts.language ?? 'english',
      }),
      signal: controller.signal,
    });
    const body = await res.json().catch(() => null);
    if (!res.ok || !body?.title) {
      throw new Error(typeof body?.error === 'string' ? body.error : `Server responded with ${res.status}`);
    }
    store.update(id, { status: 'done', explanation: body as Explanation });
    return body as Explanation;
  } catch (e) {
    const failure = controller.signal.aborted
      ? 'Timed out waiting for devfix-server.'
      : e instanceof TypeError
        ? `Can't reach devfix-server at ${url}. Is it running (npx devfix-server) and on the same network?`
        : (e as Error).message;
    store.update(id, { status: 'failed', failure });
    return undefined;
  } finally {
    clearTimeout(timer);
  }
}
