import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';

import { tokenAtom } from '@/state/token';

import { getActivity, getBalances } from './services';

export const queryKeys = {
  balances: ['balances'] as const,
  activity: ['activity'] as const,
  claimOptions: (asset: string) => ['claim-options', asset] as const,
  claim: (id: string) => ['claim', id] as const,
};

/** Token for API calls; screens behind TokenGate always have one. */
export function useToken(): string {
  const token = useAtomValue(tokenAtom);
  if (!token) throw new Error('useToken used outside TokenGate');
  return token;
}

// Server recomputes balances every 15s, so polling faster is pointless.
export const BALANCES_REFETCH_MS = 15_000;

export function useBalances() {
  const token = useToken();
  return useQuery({
    queryKey: queryKeys.balances,
    queryFn: ({ signal }) => getBalances(token, signal),
    refetchInterval: BALANCES_REFETCH_MS,
  });
}

export function useActivity() {
  const token = useToken();
  return useInfiniteQuery({
    queryKey: queryKeys.activity,
    queryFn: ({ pageParam, signal }) => getActivity(token, pageParam, signal),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
  });
}
