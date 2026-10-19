import { useMemo } from 'react';

import { useApp } from '@/context/AppProvider';

import { palettes, type Palette } from './colors';

export * from './tokens';
export type { Palette } from './colors';

export function useColors(): Palette {
  const { settings } = useApp();
  return palettes[settings.theme];
}

/**
 * Builds theme-aware styles once per palette.
 * Usage: `const useStyles = makeStyles((c) => StyleSheet.create({...}))`.
 */
export function makeStyles<T>(factory: (colors: Palette) => T) {
  return function useStyles(): T {
    const colors = useColors();
    return useMemo(() => factory(colors), [colors]);
  };
}
