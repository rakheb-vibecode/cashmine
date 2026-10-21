import { randomUUID } from 'expo-crypto';
import { router } from 'expo-router';
import { useSetAtom } from 'jotai';
import { useEffect, useRef, useState } from 'react';

import { queryKeys, useToken } from '@/api/queries';
import { queryClient, signOut } from '@/api/query-client';
import { createClaim } from '@/api/claims';
import {
  loadSubmission,
  saveSubmission,
  submitWithRetry,
  type ClaimSubmission,
} from '@/lib/claim-submit';
import { addPendingClaimAtom } from '@/state/pendingClaims';

export type Phase = 'edit' | 'review' | 'submitting' | 'unknown';
export type ServerError = { field?: string; message: string };

export function useClaimSubmission(asset: string) {
  const token = useToken();
  const addPendingClaim = useSetAtom(addPendingClaimAtom);
  const [phase, setPhase] = useState<Phase>('edit');
  const [serverError, setServerError] = useState<ServerError | null>(null);
  // Resume an unresolved submission (e.g. after a reload) instead of letting the user claim again.
  const [submission, setSubmission] = useState<ClaimSubmission | null>(() => {
    const s = loadSubmission();
    return s?.body.asset === asset ? s : null;
  });
  const running = useRef(false);

  async function run(sub: ClaimSubmission) {
    if (running.current) return; // no double submit
    running.current = true;
    setPhase('submitting');
    setServerError(null);
    const result = await submitWithRetry(sub, (s) => createClaim(token, s.body, s.key));
    running.current = false;

    if (result.kind === 'created') {
      const { claim } = result;
      saveSubmission(null);
      addPendingClaim({
        claimId: claim.id,
        asset: claim.asset,
        amount: claim.amount,
        createdAt: claim.createdAt,
      });
      queryClient.setQueryData(queryKeys.claim(claim.id), claim);
      router.replace({ pathname: '/claims/[id]', params: { id: claim.id } });
    } else if (result.kind === 'rejected') {
      // The server answered and created nothing: safe to forget the key.
      saveSubmission(null);
      setSubmission(null);
      const e = result.error;
      if (e.isUnauthorized) return signOut('Your token was rejected or has expired. Enter a valid token.');
      setServerError({
        field: e.field,
        message:
          e.code === 'IDEMPOTENCY_MISMATCH'
            ? 'This claim conflicted with an earlier request. Check your activity before trying again.'
            : e.message,
      });
      setPhase('edit');
    } else {
      setPhase('unknown');
    }
  }

  useEffect(() => {
    // One-off resume on mount; run() starts with setPhase, which is the point.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (submission) void run(submission);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once on mount
  }, []);

  function confirm(amount: string, destinationId: string) {
    if (running.current) return;
    const sub: ClaimSubmission = { key: randomUUID(), body: { asset, amount, destinationId } };
    saveSubmission(sub); // before sending, so a reload mid-request resumes with this key
    setSubmission(sub);
    void run(sub);
  }

  return {
    phase,
    setPhase,
    serverError,
    setServerError,
    persisted: submission ?? loadSubmission(),
    retry: () => submission && run(submission),
    confirm,
  };
}
