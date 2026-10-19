import type { IconName } from '@/components/ui/Icon';
import type { CodeLanguage, Confidence, TechType } from '@/types/analysis';
import type { ExplanationLanguage, ThemeName } from '@/types/settings';

export interface Option<T extends string> {
  value: T;
  label: string;
  description?: string;
}

export interface TechOption extends Option<TechType> {
  icon: IconName;
  examples: string[];
}

export const TECH_OPTIONS: TechOption[] = [
  {
    value: 'react-native',
    label: 'React Native',
    icon: 'react',
    examples: ['Metro bundler error', 'Red screen / Invariant Violation', 'Network request failed'],
  },
  {
    value: 'expo',
    label: 'Expo',
    icon: 'expo',
    examples: ['Cannot find native module', 'Config plugin error', 'EAS build failure'],
  },
  {
    value: 'android',
    label: 'Android',
    icon: 'android',
    examples: ['Gradle build error', 'INSTALL_FAILED_*', 'SDK location not found'],
  },
  {
    value: 'ios',
    label: 'iOS',
    icon: 'ios',
    examples: ['CocoaPods error', 'Xcode compilation error', 'Signing error'],
  },
  {
    value: 'backend',
    label: 'Backend',
    icon: 'server',
    examples: ['ECONNREFUSED / EADDRINUSE', 'Unhandled exception', 'CORS error'],
  },
];

export const LANGUAGE_OPTIONS: Option<CodeLanguage>[] = [
  { value: 'auto', label: 'Auto (Recommended)', description: 'Detect from the error text' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'kotlin', label: 'Kotlin' },
  { value: 'java', label: 'Java' },
  { value: 'swift', label: 'Swift' },
  { value: 'objective-c', label: 'Objective-C' },
  { value: 'python', label: 'Python' },
  { value: 'go', label: 'Go' },
  { value: 'other', label: 'Other' },
];

export const THEME_OPTIONS: Option<ThemeName>[] = [
  { value: 'dark', label: 'Dark', description: 'Deep navy with blue–purple accents' },
  { value: 'midnight', label: 'Midnight', description: 'Pure black, easier on OLED batteries' },
];

export const EXPLANATION_LANGUAGE_OPTIONS: Option<ExplanationLanguage>[] = [
  { value: 'english', label: 'English' },
  { value: 'hinglish', label: 'Hinglish', description: 'Simple Hindi + English explanations' },
];

export const CONFIDENCE_LABELS: Record<Confidence, string> = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

export function labelFor<T extends string>(options: Option<T>[], value: T): string {
  return options.find((o) => o.value === value)?.label ?? value;
}

export function techOption(value: TechType): TechOption {
  return TECH_OPTIONS.find((o) => o.value === value) ?? TECH_OPTIONS[0];
}
