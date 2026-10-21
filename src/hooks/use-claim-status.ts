import { useQuery } from '@tanstack/react-query';
import { useSetAtom } from 'jotai';
import { useEffect } from 'react';

import { getClaim } from '@/api/claims';
import { queryKeys, useBalances, useToken } from '@/api/queries';
import { queryClient } from '@/api/query-client';
import { removePendingClaimAtom } from '@/state/pendingClaims';

const POLL_MS = 2000;

export function useClaimStatus(id: string) {
  const token = useToken();
  const removePendingClaim = useSetAtom(removePendingClaimAtom);
  const balances = useBalances();
  const claim = useQuery({
    queryKey: queryKeys.claim(id),
    queryFn: ({ signal }) => getClaim(token, id, signal),
    refetchInterval: (q) => (q.state.data?.status === 'pending' ? POLL_MS : false),
  });
  const status = claim.data?.status;

  useEffect(() => {
    if (status !== 'completed' && status !== 'failed') return;
    // Failed: the amount is available again. Completed stays in the overlay until a snapshot includes it.
    if (status === 'failed') removePendingClaim(id);
    void queryClient.invalidateQueries({ queryKey: queryKeys.balances });
    void queryClient.invalidateQueries({ queryKey: queryKeys.activity });
  }, [status, id, removePendingClaim]);

  // Decimals come from balances; until they load, show the server's strings as-is.
  const decimals = balances.data?.items.find((b) => b.asset === claim.data?.asset)?.decimals;
  return { claim, decimals };
}
