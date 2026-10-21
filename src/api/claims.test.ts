import { afterEach, expect, it } from '@jest/globals';

import { createClaim, getClaim } from './claims';
import { header, stubFetch } from './test-fetch';

const realFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = realFetch;
});

const body = { asset: 'ETH', amount: '0.5', destinationId: 'dest_wallet' };

it('POSTs the claim as JSON with the idempotency key', async () => {
  const calls = stubFetch(201, { id: 'clm_1' });

  await createClaim('tok', body, 'key-1');

  expect(calls[0].url).toBe('https://task-api.cashmine.io/v1/claims');
  expect(calls[0].init.method).toBe('POST');
  expect(header(calls[0], 'Idempotency-Key')).toBe('key-1');
  expect(header(calls[0], 'Content-Type')).toBe('application/json');
  expect(JSON.parse(calls[0].init.body as string)).toEqual(body);
});

it('keeps the amount a string in the request body', async () => {
  const calls = stubFetch(201, { id: 'clm_1' });

  await createClaim('tok', body, 'key-1');

  expect(calls[0].init.body).toContain('"amount":"0.5"');
});

it('GETs a claim by an escaped id', async () => {
  const calls = stubFetch(200, { id: 'clm/1' });

  await getClaim('tok', 'clm/1');

  expect(calls[0].url).toBe('https://task-api.cashmine.io/v1/claims/clm%2F1');
});
