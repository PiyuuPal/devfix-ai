export type ThemeName = 'dark' | 'midnight';

/** Language the explanation is written in. */
export type ExplanationLanguage = 'english' | 'hinglish';

export interface AppSettings {
  theme: ThemeName;
  explanationLanguage: ExplanationLanguage;
  hasSeenWelcome: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  explanationLanguage: 'english',
  hasSeenWelcome: false,
};
