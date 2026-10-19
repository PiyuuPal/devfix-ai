/** Web fallback: localStorage avoids shipping the SQLite WASM bundle. */
function safe<T>(fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

export const storage = {
  getItem: async (key: string) => safe(() => window.localStorage.getItem(key), null),
  setItem: async (key: string, value: string) => safe(() => window.localStorage.setItem(key, value), undefined),
  removeItem: async (key: string) => safe(() => window.localStorage.removeItem(key), undefined),
};
