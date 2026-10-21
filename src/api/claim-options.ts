import { apiRequest } from './http';
import type { ClaimOptions } from './types';

export function getClaimOptions(token: string, asset: string, signal?: AbortSignal) {
  return apiRequest<ClaimOptions>('/v1/claim-options', { token, signal, query: { asset } });
}
