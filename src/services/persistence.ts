import type { HistoryEntry } from '@/types/analysis';
import { DEFAULT_SETTINGS, type AppSettings } from '@/types/settings';

import { storage } from './storage';

const HISTORY_KEY = 'devfix.history.v1';
const SETTINGS_KEY = 'devfix.settings.v1';
export const MAX_HISTORY = 50;

async function readJson<T>(key: string): Promise<T | null> {
  try {
    const raw = await storage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

async function writeJson(key: string, value: unknown) {
  try {
    await storage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn(`Failed to persist ${key}`, e);
  }
}

export async function loadHistory(): Promise<HistoryEntry[]> {
  const data = await readJson<HistoryEntry[]>(HISTORY_KEY);
  return Array.isArray(data) ? data.filter((e) => e?.id && e.result && e.request) : [];
}

export const saveHistory = (entries: HistoryEntry[]) => writeJson(HISTORY_KEY, entries.slice(0, MAX_HISTORY));

export async function loadSettings(): Promise<AppSettings> {
  const data = await readJson<Partial<AppSettings>>(SETTINGS_KEY);
  return { ...DEFAULT_SETTINGS, ...data };
}

export const saveSettings = (settings: AppSettings) => writeJson(SETTINGS_KEY, settings);
