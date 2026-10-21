import { afterEach, expect, it } from '@jest/globals';

import { getBalances } from './balances';
import { header, stubFetch } from './test-fetch';

const realFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = realFetch;
});

it('GETs /v1/balances with the bearer token and returns the body', async () => {
  const body = { asOf: '2026-10-21T10:00:00.000Z', items: [] };
  const calls = stubFetch(200, body);

  await expect(getBalances('tok')).resolves.toEqual(body);

  expect(calls[0].url).toBe('https://task-api.cashmine.io/v1/balances');
  expect(calls[0].init.method).toBe('GET');
  expect(header(calls[0], 'Authorization')).toBe('Bearer tok');
});
