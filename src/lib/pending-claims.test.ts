import { describe, expect, it } from '@jest/globals';

import type { Balance } from '@/api/types';

import { applyPendingClaims, type PendingClaim } from './pending-claims';

const eth: Balance = {
  asset: 'ETH',
  decimals: 18,
  available: '1.5',
  pending: '0.1',
  claiming: '0',
  usdPrice: '2000',
};
const usdt: Balance = { ...eth, asset: 'USDT', decimals: 6, available: '10' };
const claim: PendingClaim = {
  claimId: 'clm_1',
  asset: 'ETH',
  amount: '0.5',
  createdAt: '2026-10-21T09:00:05.000Z',
};

describe('applyPendingClaims', () => {
  it('moves a claim newer than the snapshot from available to claiming', () => {
    const [e, u] = applyPendingClaims([eth, usdt], '2026-10-21T09:00:00.000Z', [claim]);
    expect(e.available).toBe('1');
    expect(e.claiming).toBe('0.5');
    expect(u).toBe(usdt);
  });

  it('ignores a claim the snapshot already includes', () => {
    const [e] = applyPendingClaims([eth], '2026-10-21T09:00:15.000Z', [claim]);
    expect(e).toEqual(eth);
  });

  it('sums several claims and never shows negative available', () => {
    const big = { ...claim, claimId: 'clm_2', amount: '1.2' };
    const [e] = applyPendingClaims([eth], '2026-10-21T09:00:00.000Z', [claim, big]);
    expect(e.available).toBe('0');
    expect(e.claiming).toBe('1.7');
  });
});
