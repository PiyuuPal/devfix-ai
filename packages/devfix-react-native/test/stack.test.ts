import assert from 'node:assert/strict';
import { test } from 'node:test';

import { cleanStack } from '../src/stack.ts';

test('strips Metro bundle URLs but keeps function names', () => {
  const stack = [
    'TypeError: undefined is not a function',
    '    at Foo (http://10.0.2.2:8081/node_modules/expo-router/entry.bundle//&platform=android:220752:24)',
    '    at Bar (http://localhost:8081/index.bundle?platform=ios:10:5)',
  ].join('\n');
  assert.equal(cleanStack(stack), 'TypeError: undefined is not a function\n    at Foo\n    at Bar');
});

test('caps the trace at 15 frames and says how many were dropped', () => {
  const frames = Array.from({ length: 20 }, (_, i) => `    at fn${i} (http://x:8081/a.bundle:1:${i})`);
  const lines = cleanStack(['Error: boom', ...frames].join('\n')).split('\n');
  assert.equal(lines.length, 1 + 15 + 1);
  assert.equal(lines.at(-2), '    at fn14');
  assert.equal(lines.at(-1), '    … 5 more frames');
});

test('leaves a stack without URLs unchanged', () => {
  const stack = 'Error: boom\n    at App\n    at View';
  assert.equal(cleanStack(stack), stack);
});
