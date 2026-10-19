import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';

import { AI_TIMEOUT_MS, HttpError, logUsage } from '../errors.js';
import { buildUserMessage, SYSTEM_PROMPT } from '../prompt.js';
import { AnalysisResultSchema, type AnalysisResult, type AnalyzeRequest } from '../schema.js';

export const DEFAULT_ANTHROPIC_MODEL = 'claude-opus-5-5';
// USD per million tokens; only used for the cost line in the log.
const PRICES: Record<string, { input: number; output: number }> = {
  'claude-opus-5-5': { input: 4, output: 20 },
  'claude-sonnet-5-5': { input: 2, output: 10 },
  'claude-haiku-5-5': { input: 0.1, output: 0.5 },
};

let client: Anthropic | undefined;
// Created on first use so .env (loaded in index.ts after imports run) is picked up.
const getClient = () => (client ??= new Anthropic({ timeout: AI_TIMEOUT_MS, maxRetries: 0 }));

export async function analyzeWithAnthropic(
  req: AnalyzeRequest,
  model: string,
  signal?: AbortSignal,
): Promise<AnalysisResult> {
  let response;
  try {
    response = await getClient().beta.messages.parse(
      {
        model,
        max_tokens: 16_000,
        output_config: { effort: 'medium', format: betaZodOutputFormat(AnalysisResultSchema) },
        // If a safety classifier declines a (benign) request, retry it server-side
        // on Anthropic's recommended fallback model instead of failing.
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: buildUserMessage(req) }],
      },
      { signal },
    );
  } catch (e) {
    // Keep the real reason in the server log (e.g. "credit balance too low"); the app gets a friendly message.
    if (e instanceof Anthropic.APIError) console.warn(`Anthropic API error ${e.status}: ${e.message}`);
    if (e instanceof Anthropic.RateLimitError) throw new HttpError(503, 'AI service is busy. Please try again shortly.');
    if (e instanceof Anthropic.AuthenticationError) throw new HttpError(500, 'Server is misconfigured (API key).');
    if (e instanceof Anthropic.APIConnectionTimeoutError) throw new HttpError(504, 'Analysis took too long. Please try again.');
    if (e instanceof Anthropic.APIError) throw new HttpError(502, 'AI service error. Please try again.');
    throw e;
  }

  if (response.stop_reason === 'refusal') {
    throw new HttpError(422, 'This input could not be analysed. Try removing unrelated content.');
  }
  if (response.stop_reason === 'max_tokens' || !response.parsed_output) {
    throw new HttpError(502, 'The AI returned an incomplete answer. Please try again.');
  }
  logUsage(model, response.usage.input_tokens, response.usage.output_tokens, PRICES[model]);
  return response.parsed_output;
}
