import assert from 'node:assert/strict';
import { test } from 'node:test';

import { AnalysisResultSchema, AnalyzeRequestSchema } from '../src/schema.js';

const valid = { tech: 'expo', errorText: 'Unable to resolve module expo-camera', language: 'auto' };

test('accepts a valid request and defaults explanationLanguage to english', () => {
  const parsed = AnalyzeRequestSchema.parse(valid);
  assert.equal(parsed.explanationLanguage, 'english');
});

test('rejects error text under 10 characters (after trimming)', () => {
  assert.equal(AnalyzeRequestSchema.safeParse({ ...valid, errorText: '   short   ' }).success, false);
});

test('rejects error text over 10,000 characters', () => {
  assert.equal(AnalyzeRequestSchema.safeParse({ ...valid, errorText: 'x'.repeat(10_001) }).success, false);
});

test('rejects context over 2,000 characters', () => {
  assert.equal(AnalyzeRequestSchema.safeParse({ ...valid, context: 'x'.repeat(2_001) }).success, false);
});

test('rejects unknown tech and language values', () => {
  assert.equal(AnalyzeRequestSchema.safeParse({ ...valid, tech: 'flutter' }).success, false);
  assert.equal(AnalyzeRequestSchema.safeParse({ ...valid, language: 'rust' }).success, false);
});

test('result schema rejects an invalid confidence', () => {
  const result = {
    title: 't',
    rootCause: 'r',
    explanation: 'e',
    evidence: 'ev',
    solution: [{ title: 's', description: '', command: '' }],
    verification: ['v'],
    confidence: 'high',
    additionalInfo: '',
  };
  assert.equal(AnalysisResultSchema.safeParse(result).success, true);
  assert.equal(AnalysisResultSchema.safeParse({ ...result, confidence: 'certain' }).success, false);
});
