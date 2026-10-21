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

/** Plain decimal string (never exponent notation): safe to send to the API. */
export function toPlainString(v: AmountLike): string {
  return toBig(v).toFixed();
}

// API amount format: digits, optional "." + digits, no leading zeros.
// "0.5", "12" ok; ".5", "1.", "05", "1e-3", "-1", " 1" not ok.
const AMOUNT_RE = /^(0|[1-9][0-9]*)(\.([0-9]+))?$/;

export type ParseError = 'empty' | 'format' | 'too_many_decimals';
export type ParseResult = { ok: true; value: Big } | { ok: false; error: ParseError };

/**
 * Strict parser matching the API rules. Whitespace is not trimmed here (the
 * input layer decides that) so what we validate is exactly what we send.
 * Decimal places are counted on the string, so "1.500" with decimals=2 is
 * rejected just like the server would.
 */
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

/**
 * Client-side mirror of the POST /v1/claims rules:
 *   format + decimals, minAmount <= amount <= available,
 * plus amount > fee so the user receives something (receive = amount - fee).
 * The server re-checks `available` live, so this can still be rejected there.
 */
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

/** The fee is taken from the claimed amount. */
export function receiveAmount(amount: AmountLike, fee: AmountLike): Big {
  return toBig(amount).minus(toBig(fee));
}

export function toUsd(amount: AmountLike, usdPrice: AmountLike): Big {
  return toBig(amount).times(toBig(usdPrice));
}

/** Everything the user holds in this asset: available + pending + claiming. */
export function assetTotal(b: Pick<Balance, 'available' | 'pending' | 'claiming'>): Big {
  return toBig(b.available).plus(toBig(b.pending)).plus(toBig(b.claiming));
}

/**
 * Total in USD = sum over assets of (available + pending + claiming) * usdPrice.
 *
 * - pending is included: it is payback the user has earned, just not yet
 *   confirmed (it may still be reversed; the UI labels it separately).
 * - claiming is included: a claim moves its amount from available to claiming
 *   at once, so including it keeps the total stable when a claim is submitted
 *   instead of dipping and jumping back. It leaves the total only once the
 *   claim completes (paid out) and returns to available if the claim fails.
 * - Full precision is kept; rounding happens only in formatUsd.
 */
export function totalUsd(
  balances: readonly Pick<Balance, 'available' | 'pending' | 'claiming' | 'usdPrice'>[],
): Big {
  return balances.reduce((sum, b) => sum.plus(toUsd(assetTotal(b), b.usdPrice)), ZERO);
}

// ---- display ---------------------------------------------------------------

function groupThousands(intPart: string): string {
  return intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Asset amount for display: rounded DOWN to the asset's decimals (never show
 * more than the user has), trailing zeros trimmed, thousands grouped.
 * Keeps at least `minDecimals` places (default 2) when the asset allows it.
 */
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

/** USD for display: 2 decimals, half-up, "$1,234.56" / "-$1.20". */
export function formatUsd(value: AmountLike): string {
  const v = toBig(value);
  const fixed = v.abs().toFixed(2, Big.roundHalfUp);
  const [intPart, frac] = fixed.split('.');
  const body = `$${groupThousands(intPart)}.${frac}`;
  return v.lt(ZERO) && fixed !== '0.00' ? `-${body}` : body;
}
