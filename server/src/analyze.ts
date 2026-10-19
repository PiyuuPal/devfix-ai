import { analyzeWithAnthropic, DEFAULT_ANTHROPIC_MODEL } from './providers/anthropic.js';
import { analyzeWithOpenAI, DEFAULT_OPENAI_MODELS } from './providers/openai.js';
import type { AnalysisResult, AnalyzeRequest } from './schema.js';

export { HttpError } from './errors.js';

export type Provider = 'anthropic' | 'openai' | 'openrouter';

/**
 * AI_PROVIDER picks the backend explicitly; otherwise the first key found wins:
 * ANTHROPIC_API_KEY → anthropic, OPENROUTER_API_KEY → openrouter, OPENAI_API_KEY → openai.
 * AI_MODEL overrides the provider's default model.
 */
export function resolveProvider(): { provider: Provider; model: string } {
  const env = process.env;
  const explicit = env.AI_PROVIDER?.trim().toLowerCase();
  const provider: Provider =
    explicit === 'anthropic' || explicit === 'openai' || explicit === 'openrouter'
      ? explicit
      : env.ANTHROPIC_API_KEY
        ? 'anthropic'
        : env.OPENROUTER_API_KEY
          ? 'openrouter'
          : env.OPENAI_API_KEY
            ? 'openai'
            : 'anthropic';
  const model =
    env.AI_MODEL?.trim() || (provider === 'anthropic' ? DEFAULT_ANTHROPIC_MODEL : DEFAULT_OPENAI_MODELS[provider]);
  return { provider, model };
}

export const KEY_VARS: Record<Provider, string> = {
  anthropic: 'ANTHROPIC_API_KEY',
  openai: 'OPENAI_API_KEY',
  openrouter: 'OPENROUTER_API_KEY',
};

export function analyze(req: AnalyzeRequest, signal?: AbortSignal): Promise<AnalysisResult> {
  const { provider, model } = resolveProvider();
  return provider === 'anthropic'
    ? analyzeWithAnthropic(req, model, signal)
    : analyzeWithOpenAI(req, provider, model, signal);
}
