import { z } from 'zod/v4';

/** Body the app sends: AnalysisRequest + explanationLanguage (see src/types in the app). */
export const AnalyzeRequestSchema = z.object({
  tech: z.enum(['react-native', 'expo', 'android', 'ios', 'backend']),
  errorText: z.string().trim().min(10).max(10_000),
  context: z.string().max(2_000).optional(),
  language: z.enum([
    'auto',
    'typescript',
    'javascript',
    'kotlin',
    'java',
    'swift',
    'objective-c',
    'python',
    'go',
    'other',
  ]),
  explanationLanguage: z.enum(['english', 'hinglish']).default('english'),
});

export type AnalyzeRequest = z.infer<typeof AnalyzeRequestSchema>;

/**
 * Shape Claude must return (enforced via structured outputs). Mirrors the app's
 * AnalysisResult. Optional fields are required-but-empty-string here so the
 * schema stays simple; the app's parseResult turns '' into undefined.
 */
export const AnalysisResultSchema = z.object({
  title: z.string().describe('Short name of the problem, max ~80 chars'),
  rootCause: z.string().describe('One or two sentences: the actual underlying cause'),
  explanation: z.string().describe('Why this happens, in plain language'),
  evidence: z.string().describe('The exact lines from the input that prove the diagnosis'),
  solution: z
    .array(
      z.object({
        title: z.string().describe('The action to take, imperative'),
        description: z.string().describe('Extra detail, or empty string'),
        command: z.string().describe('A single shell command or code snippet, or empty string'),
      }),
    )
    .describe('Ordered fix steps, most likely fix first'),
  verification: z.array(z.string()).describe('How to confirm the fix worked'),
  confidence: z.enum(['high', 'medium', 'low']),
  additionalInfo: z.string().describe('Prevention tips or caveats, or empty string'),
});

export type AnalysisResult = z.infer<typeof AnalysisResultSchema>;
