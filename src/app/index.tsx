import { LinearGradient } from 'expo-linear-gradient';
import { Redirect, router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText, GradientButton, Icon, Screen } from '@/components/ui';
import { useApp } from '@/context/AppProvider';
import { makeStyles, radius, spacing, useColors } from '@/theme';

/** Splash / Welcome — shown only until the user taps "Get Started" once. */
export default function WelcomeScreen() {
  const { settings, updateSettings } = useApp();
  const colors = useColors();
  const styles = useStyles();

  if (settings.hasSeenWelcome) return <Redirect href="/home" />;

  const start = () => {
    updateSettings({ hasSeenWelcome: true });
    router.replace('/home');
  };

  return (
    <Screen
      edges={['top', 'bottom']}
      contentStyle={styles.content}
      footer={
        <View style={styles.footer}>
          <GradientButton label="Get Started" onPress={start} accessibilityHint="Opens the error explainer" />
          <AppText variant="small" tone="muted" style={styles.center}>
            Built for Developers  •  Powered by AI
          </AppText>
        </View>
      }>
      <View style={styles.hero}>
        <LinearGradient colors={colors.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.logoRing}>
          <View style={styles.logo}>
            <Icon name="code" size={44} color={colors.text} />
          </View>
        </LinearGradient>
        <View style={styles.titles}>
          <AppText variant="display" style={styles.center} accessibilityRole="header">
            DevFix AI
          </AppText>
          <AppText variant="heading" tone="secondary" style={styles.center}>
            Smart Error Explainer
          </AppText>
        </View>
        <AppText variant="body" tone="secondary" style={[styles.center, styles.tagline]}>
          Paste your error. Get instant explanations and fixes for React Native, Expo, Android, iOS and backend
          errors.
        </AppText>
      </View>
    </Screen>
  );
}

const useStyles = makeStyles((c) =>
  StyleSheet.create({
    content: { flexGrow: 1, justifyContent: 'center' },
    hero: { alignItems: 'center', gap: spacing.xl, paddingVertical: spacing.xxl },
    logoRing: { padding: 2, borderRadius: radius.xl + 2 },
    logo: {
      width: 104,
      height: 104,
      borderRadius: radius.xl,
      backgroundColor: c.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    titles: { gap: spacing.xs },
    center: { textAlign: 'center' },
    tagline: { maxWidth: 320 },
    footer: { gap: spacing.md, paddingVertical: spacing.sm },
  }),
);
