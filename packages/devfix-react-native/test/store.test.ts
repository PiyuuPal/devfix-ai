import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';

import { store } from '../src/store.ts';

const tick = () => new Promise((r) => setTimeout(r, 0));
const base = { name: 'Error', isFatal: false } as const;

beforeEach(async () => {
  store.clear();
  await tick();
});

test('adds errors newest first', async () => {
  store.add({ ...base, message: 'first', source: 'manual' });
  store.add({ ...base, message: 'second', source: 'manual' });
  await tick();
  assert.deepEqual(
    store.getState().errors.map((e) => e.message),
    ['second', 'first'],
  );
});

test('merges a duplicate reported within 5s', async () => {
  const a = store.add({ ...base, message: 'same', source: 'console' });
  const b = store.add({ ...base, message: 'same', source: 'console' });
  await tick();
  assert.equal(a.id, b.id);
  assert.equal(store.getState().errors.length, 1);
});

test('a duplicate from a better source upgrades the existing entry', async () => {
  const first = store.add({ ...base, message: 'crash', source: 'console' });
  store.add({ ...base, message: 'crash', source: 'boundary', isFatal: true, componentStack: '\n    in App' });
  await tick();
  const merged = store.get(first.id);
  assert.equal(merged?.source, 'boundary');
  assert.equal(merged?.isFatal, true);
  assert.equal(merged?.componentStack, '\n    in App');
});

test('a duplicate from a worse source does not downgrade', async () => {
  const first = store.add({ ...base, message: 'crash', source: 'boundary' });
  store.add({ ...base, message: 'crash', source: 'console' });
  await tick();
  assert.equal(store.get(first.id)?.source, 'boundary');
});

test('keeps at most 20 errors', async () => {
  for (let i = 0; i < 25; i++) store.add({ ...base, message: `e${i}`, source: 'manual' });
  await tick();
  const { errors } = store.getState();
  assert.equal(errors.length, 20);
  assert.equal(errors[0].message, 'e24');
});

test('notifies subscribers once per tick, not during the call', async () => {
  let calls = 0;
  const unsubscribe = store.subscribe(() => calls++);
  store.add({ ...base, message: 'x', source: 'manual' });
  store.add({ ...base, message: 'y', source: 'manual' });
  assert.equal(calls, 0);
  await tick();
  assert.equal(calls, 1);
  unsubscribe();
});

test('open / select / close', async () => {
  store.open('3');
  await tick();
  assert.deepEqual([store.getState().panelOpen, store.getState().selectedId], [true, '3']);
  store.close();
  await tick();
  assert.deepEqual([store.getState().panelOpen, store.getState().selectedId], [false, null]);
});
