import Constants from 'expo-constants';
import { useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';

import { SettingsGroup, SettingsRow } from '@/components/settings/SettingsRow';
import { AppText, Card, Icon, Screen, ScreenHeader, SelectSheet } from '@/components/ui';
import { THEME_OPTIONS, labelFor } from '@/constants/options';
import { useApp } from '@/context/AppProvider';
import { isMockMode } from '@/services/analysisService';
import { spacing, useColors } from '@/theme';
import { confirmDestructive } from '@/utils/confirm';

type Sheet = 'theme' | null;

export default function SettingsScreen() {
  const { settings, updateSettings, history, clearHistory } = useApp();
  const colors = useColors();
  const [sheet, setSheet] = useState<Sheet>(null);
  const version = Constants.expoConfig?.version ?? '1.0.0';

  const onClearHistory = () =>
    confirmDestructive(
      'Clear history?',
      `This permanently deletes ${history.length} saved ${history.length === 1 ? 'analysis' : 'analyses'}.`,
      'Clear',
      clearHistory,
    );

  return (
    <Screen header={<ScreenHeader title="Settings" />}>
      <SettingsGroup title="App Settings">
        <SettingsRow
          icon="moon"
          label="Theme"
          value={labelFor(THEME_OPTIONS, settings.theme)}
          onPress={() => setSheet('theme')}
        />
        <SettingsRow
          icon="trash"
          label="Clear History"
          value={history.length ? String(history.length) : 'Empty'}
          destructive={history.length > 0}
          onPress={history.length ? onClearHistory : undefined}
        />
      </SettingsGroup>

      <SettingsGroup title="Analysis Engine">
        <SettingsRow icon="cpu" label="Mode" value={isMockMode ? 'Offline mock' : 'Secure backend'} />
        <SettingsRow icon="sparkles" label="Model" value={isMockMode ? 'Pattern matcher' : 'Configured on server'} />
      </SettingsGroup>

      <SettingsGroup title="About">
        <SettingsRow icon="info" label="About DevFix AI" value={`v${version}`} />
        <SettingsRow
          icon="doc"
          label="Expo documentation"
          onPress={() => Linking.openURL('https://docs.expo.dev')}
          accessibilityHint="Opens in the browser"
        />
      </SettingsGroup>

      <Card style={[styles.secure, { borderColor: `${colors.success}55`, backgroundColor: `${colors.success}12` }]}>
        <Icon name="shield" size={28} color={colors.success} />
        <View style={styles.secureText}>
          <AppText variant="subheading" tone="success">
            Your API key stays secure
          </AppText>
          <AppText variant="small" tone="secondary">
            DevFix AI never stores AI provider keys in the app. Requests go through your own backend
            (EXPO_PUBLIC_ANALYSIS_API_URL), which keeps the secret server-side.
          </AppText>
        </View>
      </Card>

      <SelectSheet
        visible={sheet === 'theme'}
        title="Theme"
        options={THEME_OPTIONS}
        value={settings.theme}
        onSelect={(theme) => updateSettings({ theme })}
        onClose={() => setSheet(null)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  secure: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  secureText: { flex: 1, gap: spacing.xs },
});
