import { atom } from 'jotai';

import type { PendingClaim } from '@/lib/pending-claims';

export { applyPendingClaims, isNotInSnapshot, type PendingClaim } from '@/lib/pending-claims';

export const PENDING_CLAIMS_STORAGE_KEY = 'cashmine.pendingClaims';

export const pendingClaimsAtom = atom<PendingClaim[]>([]);

export const addPendingClaimAtom = atom(null, (get, set, claim: PendingClaim) =>
  set(pendingClaimsAtom, [...get(pendingClaimsAtom).filter((c) => c.claimId !== claim.claimId), claim]),
);

/** Failed only: on completed the snapshot may still predate the claim, so Home prunes it later. */
export const removePendingClaimAtom = atom(null, (get, set, claimId: string) =>
  set(pendingClaimsAtom, get(pendingClaimsAtom).filter((c) => c.claimId !== claimId)),
);

