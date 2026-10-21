import { apiRequest } from './client';
import type {
  ActivityResponse,
  BalancesResponse,
  Claim,
  ClaimOptions,
  CreateClaimBody,
} from './types';

// Thin typed wrappers over the documented endpoints. Each takes the token
// explicitly so callers (React Query hooks) control where it comes from.

export function getBalances(token: string, signal?: AbortSignal) {
  return apiRequest<BalancesResponse>('/v1/balances', { token, signal });
}

export const ACTIVITY_PAGE_SIZE = 20;

export function getActivity(token: string, cursor?: string | null, signal?: AbortSignal) {
  return apiRequest<ActivityResponse>('/v1/activity', {
    token,
    signal,
    query: { limit: ACTIVITY_PAGE_SIZE, cursor },
  });
}

export function getClaimOptions(token: string, asset: string, signal?: AbortSignal) {
  return apiRequest<ClaimOptions>('/v1/claim-options', { token, signal, query: { asset } });
}

/**
 * Creates a claim. Reuse the same idempotencyKey when retrying after an
 * unknown outcome (504 / network error): the server returns the original
 * claim instead of creating a second one. A new attempt needs a new key.
 */
export function createClaim(token: string, body: CreateClaimBody, idempotencyKey: string) {
  return apiRequest<Claim>('/v1/claims', {
    token,
    method: 'POST',
    body,
    headers: { 'Idempotency-Key': idempotencyKey },
  });
}

export function getClaim(token: string, id: string, signal?: AbortSignal) {
  return apiRequest<Claim>(`/v1/claims/${encodeURIComponent(id)}`, { token, signal });
}
