import { afterEach, expect, it } from '@jest/globals';

import { ACTIVITY_PAGE_SIZE, getActivity } from './activity';
import { stubFetch } from './test-fetch';

const realFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = realFetch;
});

it('asks for the first page without a cursor', async () => {
  const calls = stubFetch(200, { items: [], nextCursor: null });

  await getActivity('tok');

  const url = new URL(calls[0].url);
  expect(url.pathname).toBe('/v1/activity');
  expect(url.searchParams.get('limit')).toBe(String(ACTIVITY_PAGE_SIZE));
  expect(url.searchParams.has('cursor')).toBe(false);
});

it('passes the cursor for the next page', async () => {
  const calls = stubFetch(200, { items: [], nextCursor: null });

  await getActivity('tok', 'abc/+=');

  expect(new URL(calls[0].url).searchParams.get('cursor')).toBe('abc/+=');
});
