export type Tech = 'react-native' | 'expo' | 'android' | 'ios' | 'backend';
export type ExplanationLanguage = 'english' | 'hinglish';
export type Confidence = 'high' | 'medium' | 'low';

/** Same shape devfix-server returns from POST /analyze. */
export interface Explanation {
  title: string;
  rootCause: string;
  explanation: string;
  evidence: string;
  solution: { title: string; description?: string; command?: string }[];
  verification: string[];
  confidence: Confidence;
  additionalInfo?: string;
}

export type ErrorSource = 'global' | 'boundary' | 'console' | 'manual';

export interface CapturedError {
  id: string;
  name: string;
  message: string;
  stack?: string;
  componentStack?: string;
  source: ErrorSource;
  isFatal: boolean;
  at: number;
  status: 'idle' | 'loading' | 'done' | 'failed';
  explanation?: Explanation;
  failure?: string;
}

export interface DevFixOptions {
  /** Full URL of devfix-server. Defaults to http://<Metro host>:<serverPort>. */
  serverUrl?: string;
  /** Port used when serverUrl is derived from the Metro host. Default 3000. */
  serverPort?: number;
  /** Default 'expo'. */
  tech?: Tech;
  /** Default 'english'. */
  language?: ExplanationLanguage;
  /** Also capture console.error calls (React warnings etc.). Default true. */
  captureConsoleErrors?: boolean;
}
