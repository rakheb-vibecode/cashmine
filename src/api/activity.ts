import { apiRequest } from './http';
import type { ActivityResponse } from './types';

export const ACTIVITY_PAGE_SIZE = 20;

export function getActivity(token: string, cursor?: string | null, signal?: AbortSignal) {
  return apiRequest<ActivityResponse>('/v1/activity', {
    token,
    signal,
    query: { limit: ACTIVITY_PAGE_SIZE, cursor },
  });
}
