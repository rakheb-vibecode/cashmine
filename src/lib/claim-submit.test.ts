import { describe, expect, it, jest } from '@jest/globals';

import { ApiError } from '@/api/client';
import type { Claim } from '@/api/types';

import { submitRetryDelayMs, submitWithRetry, type ClaimSubmission } from './claim-submit';

const submission: ClaimSubmission = {
  key: 'key-1',
  body: { asset: 'ETH', amount: '0.5', destinationId: 'dest_wallet' },
};
const claim = { id: 'clm_1', status: 'pending' } as Claim;

const err = (status: number, code: string, extra: Partial<ApiError> = {}) =>
  Object.assign(new ApiError({ status, code: code as never, message: code, method: 'POST' }), extra);

function run(results: (Claim | ApiError)[]) {
  const send = jest.fn(async (s: ClaimSubmission) => {
    const r = results.shift()!;
    if (r instanceof ApiError) throw r;
    return r;
  });
  const sleep = jest.fn(async (_ms: number) => {});
  return { send, sleep, result: submitWithRetry(submission, send, sleep) };
}

describe('submitWithRetry', () => {
  it('returns the claim on first success', async () => {
    const { send, result } = run([claim]);
    expect(await result).toEqual({ kind: 'created', claim });
    expect(send).toHaveBeenCalledTimes(1);
  });

  it('retries 504 / network / 5xx / 429 with the SAME key and body', async () => {
    const { send, sleep, result } = run([
      err(504, 'TIMEOUT'),
      err(0, 'NETWORK'),
      err(503, 'SERVER'),
      err(429, 'RATE_LIMITED', { retryAfterMs: 2300 } as Partial<ApiError>),
      claim,
    ]);
    expect(await result).toEqual({ kind: 'created', claim });
    expect(send.mock.calls.every(([s]) => s === submission)).toBe(true);
    expect(sleep.mock.calls.map(([ms]) => ms)).toEqual([1000, 2000, 4000, 2300]);
  });

  it('gives up as unknown after max attempts', async () => {
    const { send, result } = run(Array.from({ length: 6 }, () => err(504, 'TIMEOUT')));
    expect((await result).kind).toBe('unknown');
    expect(send).toHaveBeenCalledTimes(5);
  });

  it.each([
    [400, 'VALIDATION'],
    [409, 'IDEMPOTENCY_MISMATCH'],
    [401, 'UNAUTHORIZED'],
  ])('does not retry %s', async (status, code) => {
    const { send, result } = run([err(status, code), claim]);
    expect((await result).kind).toBe('rejected');
    expect(send).toHaveBeenCalledTimes(1);
  });
});

describe('submitRetryDelayMs', () => {
  it('caps backoff at 8s', () => expect(submitRetryDelayMs(10, err(504, 'TIMEOUT'))).toBe(8000));
});
