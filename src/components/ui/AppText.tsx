import { Text, type TextProps } from 'react-native';

import { typography, useColors, type Palette } from '@/theme';

type Variant = keyof typeof typography;
type Tone = 'primary' | 'secondary' | 'muted' | 'accent' | 'success' | 'warning' | 'danger' | 'onPrimary';

const TONE_COLOR: Record<Tone, keyof Palette> = {
  primary: 'text',
  secondary: 'textSecondary',
  muted: 'textMuted',
  accent: 'primary',
  success: 'success',
  warning: 'warning',
  danger: 'danger',
  onPrimary: 'onPrimary',
};

export interface AppTextProps extends TextProps {
  variant?: Variant;
  tone?: Tone;
}

export function AppText({ variant = 'body', tone = 'primary', style, ...rest }: AppTextProps) {
  const colors = useColors();
  return <Text {...rest} style={[typography[variant], { color: colors[TONE_COLOR[tone]] as string }, style]} />;
}
