import { afterEach, expect, it } from '@jest/globals';

import { getClaimOptions } from './claim-options';
import { stubFetch } from './test-fetch';

const realFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = realFetch;
});

it('GETs claim options for the asset', async () => {
  const body = { asset: 'ETH', minAmount: '0.01', fee: '0.0012', destinations: [] };
  const calls = stubFetch(200, body);

  await expect(getClaimOptions('tok', 'ETH')).resolves.toEqual(body);

  const url = new URL(calls[0].url);
  expect(url.pathname).toBe('/v1/claim-options');
  expect(url.searchParams.get('asset')).toBe('ETH');
});
