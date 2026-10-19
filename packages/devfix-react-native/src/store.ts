import type { CapturedError, DevFixOptions, ErrorSource } from './types';

const MAX_ERRORS = 20;
const DEDUPE_MS = 5_000;
const SOURCE_RANK: Record<ErrorSource, number> = { console: 0, manual: 1, global: 2, boundary: 3 };

export interface DevFixState {
  errors: CapturedError[];
  panelOpen: boolean;
  selectedId: string | null;
}

let state: DevFixState = { errors: [], panelOpen: false, selectedId: null };
// What React sees; only replaced when listeners are notified.
let published = state;
let options: DevFixOptions = {};
const listeners = new Set<() => void>();
let notifyScheduled = false;
let nextId = 1;

// Errors (especially console.error) can arrive while React is rendering, so
// listeners are notified on a later tick to avoid "update while rendering" loops.
function setState(patch: Partial<DevFixState>) {
  state = { ...state, ...patch };
  if (notifyScheduled) return;
  notifyScheduled = true;
  setTimeout(() => {
    notifyScheduled = false;
    published = state;
    listeners.forEach((l) => l());
  }, 0);
}

export const store = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  getState: () => published,
  getOptions: () => options,
  setOptions(next: DevFixOptions) {
    options = next;
  },

  add(entry: Omit<CapturedError, 'id' | 'at' | 'status'>): CapturedError {
    const now = Date.now();
    // The same error is often reported twice (global handler + console.error).
    const dupe = state.errors.find((e) => e.message === entry.message && now - e.at < DEDUPE_MS);
    if (dupe) {
      // Keep the most informative report: a render crash from the error boundary
      // beats the console.error copy React logs for the same error.
      const better = SOURCE_RANK[entry.source] > SOURCE_RANK[dupe.source];
      if (better || (!dupe.componentStack && entry.componentStack)) {
        store.update(dupe.id, {
          componentStack: dupe.componentStack ?? entry.componentStack,
          ...(better && { source: entry.source, isFatal: dupe.isFatal || entry.isFatal }),
        });
      }
      return dupe;
    }
    const captured: CapturedError = { ...entry, id: String(nextId++), at: now, status: 'idle' };
    setState({ errors: [captured, ...state.errors].slice(0, MAX_ERRORS) });
    return captured;
  },

  update(id: string, patch: Partial<CapturedError>) {
    setState({ errors: state.errors.map((e) => (e.id === id ? { ...e, ...patch } : e)) });
  },

  get(id: string) {
    return state.errors.find((e) => e.id === id);
  },

  open(selectedId: string | null = null) {
    setState({ panelOpen: true, selectedId });
  },
  select(selectedId: string | null) {
    setState({ selectedId });
  },
  close() {
    setState({ panelOpen: false, selectedId: null });
  },
  clear() {
    setState({ errors: [], selectedId: null });
  },
};
