import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';

import { saveSubmission } from '@/lib/claim-submit';
import { pendingClaimsAtom } from '@/state/pendingClaims';
import { appStore } from '@/state/store';
import { signOutReasonAtom, tokenAtom } from '@/state/token';

import { isApiError } from './http';

const MAX_QUERY_RETRIES = 3;

export function signOut(reason: string | null = null) {
  appStore.set(signOutReasonAtom, reason);
  appStore.set(tokenAtom, null);
  queryClient.clear();
  // An unresolved claim belongs to this token; resuming it under another token would claim on that account.
  saveSubmission(null);
  // The overlay is persisted too; another token's balances must not show this account's claims.
  appStore.set(pendingClaimsAtom, []);
}

function onApiError(error: unknown) {
  if (isApiError(error) && error.isUnauthorized) {
    signOut('Your token was rejected or has expired. Enter a valid token.');
  }
}

export const queryClient: QueryClient = new QueryClient({
  queryCache: new QueryCache({ onError: onApiError }),
  mutationCache: new MutationCache({ onError: onApiError }),
  defaultOptions: {
    queries: {
      retry: (failureCount, error) =>
        failureCount < MAX_QUERY_RETRIES && isApiError(error) && error.isTransient,
      retryDelay: (attempt, error) =>
        (isApiError(error) && error.retryAfterMs) || Math.min(1000 * 2 ** attempt, 8000),
      refetchOnWindowFocus: true,
    },
    mutations: {
      // Never auto-retry writes; the claim flow retries explicitly with the same idempotency key.
      retry: false,
    },
  },
});
