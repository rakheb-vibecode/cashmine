import { afterEach, describe, expect, it, jest } from '@jest/globals';

import { ApiError, apiRequest } from './http';

const realFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = realFetch;
});

function mockFetch(impl: () => Promise<Response>) {
  globalThis.fetch = jest.fn(impl) as unknown as typeof fetch;
}

const json = (status: number, body: unknown, headers: Record<string, string> = {}) =>
  Promise.resolve(new Response(JSON.stringify(body), { status, headers }));

async function fail(method: 'GET' | 'POST' = 'GET'): Promise<ApiError> {
  try {
    await apiRequest('/v1/x', { token: 't', method, body: method === 'POST' ? {} : undefined });
  } catch (e) {
    return e as ApiError;
  }
  throw new Error('expected failure');
}

describe('apiRequest errors', () => {
  it('maps the documented error body', async () => {
    mockFetch(() => json(400, { error: { code: 'VALIDATION', message: 'bad', field: 'amount' } }));
    const e = await fail('POST');
    expect([e.status, e.code, e.field, e.isUnknownOutcome]).toEqual([400, 'VALIDATION', 'amount', false]);
  });

  it('504 on POST is an unknown outcome, on GET it is not', async () => {
    mockFetch(() => json(504, { error: { code: 'TIMEOUT', message: 't' } }));
    expect((await fail('POST')).isUnknownOutcome).toBe(true);
    expect((await fail('GET')).isUnknownOutcome).toBe(false);
  });

  it('network failure on POST is an unknown outcome', async () => {
    mockFetch(() => Promise.reject(new TypeError('Failed to fetch')));
    const e = await fail('POST');
    expect([e.status, e.code, e.isUnknownOutcome]).toEqual([0, 'NETWORK', true]);
  });

  it('401 is unauthorized; 429 takes Retry-After header when body has none', async () => {
    mockFetch(() => json(401, { error: { code: 'UNAUTHORIZED', message: 'no' } }));
    expect((await fail()).isUnauthorized).toBe(true);
    mockFetch(() => json(429, { error: { code: 'RATE_LIMITED', message: 'slow' } }, { 'Retry-After': '2' }));
    expect((await fail()).retryAfterMs).toBe(2000);
  });

  it('non-JSON error body still maps by status', async () => {
    mockFetch(() => Promise.resolve(new Response('<html>bad gateway</html>', { status: 502 })));
    const e = await fail();
    expect([e.code, e.isTransient]).toEqual(['SERVER', true]);
  });
});
