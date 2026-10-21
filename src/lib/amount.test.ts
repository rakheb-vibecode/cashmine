import { describe, expect, it } from '@jest/globals';
import Big from 'big.js';


import {
  formatAmount,
  formatUsd,
  parseAmount,
  receiveAmount,
  toPlainString,
  totalUsd,
  toUsd,
  validateClaimAmount,
} from './amount';

const str = (r: ReturnType<typeof parseAmount>) => (r.ok ? r.value.toFixed() : r.error);

describe('parseAmount', () => {
  it.each([
    ['0.5', '0.5'],
    ['12', '12'],
    ['0', '0'],
    ['0.0', '0'],
    ['1.50', '1.5'],
    ['123456789.123456', '123456789.123456'],
  ])('accepts %s', (input, expected) => {
    expect(str(parseAmount(input, 6))).toBe(expected);
  });

  it.each(['.5', '1.', '05', '00.1', '1e-3', '1E3', '-1', '+1', ' 1', '1 ', '1,5', 'abc', '0x10', '1..2', 'Infinity', 'NaN'])(
    'rejects %j as format',
    (input) => {
      expect(parseAmount(input, 6)).toEqual({ ok: false, error: 'format' });
    },
  );

  it('rejects empty input', () => {
    expect(parseAmount('', 6)).toEqual({ ok: false, error: 'empty' });
  });

  it('counts decimal places on the string', () => {
    expect(str(parseAmount('0.123456', 6))).toBe('0.123456');
    expect(parseAmount('0.1234567', 6)).toEqual({ ok: false, error: 'too_many_decimals' });
    // Trailing zeros still count, as on the server.
    expect(parseAmount('1.500', 2)).toEqual({ ok: false, error: 'too_many_decimals' });
    expect(parseAmount('1.5', 0)).toEqual({ ok: false, error: 'too_many_decimals' });
    expect(str(parseAmount('15', 0))).toBe('15');
  });

  it('keeps precision beyond floats', () => {
    expect(str(parseAmount('0.000000000000000001', 18))).toBe('0.000000000000000001');
    expect(str(parseAmount('9007199254740993', 0))).toBe('9007199254740993');
  });
});

describe('validateClaimAmount', () => {
  const base = { decimals: 4, minAmount: '0.01', available: '1.5', fee: '0.0012' };
  const v = (input: string, over: Partial<typeof base> = {}) =>
    validateClaimAmount({ ...base, ...over, input });

  it('accepts amount == minAmount', () => {
    const r = v('0.01');
    expect(r.ok && r.receive.toFixed()).toBe('0.0088');
  });

  it('accepts amount == available', () => {
    const r = v('1.5');
    expect(r.ok && r.amount.toFixed()).toBe('1.5');
  });

  it('rejects just below minAmount', () => {
    expect(v('0.0099')).toEqual({ ok: false, error: 'below_min' });
  });

  it('rejects just above available', () => {
    expect(v('1.5001')).toEqual({ ok: false, error: 'above_available' });
  });

  it('rejects amounts that do not exceed the fee', () => {
    const over = { minAmount: '0.001' };
    expect(v('0.0012', over)).toEqual({ ok: false, error: 'not_above_fee' });
    expect(v('0.001', over)).toEqual({ ok: false, error: 'not_above_fee' });
    const r = v('0.0013', over);
    expect(r.ok && r.receive.toFixed()).toBe('0.0001');
  });

  it('reports format and decimals errors first', () => {
    expect(v('.5')).toEqual({ ok: false, error: 'format' });
    expect(v('0.12345')).toEqual({ ok: false, error: 'too_many_decimals' });
    expect(v('')).toEqual({ ok: false, error: 'empty' });
  });

  it('zero is below min', () => {
    expect(v('0')).toEqual({ ok: false, error: 'below_min' });
    expect(v('0.0')).toEqual({ ok: false, error: 'below_min' });
  });

  it('rejects everything when available is 0', () => {
    expect(v('0.01', { available: '0' })).toEqual({ ok: false, error: 'above_available' });
  });
});

describe('receiveAmount / toUsd', () => {
  it('subtracts the fee exactly', () => {
    expect(receiveAmount('0.5', '0.0012').toFixed()).toBe('0.4988');
    expect(receiveAmount('0.3', '0.1').toFixed()).toBe('0.2'); // 0.3 - 0.1 in floats is 0.19999...
  });

  it('multiplies by price exactly', () => {
    expect(toUsd('820.413207', '1.0002').toFixed()).toBe('820.5772896414');
    expect(toUsd('0.1', '3').toFixed()).toBe('0.3');
  });

  it('never produces exponent notation', () => {
    expect(toPlainString(receiveAmount('0.00000002', '0.00000001'))).toBe('0.00000001');
  });
});

describe('totalUsd', () => {
  it('sums (available + pending + claiming) * usdPrice', () => {
    const total = totalUsd([
      { available: '820.413207', pending: '50.12', claiming: '0', usdPrice: '1.0002' },
      { available: '0.5', pending: '0.1', claiming: '0.4', usdPrice: '2500' },
    ]);
    // (870.533207 * 1.0002) + (1 * 2500)
    expect(total.toFixed()).toBe('3370.7073136414');
  });

  it('is 0 for no balances', () => {
    expect(totalUsd([]).toFixed()).toBe('0');
  });

  it('a claim moving available -> claiming keeps the total unchanged', () => {
    const before = totalUsd([{ available: '1', pending: '0', claiming: '0', usdPrice: '3' }]);
    const after = totalUsd([{ available: '0.4', pending: '0', claiming: '0.6', usdPrice: '3' }]);
    expect(after.eq(before)).toBe(true);
  });
});

describe('formatting', () => {
  it('formatAmount rounds down to decimals and trims zeros', () => {
    expect(formatAmount('820.413207', 6)).toBe('820.413207');
    expect(formatAmount('1234567.5', 6)).toBe('1,234,567.50');
    expect(formatAmount('0.123456789', 6)).toBe('0.123456');
    expect(formatAmount('12', 0)).toBe('12');
    expect(formatAmount('-9.81', 2)).toBe('-9.81');
    expect(formatAmount('-0.0000001', 6)).toBe('0.00');
    expect(formatAmount('0.00000001', 8)).toBe('0.00000001');
  });

  it('formatUsd rounds half-up to cents', () => {
    expect(formatUsd('3370.7073136414')).toBe('$3,370.71');
    expect(formatUsd('0.005')).toBe('$0.01');
    expect(formatUsd('0.004')).toBe('$0.00');
    expect(formatUsd('-1.2')).toBe('-$1.20');
    expect(formatUsd('-0.001')).toBe('$0.00');
  });
});

it('Big strict mode rejects JS numbers', () => {
  expect(() => new Big(0.1)).toThrow();
});
