import Storage from 'expo-sqlite/kv-store';

/** Small async key-value wrapper (SQLite-backed on native). */
export const storage = {
  getItem: (key: string) => Storage.getItem(key),
  setItem: (key: string, value: string) => Storage.setItem(key, value),
  removeItem: (key: string) => Storage.removeItem(key),
};
