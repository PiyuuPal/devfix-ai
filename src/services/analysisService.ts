import type { AnalysisRequest, AnalysisResult, Confidence } from '@/types/analysis';
import type { ExplanationLanguage } from '@/types/settings';

import { buildMockAnalysis } from './mockAnalyses';

/**
 * Analysis entry point for the whole app.
 *
 * SECURITY: the mobile app never talks to OpenAI (or any AI provider) directly
 * and never ships an API key. When EXPO_PUBLIC_ANALYSIS_API_URL is set, requests
 * go to YOUR backend, which holds the secret key server-side. EXPO_PUBLIC_*
 * values are embedded in the JS bundle, so only put a public URL there.
 * Without it, an offline mock analyzer is used.
 */

const API_URL = process.env.EXPO_PUBLIC_ANALYSIS_API_URL;
// The backend's AI call can take a while; it gives up at 50s, so wait a bit longer.
const REQUEST_TIMEOUT_MS = 60_000;

export class AnalysisError extends Error {
  constructor(
    message: string,
    readonly retryable = true,
  ) {
    super(message);
    this.name = 'AnalysisError';
  }
}

export interface AnalyzeOptions {
  signal?: AbortSignal;
  explanationLanguage?: ExplanationLanguage;
}

export const isMockMode = !API_URL;

export async function analyzeError(
  request: AnalysisRequest,
  options: AnalyzeOptions = {},
): Promise<AnalysisResult> {
  return API_URL ? analyzeRemote(API_URL, request, options) : analyzeMock(request, options.signal);
}

function delay(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(new AnalysisError('Analysis cancelled', false));
    });
  });
}

async function analyzeMock(request: AnalysisRequest, signal?: AbortSignal): Promise<AnalysisResult> {
  // Simulate network latency so loading states are visible.
  await delay(1200 + Math.random() * 800, signal);
  // Include "#simulate-error" in the input to exercise the error state.
  if (request.errorText.includes('#simulate-error')) {
    throw new AnalysisError('The analysis service is temporarily unavailable. Please try again.');
  }
  return buildMockAnalysis(request);
}

async function analyzeRemote(
  baseUrl: string,
  request: AnalysisRequest,
  { signal, explanationLanguage }: AnalyzeOptions,
): Promise<AnalysisResult> {
  const timeout = new AbortController();
  const timer = setTimeout(() => timeout.abort(), REQUEST_TIMEOUT_MS);
  signal?.addEventListener('abort', () => timeout.abort());

  try {
    const res = await fetch(`${baseUrl.replace(/\/$/, '')}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...request, explanationLanguage }),
      signal: timeout.signal,
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { error?: unknown } | null;
      const message =
        typeof body?.error === 'string' ? body.error : `Server responded with ${res.status}. Please try again.`;
      throw new AnalysisError(message, res.status >= 500 || res.status === 429);
    }
    return parseResult(await res.json());
  } catch (e) {
    if (e instanceof AnalysisError) throw e;
    if (signal?.aborted) throw new AnalysisError('Analysis cancelled', false);
    if (timeout.signal.aborted) throw new AnalysisError('The request timed out. Check your connection.');
    throw new AnalysisError('Could not reach the analysis server. Check your connection.');
  } finally {
    clearTimeout(timer);
  }
}

const CONFIDENCES: Confidence[] = ['high', 'medium', 'low'];

/** Validates untrusted JSON from the backend before it reaches the UI. */
export function parseResult(data: unknown): AnalysisResult {
  const d = (data ?? {}) as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === 'string' ? v : '');
  if (!str(d.title) || !str(d.rootCause)) {
    throw new AnalysisError('The server returned an unexpected response.', false);
  }
  const solution = Array.isArray(d.solution) ? d.solution : [];
  return {
    title: str(d.title),
    rootCause: str(d.rootCause),
    explanation: str(d.explanation),
    evidence: str(d.evidence),
    solution: solution
      .map((s) => {
        if (typeof s === 'string') return { title: s };
        const step = (s ?? {}) as Record<string, unknown>;
        return {
          title: str(step.title),
          description: str(step.description) || undefined,
          command: str(step.command) || undefined,
        };
      })
      .filter((s) => s.title),
    verification: Array.isArray(d.verification) ? d.verification.map(str).filter(Boolean) : [],
    confidence: CONFIDENCES.includes(d.confidence as Confidence) ? (d.confidence as Confidence) : 'low',
    additionalInfo: str(d.additionalInfo) || undefined,
  };
}
