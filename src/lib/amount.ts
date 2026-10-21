import Big from 'big.js';

import type { Balance } from '@/api/types';

// All money math goes through big.js on decimal strings. JS numbers are never
// used for amounts: strict mode makes `new Big(0.1)` throw, so a float can't
// sneak in by accident.
Big.strict = true;

export type BigValue = Big;
type AmountLike = string | Big;

const toBig = (v: AmountLike): Big => (v instanceof Big ? v : new Big(v));

export const ZERO = new Big('0');

export function toPlainString(v: AmountLike): string {
  return toBig(v).toFixed();
}

// API amount format: digits, optional "." + digits, no leading zeros.
// "0.5", "12" ok; ".5", "1.", "05", "1e-3", "-1", " 1" not ok.
const AMOUNT_RE = /^(0|[1-9][0-9]*)(\.([0-9]+))?$/;

export type ParseError = 'empty' | 'format' | 'too_many_decimals';
export type ParseResult = { ok: true; value: Big } | { ok: false; error: ParseError };

/** Whitespace is not trimmed: what we validate is exactly what we send. */
export function parseAmount(input: string, decimals: number): ParseResult {
  if (input === '') return { ok: false, error: 'empty' };
  const m = AMOUNT_RE.exec(input);
  if (!m) return { ok: false, error: 'format' };
  const fraction = m[3] ?? '';
  if (fraction.length > decimals) return { ok: false, error: 'too_many_decimals' };
  return { ok: true, value: new Big(input) };
}

export type ClaimAmountError = ParseError | 'below_min' | 'above_available' | 'not_above_fee';

export type ClaimAmountResult =
  | { ok: true; amount: Big; receive: Big }
  | { ok: false; error: ClaimAmountError };

/** Mirrors POST /v1/claims; the server still re-checks `available` live. */
export function validateClaimAmount(args: {
  input: string;
  decimals: number;
  minAmount: AmountLike;
  available: AmountLike;
  fee: AmountLike;
}): ClaimAmountResult {
  const parsed = parseAmount(args.input, args.decimals);
  if (!parsed.ok) return parsed;
  const amount = parsed.value;
  if (amount.lt(toBig(args.minAmount))) return { ok: false, error: 'below_min' };
  if (amount.gt(toBig(args.available))) return { ok: false, error: 'above_available' };
  if (amount.lte(toBig(args.fee))) return { ok: false, error: 'not_above_fee' };
  return { ok: true, amount, receive: receiveAmount(amount, args.fee) };
}

export function receiveAmount(amount: AmountLike, fee: AmountLike): Big {
  return toBig(amount).minus(toBig(fee));
}

export function toUsd(amount: AmountLike, usdPrice: AmountLike): Big {
  return toBig(amount).times(toBig(usdPrice));
}

export function assetTotal(b: Pick<Balance, 'available' | 'pending' | 'claiming'>): Big {
  return toBig(b.available).plus(toBig(b.pending)).plus(toBig(b.claiming));
}

/**
 * (available + pending + claiming) * usdPrice. Claiming stays in the total so it does not dip
 * when a claim is submitted; it leaves only when the claim completes.
 */
export function totalUsd(
  balances: readonly Pick<Balance, 'available' | 'pending' | 'claiming' | 'usdPrice'>[],
): Big {
  return balances.reduce((sum, b) => sum.plus(toUsd(assetTotal(b), b.usdPrice)), ZERO);
}

function groupThousands(intPart: string): string {
  return intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/** Rounded down so we never show more than the user has. */
export function formatAmount(value: AmountLike, decimals: number, minDecimals = 2): string {
  const v = toBig(value);
  const negative = v.lt(ZERO);
  const fixed = v.abs().toFixed(decimals, Big.roundDown);
  let [intPart, frac = ''] = fixed.split('.');
  frac = frac.replace(/0+$/, '');
  const keep = Math.min(minDecimals, decimals);
  if (frac.length < keep) frac = frac.padEnd(keep, '0');
  const body = groupThousands(intPart) + (frac ? `.${frac}` : '');
  // Avoid "-0.00" after rounding a tiny negative down to zero.
  return negative && /[1-9]/.test(body) ? `-${body}` : body;
}

export function formatUsd(value: AmountLike): string {
  const v = toBig(value);
  const fixed = v.abs().toFixed(2, Big.roundHalfUp);
  const [intPart, frac] = fixed.split('.');
  const body = `$${groupThousands(intPart)}.${frac}`;
  return v.lt(ZERO) && fixed !== '0.00' ? `-${body}` : body;
}
