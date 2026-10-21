import { isApiError, type ApiError } from '@/api/http';
import type { Claim, CreateClaimBody } from '@/api/types';

import { readItem, writeItem } from './storage';

/** A POST /v1/claims we started but have not resolved yet. Same key + body on every retry. */
export type ClaimSubmission = { key: string; body: CreateClaimBody };

export type SubmitResult =
  | { kind: 'created'; claim: Claim }
  // The server answered and did not create a claim from this request (400 / 401 / 404 / 409).
  | { kind: 'rejected'; error: ApiError }
  // We could not learn whether the claim exists. Only the same key may be retried.
  | { kind: 'unknown'; error: unknown };

export const MAX_SUBMIT_ATTEMPTS = 5;

/** True when retrying the same key + body is the only safe move. */
export function isRetryableSubmitError(e: unknown): boolean {
  // Unexpected (non-API) errors: we don't know what happened, so never treat as "not created".
  if (!isApiError(e)) return true;
  // 504/network, 429, 500/503, or a 2xx whose body we could not read (claim may exist).
  return e.isUnknownOutcome || e.isTransient || e.code === 'BAD_RESPONSE';
}

/** 429 waits what the server asks; everything else backs off 1s, 2s, 4s, 8s (capped). */
export function submitRetryDelayMs(attempt: number, e: unknown): number {
  if (isApiError(e) && e.retryAfterMs != null) return e.retryAfterMs;
  return Math.min(1000 * 2 ** attempt, 8000);
}

/**
 * Sends the same submission until it resolves or attempts run out.
 * `send` must reuse submission.key: that is what makes the retries safe.
 */
export async function submitWithRetry(
  submission: ClaimSubmission,
  send: (s: ClaimSubmission) => Promise<Claim>,
  sleep: (ms: number) => Promise<void> = (ms) => new Promise((r) => setTimeout(r, ms)),
  maxAttempts = MAX_SUBMIT_ATTEMPTS,
): Promise<SubmitResult> {
  let lastError: unknown;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (attempt > 0) await sleep(submitRetryDelayMs(attempt - 1, lastError));
    try {
      return { kind: 'created', claim: await send(submission) };
    } catch (e) {
      if (!isRetryableSubmitError(e)) return { kind: 'rejected', error: e as ApiError };
      lastError = e;
    }
  }
  return { kind: 'unknown', error: lastError };
}

// ---- persistence -------------------------------------------------------------
// Kept in memory so the screens can read it synchronously; hydrateSubmission() loads
// the stored copy once at startup, before any screen renders.

const STORAGE_KEY = 'cashmine.claimSubmission';
let current: ClaimSubmission | null = null;

export async function hydrateSubmission(): Promise<void> {
  const raw = await readItem(STORAGE_KEY);
  try {
    current = raw ? (JSON.parse(raw) as ClaimSubmission) : null;
  } catch {
    current = null;
  }
}

export function loadSubmission(): ClaimSubmission | null {
  return current;
}

export function saveSubmission(s: ClaimSubmission | null): void {
  current = s;
  writeItem(STORAGE_KEY, s ? JSON.stringify(s) : null);
}
