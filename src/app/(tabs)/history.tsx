import { router } from 'expo-router';
import { useDeferredValue, useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

import { HistoryItem } from '@/components/history/HistoryItem';
import { Screen, ScreenHeader, SearchBar, StateView } from '@/components/ui';
import { techOption } from '@/constants/options';
import { useApp } from '@/context/AppProvider';
import { spacing } from '@/theme';
import type { HistoryEntry } from '@/types/analysis';
import { confirmDestructive } from '@/utils/confirm';

function matches(entry: HistoryEntry, q: string) {
  return [entry.result.title, entry.request.errorText, entry.result.rootCause, techOption(entry.request.tech).label]
    .join(' ')
    .toLowerCase()
    .includes(q);
}

export default function HistoryScreen() {
  const { history, removeHistoryEntry } = useApp();
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);

  const filtered = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    return q ? history.filter((e) => matches(e, q)) : history;
  }, [history, deferredQuery]);

  const confirmDelete = (entry: HistoryEntry) =>
    confirmDestructive('Delete analysis?', entry.result.title, 'Delete', () => removeHistoryEntry(entry.id));

  if (history.length === 0) {
    return (
      <Screen header={<ScreenHeader title="History" />} contentStyle={styles.fill}>
        <StateView
          icon="history"
          title="No saved analyses yet"
          message="Every error you explain is saved here so you can revisit the fix later."
          actionLabel="Explain an Error"
          onAction={() => router.navigate('/home')}
        />
      </Screen>
    );
  }

  return (
    <Screen
      scroll={false}
      header={
        <ScreenHeader
          title="History"
          subtitle={`${history.length} saved ${history.length === 1 ? 'analysis' : 'analyses'}`}
        />
      }>
      <View style={styles.search}>
        <SearchBar value={query} onChangeText={setQuery} placeholder="Search past errors…" />
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(e) => e.id}
        contentContainerStyle={[styles.list, filtered.length === 0 && styles.fill]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        renderItem={({ item }) => (
          <HistoryItem
            entry={item}
            onPress={() => router.push({ pathname: '/result/[id]', params: { id: item.id } })}
            onLongPress={() => confirmDelete(item)}
          />
        )}
        ListEmptyComponent={
          <StateView
            icon="search"
            title="No matches"
            message={`Nothing in your history matches “${query.trim()}”.`}
            secondaryLabel="Clear Search"
            onSecondary={() => setQuery('')}
          />
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  fill: { flexGrow: 1 },
  search: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.sm },
});
