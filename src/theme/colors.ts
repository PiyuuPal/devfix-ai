import type { ThemeName } from '@/types/settings';

export interface Palette {
  background: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  borderStrong: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  primary: string;
  accent: string;
  /** Blue → purple brand gradient used on primary actions. */
  gradient: readonly [string, string];
  onPrimary: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
  codeBackground: string;
  codeText: string;
  overlay: string;
}

const dark: Palette = {
  background: '#0B1020',
  surface: '#131B2E',
  surfaceAlt: '#1A2340',
  border: '#24304F',
  borderStrong: '#34416A',
  text: '#F3F5FB',
  textSecondary: '#A3ACC7',
  textMuted: '#7F89A8',
  primary: '#6672FF',
  accent: '#8B5CF6',
  gradient: ['#4F6BFF', '#8B5CF6'],
  onPrimary: '#FFFFFF',
  success: '#34D399',
  warning: '#FBBF24',
  danger: '#FB7185',
  info: '#38BDF8',
  codeBackground: '#0A0F1D',
  codeText: '#C7D2FE',
  overlay: 'rgba(3, 6, 15, 0.72)',
};

/** Pure-black variant for OLED screens. */
const midnight: Palette = {
  ...dark,
  background: '#000000',
  surface: '#0C0F18',
  surfaceAlt: '#131826',
  border: '#1E2436',
  borderStrong: '#2C3450',
  codeBackground: '#05070D',
};

export const palettes: Record<ThemeName, Palette> = { dark, midnight };
