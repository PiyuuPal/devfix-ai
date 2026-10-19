export type TechType = 'react-native' | 'expo' | 'android' | 'ios' | 'backend';

/** Programming language of the failing code. `auto` lets the analyzer infer it. */
export type CodeLanguage =
  | 'auto'
  | 'typescript'
  | 'javascript'
  | 'kotlin'
  | 'java'
  | 'swift'
  | 'objective-c'
  | 'python'
  | 'go'
  | 'other';

export type Confidence = 'high' | 'medium' | 'low';

export interface AnalysisRequest {
  tech: TechType;
  errorText: string;
  context?: string;
  language: CodeLanguage;
}

export interface SolutionStep {
  title: string;
  description?: string;
  command?: string;
}

/** Mirrors the structured JSON the AI backend is expected to return. */
export interface AnalysisResult {
  title: string;
  rootCause: string;
  explanation: string;
  evidence: string;
  solution: SolutionStep[];
  verification: string[];
  confidence: Confidence;
  additionalInfo?: string;
}

export interface HistoryEntry {
  id: string;
  createdAt: number;
  request: AnalysisRequest;
  result: AnalysisResult;
}
