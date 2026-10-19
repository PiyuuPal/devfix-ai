import { store } from './store';
import type { CapturedError, ErrorSource } from './types';

function normalize(value: unknown): { name: string; message: string; stack?: string } {
  if (value instanceof Error) {
    return { name: value.name || 'Error', message: value.message, stack: value.stack };
  }
  if (typeof value === 'string') return { name: 'Error', message: value };
  try {
    return { name: 'Error', message: JSON.stringify(value) };
  } catch {
    return { name: 'Error', message: String(value) };
  }
}

/** Manually report an error (e.g. from a catch block) so it shows up in DevFix. */
export function reportError(
  error: unknown,
  extra: { componentStack?: string; isFatal?: boolean; source?: ErrorSource } = {},
): CapturedError {
  return store.add({
    ...normalize(error),
    componentStack: extra.componentStack,
    isFatal: extra.isFatal ?? false,
    source: extra.source ?? 'manual',
  });
}

/** Hooks the global JS error handler (and optionally console.error). Returns an uninstaller. */
export function installCapture({ captureConsoleErrors = true } = {}): () => void {
  const previousHandler = ErrorUtils.getGlobalHandler();
  ErrorUtils.setGlobalHandler((error, isFatal) => {
    reportError(error, { isFatal: !!isFatal, source: 'global' });
    // Keep LogBox / the red screen working as usual.
    previousHandler(error, isFatal);
  });

  const originalConsoleError = console.error;
  let reporting = false;
  if (captureConsoleErrors) {
    console.error = (...args: unknown[]) => {
      if (!reporting) {
        reporting = true;
        try {
          const err = args.find((a) => a instanceof Error);
          reportError(err ?? args.map((a) => (typeof a === 'string' ? a : normalize(a).message)).join(' '), {
            source: 'console',
          });
        } finally {
          reporting = false;
        }
      }
      originalConsoleError(...args);
    };
  }

  return () => {
    ErrorUtils.setGlobalHandler(previousHandler);
    if (captureConsoleErrors) console.error = originalConsoleError;
  };
}
