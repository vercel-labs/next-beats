import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import type { moderateText as ModerateText } from './moderation';

// Use the real Gateway adapter and evaluation parser, but never contact a provider.
const originalFetch = globalThis.fetch;
const originalKey = process.env.AI_GATEWAY_API_KEY;
process.env.AI_GATEWAY_API_KEY = 'moderation-test-key';
let calls = 0;
let probability = 0.01;
let fail = false;
let lastRequest: { headers: Headers; body: { state: { text: string } } };
globalThis.fetch = async (_input, init) => {
  calls++;
  lastRequest = { body: JSON.parse(String(init?.body)), headers: new Headers(init?.headers) };
  if (fail) throw new Error('Simulated provider outage');
  return Response.json({ answers: { violatesPolicy: { probability, type: 'boolean' } } });
};
let moderateText: typeof ModerateText;
before(async () => {
  ({ moderateText } = await import('./moderation'));
});
after(() => {
  globalThis.fetch = originalFetch;
  if (originalKey === undefined) delete process.env.AI_GATEWAY_API_KEY;
  else process.env.AI_GATEWAY_API_KEY = originalKey;
});

test('profanity is rejected locally without contacting the provider', async () => {
  const before = calls;
  assert.match((await moderateText('What the FUCK'))!, /friendly/);
  assert.equal(calls, before);
});

test('ordinary text reaches Jev as data and is allowed', async () => {
  probability = 0.01;
  assert.equal(await moderateText('Classic bass and jazz'), null);
  assert.equal(lastRequest.headers.get('ai-model-id'), 'typesafe-ai/jev');
  assert.deepEqual(lastRequest.body.state, { text: 'Classic bass and jazz' });
});

test('high probability blocks and the threshold includes 0.9', async () => {
  probability = 0.9;
  assert.match((await moderateText('Suspicious submission'))!, /spam/);
  probability = 0.899;
  assert.equal(await moderateText('Borderline submission'), null);
});

test('invalid provider probabilities fail open', async () => {
  probability = 2;
  assert.equal(await moderateText('Ordinary submission'), null);
});

test('provider failure allows ordinary text with no retries, but profanity remains blocked', async () => {
  fail = true;
  const before = calls;
  assert.equal(await moderateText('A friendly message'), null);
  assert.equal(calls, before + 1);
  assert.match((await moderateText('shit'))!, /friendly/);
  assert.equal(calls, before + 1);
  fail = false;
});

test('oversized text is rejected before an AI request', async () => {
  const before = calls;
  assert.match((await moderateText('a'.repeat(10001)))!, /10,000/);
  assert.equal(calls, before);
});
