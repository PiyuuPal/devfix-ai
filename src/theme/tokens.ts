import { Platform } from 'react-native';

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

export const fonts = {
  mono: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
} as const;

export const typography = {
  display: { fontSize: 34, fontWeight: '800', letterSpacing: -0.5 },
  title: { fontSize: 24, fontWeight: '700', letterSpacing: -0.3 },
  heading: { fontSize: 18, fontWeight: '700' },
  subheading: { fontSize: 15, fontWeight: '600' },
  body: { fontSize: 15, fontWeight: '400', lineHeight: 22 },
  small: { fontSize: 13, fontWeight: '400', lineHeight: 18 },
  caption: { fontSize: 11, fontWeight: '600', letterSpacing: 0.3 },
  code: { fontSize: 13, lineHeight: 20, fontFamily: fonts.mono },
} as const;

/** Content is centered and capped on tablets / web. */
export const maxContentWidth = 720;

/** Minimum touch target recommended by Apple HIG / Material. */
export const minTouchTarget = 44;
