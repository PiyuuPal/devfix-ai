import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { loadHistory, loadSettings, MAX_HISTORY, saveHistory, saveSettings } from '@/services/persistence';
import type { AnalysisRequest, AnalysisResult, HistoryEntry } from '@/types/analysis';
import { DEFAULT_SETTINGS, type AppSettings } from '@/types/settings';
import { createId } from '@/utils/format';

interface AppContextValue {
  hydrated: boolean;
  settings: AppSettings;
  updateSettings: (patch: Partial<AppSettings>) => void;
  history: HistoryEntry[];
  addHistoryEntry: (request: AnalysisRequest, result: AnalysisResult) => HistoryEntry;
  removeHistoryEntry: (id: string) => void;
  clearHistory: () => void;
  /** Request handed from Home to the Analyzing screen (too large for route params). */
  pendingRequest: AnalysisRequest | null;
  setPendingRequest: (request: AnalysisRequest | null) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [pendingRequest, setPendingRequest] = useState<AnalysisRequest | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([loadSettings(), loadHistory()]).then(([s, h]) => {
      if (!active) return;
      setSettings(s);
      setHistory(h);
      setHydrated(true);
    });
    return () => {
      active = false;
    };
  }, []);

  const updateSettings = useCallback((patch: Partial<AppSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      saveSettings(next);
      return next;
    });
  }, []);

  const updateHistory = useCallback((fn: (prev: HistoryEntry[]) => HistoryEntry[]) => {
    setHistory((prev) => {
      const next = fn(prev).slice(0, MAX_HISTORY);
      saveHistory(next);
      return next;
    });
  }, []);

  const addHistoryEntry = useCallback(
    (request: AnalysisRequest, result: AnalysisResult) => {
      const entry: HistoryEntry = { id: createId(), createdAt: Date.now(), request, result };
      updateHistory((prev) => [entry, ...prev]);
      return entry;
    },
    [updateHistory],
  );

  const removeHistoryEntry = useCallback(
    (id: string) => updateHistory((prev) => prev.filter((e) => e.id !== id)),
    [updateHistory],
  );

  const clearHistory = useCallback(() => updateHistory(() => []), [updateHistory]);

  const value = useMemo<AppContextValue>(
    () => ({
      hydrated,
      settings,
      updateSettings,
      history,
      addHistoryEntry,
      removeHistoryEntry,
      clearHistory,
      pendingRequest,
      setPendingRequest,
    }),
    [hydrated, settings, updateSettings, history, addHistoryEntry, removeHistoryEntry, clearHistory, pendingRequest],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>');
  return ctx;
}
