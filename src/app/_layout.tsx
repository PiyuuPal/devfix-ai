import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { DevFix } from 'devfix-react-native';
import { useEffect, useMemo } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppProvider, useApp } from '@/context/AppProvider';
import { useColors } from '@/theme';

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { hydrated } = useApp();
  const colors = useColors();

  useEffect(() => {
    if (hydrated) SplashScreen.hideAsync();
  }, [hydrated]);

  const navTheme = useMemo(
    () => ({
      ...DarkTheme,
      colors: {
        ...DarkTheme.colors,
        primary: colors.primary,
        background: colors.background,
        card: colors.surface,
        text: colors.text,
        border: colors.border,
      },
    }),
    [colors],
  );

  // Keep the native splash visible until persisted settings/history are loaded.
  if (!hydrated) return null;

  return (
    <ThemeProvider value={navTheme}>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
        <Stack.Screen name="analyzing" options={{ animation: 'fade', gestureEnabled: false }} />
        <Stack.Screen name="result/[id]" />
      </Stack>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppProvider>
          {/* Dev only: captures runtime errors and explains them via devfix-server. */}
          <DevFix>
            <RootNavigator />
          </DevFix>
        </AppProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
