import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';

import { resolveProvider } from '../src/analyze.js';

const VARS = ['AI_PROVIDER', 'AI_MODEL', 'ANTHROPIC_API_KEY', 'OPENROUTER_API_KEY', 'OPENAI_API_KEY'];
const saved = Object.fromEntries(VARS.map((v) => [v, process.env[v]]));

function setEnv(env: Record<string, string>) {
  for (const v of VARS) delete process.env[v];
  Object.assign(process.env, env);
}

afterEach(() => {
  for (const v of VARS) {
    if (saved[v] === undefined) delete process.env[v];
    else process.env[v] = saved[v];
  }
});

test('defaults to anthropic when no key is set', () => {
  setEnv({});
  assert.equal(resolveProvider().provider, 'anthropic');
});

test('picks the first key found: anthropic → openrouter → openai', () => {
  setEnv({ OPENAI_API_KEY: 'x', OPENROUTER_API_KEY: 'x' });
  assert.equal(resolveProvider().provider, 'openrouter');
  setEnv({ OPENAI_API_KEY: 'x' });
  assert.equal(resolveProvider().provider, 'openai');
  setEnv({ OPENAI_API_KEY: 'x', ANTHROPIC_API_KEY: 'x' });
  assert.equal(resolveProvider().provider, 'anthropic');
});

test('AI_PROVIDER and AI_MODEL override the defaults', () => {
  setEnv({ ANTHROPIC_API_KEY: 'x', AI_PROVIDER: ' OpenAI ', AI_MODEL: 'my-model' });
  assert.deepEqual(resolveProvider(), { provider: 'openai', model: 'my-model' });
});

test('ignores an unknown AI_PROVIDER', () => {
  setEnv({ OPENAI_API_KEY: 'x', AI_PROVIDER: 'gemini' });
  assert.equal(resolveProvider().provider, 'openai');
});
