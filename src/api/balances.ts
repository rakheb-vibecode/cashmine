import { apiRequest } from './http';
import type { BalancesResponse } from './types';

export function getBalances(token: string, signal?: AbortSignal) {
  return apiRequest<BalancesResponse>('/v1/balances', { token, signal });
}
