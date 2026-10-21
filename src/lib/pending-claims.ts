import Big from 'big.js';

import type { Balance, DecimalString, IsoDateString } from '@/api/types';

import { toPlainString, ZERO } from './amount';

export type PendingClaim = {
  claimId: string;
  asset: string;
  amount: DecimalString;
  createdAt: IsoDateString;
};

export function isNotInSnapshot(claim: PendingClaim, asOf: IsoDateString): boolean {
  return Date.parse(asOf) <= Date.parse(claim.createdAt);
}

export function applyPendingClaims<T extends Balance>(
  items: readonly T[],
  asOf: IsoDateString,
  claims: readonly PendingClaim[],
): T[] {
  const open = claims.filter((c) => isNotInSnapshot(c, asOf));
  if (open.length === 0) return [...items];
  return items.map((b) => {
    const amount = open
      .filter((c) => c.asset === b.asset)
      .reduce((sum, c) => sum.plus(new Big(c.amount)), ZERO);
    if (amount.eq(ZERO)) return b;
    const available = new Big(b.available).minus(amount);
    return {
      ...b,
      // Accruals/reversals between snapshots could make this dip below 0; never show negative.
      available: toPlainString(available.lt(ZERO) ? ZERO : available),
      claiming: toPlainString(new Big(b.claiming).plus(amount)),
    };
  });
}
