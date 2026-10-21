import { useQuery } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';
import { useState } from 'react';

import { getClaimOptions } from '@/api/claim-options';
import { queryKeys, useBalances, useToken } from '@/api/queries';
import { formatAmount, validateClaimAmount, type ClaimAmountError } from '@/lib/amount';
import { applyPendingClaims, pendingClaimsAtom } from '@/state/pendingClaims';

import type { ServerError } from './use-claim-submission';

export type ClaimFormState = NonNullable<ReturnType<typeof useClaimForm>['form']>;

export function useClaimForm(
  asset: string,
  serverError: ServerError | null,
  setServerError: (e: null) => void,
) {
  const token = useToken();
  const balances = useBalances();
  const pendingClaims = useAtomValue(pendingClaimsAtom);
  const options = useQuery({
    queryKey: queryKeys.claimOptions(asset),
    queryFn: ({ signal }) => getClaimOptions(token, asset, signal),
  });
  const [amount, setAmount] = useState('');
  const [destinationId, setDestinationId] = useState<string | null>(null);

  const load = {
    loading: options.isPending || balances.isPending,
    message: options.error?.message ?? balances.error?.message ?? `No ${asset} balance.`,
    onRetry: () => {
      void options.refetch();
      void balances.refetch();
    },
  };
  const rawBalance = balances.data?.items.find((b) => b.asset === asset);
  if (!options.data || !balances.data || !rawBalance) return { load, form: null };

  const [balance] = applyPendingClaims([rawBalance], balances.data.asOf, pendingClaims);
  const { decimals } = balance;
  const opts = options.data;
  const fmt = (v: Parameters<typeof formatAmount>[0]) => `${formatAmount(v, decimals)} ${asset}`;
  const destination = opts.destinations.find((d) => d.id === destinationId) ?? opts.destinations[0];
  const validation = validateClaimAmount({
    input: amount,
    decimals,
    minAmount: opts.minAmount,
    available: balance.available,
    fee: opts.fee,
  });
  const amountError =
    serverError?.field === 'amount'
      ? serverError.message
      : !validation.ok
        ? errorText(validation.error, decimals, fmt(opts.minAmount), fmt(opts.fee))
        : null;

  return {
    load,
    form: {
      amount,
      balance,
      opts,
      fmt,
      destination,
      validation,
      amountError,
      formError: serverError && serverError.field !== 'amount' ? serverError.message : null,
      canReview: validation.ok && !!destination && serverError?.field !== 'amount',
      // Some locales' decimal pads type "," as the separator.
      changeAmount: (t: string) => {
        setAmount(t.replace(',', '.'));
        setServerError(null);
      },
      setMax: () => {
        setAmount(balance.available);
        setServerError(null);
      },
      setDestinationId,
    },
  };
}

function errorText(error: ClaimAmountError, decimals: number, min: string, fee: string): string {
  switch (error) {
    case 'empty':
      return 'Enter an amount.';
    case 'format':
      return 'Enter a number like 0.5.';
    case 'too_many_decimals':
      return `At most ${decimals} decimal places.`;
    case 'below_min':
      return `Minimum is ${min}.`;
    case 'above_available':
      return 'More than your available balance.';
    case 'not_above_fee':
      return `Must be more than the fee (${fee}).`;
  }
}
