import { useAtom } from 'jotai';
import { useEffect } from 'react';

import { isApiError } from '@/api/http';
import { useBalances } from '@/api/queries';
import { loadSubmission } from '@/lib/claim-submit';
import { applyPendingClaims, isNotInSnapshot, pendingClaimsAtom } from '@/state/pendingClaims';

export function errorMessage(error: unknown): string {
  if (!isApiError(error)) return 'Something went wrong.';
  if (error.code === 'RATE_LIMITED') return 'Too many requests. Will try again automatically.';
  return error.message;
}

export function useHomeBalances() {
  const balances = useBalances();
  const [pendingClaims, setPendingClaims] = useAtom(pendingClaimsAtom);
  const asOf = balances.data?.asOf;

  // Once a snapshot is newer than a claim, the server numbers include it: drop it from the overlay.
  useEffect(() => {
    if (asOf) setPendingClaims((claims) => claims.filter((c) => isNotInSnapshot(c, asOf)));
  }, [asOf, setPendingClaims]);

  return {
    balances,
    items: balances.data
      ? applyPendingClaims(balances.data.items, balances.data.asOf, pendingClaims)
      : [],
    // A claim whose outcome we never learned: send the user back to finish it, not to claim again.
    unresolved: loadSubmission(),
    errorText: errorMessage(balances.error),
    refresh: () => void balances.refetch(),
  };
}
