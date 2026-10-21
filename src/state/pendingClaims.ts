import { atom } from 'jotai';

import type { PendingClaim } from '@/lib/pending-claims';

// Pure logic lives in lib (testable without jotai); re-exported so callers have one import.
export { applyPendingClaims, isNotInSnapshot, type PendingClaim } from '@/lib/pending-claims';

export const PENDING_CLAIMS_STORAGE_KEY = 'cashmine.pendingClaims';

// Persisted (see state/hydrate) so a reload before the next snapshot still shows the claim.
export const pendingClaimsAtom = atom<PendingClaim[]>([]);

/** Add (or replace, by claimId) after POST /v1/claims returns. */
export const addPendingClaimAtom = atom(null, (get, set, claim: PendingClaim) =>
  set(pendingClaimsAtom, [...get(pendingClaimsAtom).filter((c) => c.claimId !== claim.claimId), claim]),
);

/**
 * Drop when the claim FAILED (the server returns the amount to available).
 * Don't call it on completed: the last snapshot may predate the claim, and dropping
 * would show the amount as available again until the next snapshot; Home prunes it then.
 */
export const removePendingClaimAtom = atom(null, (get, set, claimId: string) =>
  set(pendingClaimsAtom, get(pendingClaimsAtom).filter((c) => c.claimId !== claimId)),
);

