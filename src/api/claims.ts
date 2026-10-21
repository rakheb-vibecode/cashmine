import { apiRequest } from './http';
import type { Claim, CreateClaimBody } from './types';

// Retries after an unknown outcome must reuse the same key: the server then returns the original claim.
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
