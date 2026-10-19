import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';

import { AI_TIMEOUT_MS, HttpError, logUsage } from '../errors.js';
import { buildUserMessage, SYSTEM_PROMPT } from '../prompt.js';
import { AnalysisResultSchema, type AnalysisResult, type AnalyzeRequest } from '../schema.js';

/** OpenAI directly, or OpenRouter (OpenAI-compatible API, one key for many vendors' models). */
export type OpenAIFlavor = 'openai' | 'openrouter';

export const DEFAULT_OPENAI_MODELS: Record<OpenAIFlavor, string> = {
  openai: 'gpt-6.1-sol',
  openrouter: 'openai/gpt-6.1-sol',
};

// USD per million tokens (OpenRouter list prices, 2026-10-15); only used for the log.
const PRICES: Record<string, { input: number; output: number }> = {
  'gpt-6.1-sol': { input: 2, output: 10 },
  'openai/gpt-6.1-sol': { input: 2, output: 10 },
  'openai/gpt-6-luna': { input: 0.1, output: 0.5 },
  'anthropic/claude-opus-5.5': { input: 4, output: 20 },
  'anthropic/claude-sonnet-5.5': { input: 2, output: 10 },
  'anthropic/claude-haiku-5.5': { input: 0.1, output: 0.5 },
  'google/gemini-3.8-flash': { input: 0.75, output: 3.75 },
};

const clients: Partial<Record<OpenAIFlavor, OpenAI>> = {};
function getClient(flavor: OpenAIFlavor) {
  return (clients[flavor] ??=
    flavor === 'openrouter'
      ? new OpenAI({
          apiKey: process.env.OPENROUTER_API_KEY,
          baseURL: 'https://openrouter.ai/api/v1',
          defaultHeaders: { 'X-Title': 'DevFix AI' },
          timeout: AI_TIMEOUT_MS,
          maxRetries: 0,
        })
      : new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: AI_TIMEOUT_MS, maxRetries: 0 }));
}

export async function analyzeWithOpenAI(
  req: AnalyzeRequest,
  flavor: OpenAIFlavor,
  model: string,
  signal?: AbortSignal,
): Promise<AnalysisResult> {
  let completion;
  try {
    completion = await getClient(flavor).chat.completions.parse(
      {
        model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: buildUserMessage(req) },
        ],
        response_format: zodResponseFormat(AnalysisResultSchema, 'analysis'),
      },
      { signal },
    );
  } catch (e) {
    if (e instanceof OpenAI.APIError) console.warn(`${flavor} API error ${e.status}: ${e.message}`);
    if (e instanceof OpenAI.RateLimitError) throw new HttpError(503, 'AI service is busy. Please try again shortly.');
    if (e instanceof OpenAI.AuthenticationError) throw new HttpError(500, 'Server is misconfigured (API key).');
    if (e instanceof OpenAI.APIError && e.status === 402) throw new HttpError(500, 'AI account is out of credits.');
    if (e instanceof OpenAI.APIConnectionTimeoutError) throw new HttpError(504, 'Analysis took too long. Please try again.');
    if (e instanceof OpenAI.APIError) throw new HttpError(502, 'AI service error. Please try again.');
    throw e;
  }

  const choice = completion.choices[0];
  if (choice?.message.refusal) {
    throw new HttpError(422, 'This input could not be analysed. Try removing unrelated content.');
  }
  if (!choice || choice.finish_reason === 'length' || !choice.message.parsed) {
    throw new HttpError(502, 'The AI returned an incomplete answer. Please try again.');
  }
  if (completion.usage) {
    logUsage(completion.model ?? model, completion.usage.prompt_tokens, completion.usage.completion_tokens, PRICES[model]);
  }
  return choice.message.parsed;
}
