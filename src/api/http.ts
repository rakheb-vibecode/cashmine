import { API_BASE_URL } from '@/config';

import type { ApiErrorBody } from './types';

export type ApiErrorCodeOrClient =
  | ApiErrorBody['error']['code']
  | 'NETWORK' // request never got a response (offline, DNS, CORS, aborted)
  | 'BAD_RESPONSE'; // response body was not the JSON we expected

export class ApiError extends Error {
  readonly status: number; // 0 when there was no HTTP response
  readonly code: ApiErrorCodeOrClient;
  readonly field?: string;
  readonly retryAfterMs?: number;
  readonly method: string;

  constructor(opts: {
    status: number;
    code: ApiErrorCodeOrClient;
    message: string;
    method: string;
    field?: string;
    retryAfterMs?: number;
  }) {
    super(opts.message);
    this.name = 'ApiError';
    this.status = opts.status;
    this.code = opts.code;
    this.method = opts.method;
    this.field = opts.field;
    this.retryAfterMs = opts.retryAfterMs;
  }

  get isUnauthorized(): boolean {
    return this.status === 401 || this.code === 'UNAUTHORIZED';
  }

  /** Non-GET with no answer (504 or network): it may have been applied, so retry with the same key, never treat as failed. */
  get isUnknownOutcome(): boolean {
    if (this.method === 'GET') return false;
    return this.status === 504 || this.code === 'TIMEOUT' || this.code === 'NETWORK';
  }

  get isTransient(): boolean {
    return (
      this.code === 'NETWORK' ||
      this.code === 'RATE_LIMITED' ||
      this.code === 'SERVER' ||
      this.code === 'TIMEOUT' ||
      this.status >= 500
    );
  }
}

export function isApiError(e: unknown): e is ApiError {
  return e instanceof ApiError;
}

export type RequestOptions = {
  token: string;
  method?: 'GET' | 'POST';
  query?: Record<string, string | number | undefined | null>;
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
};

function buildUrl(path: string, query?: RequestOptions['query']): string {
  const url = new URL(path, API_BASE_URL);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    }
  }
  return url.toString();
}

function parseRetryAfter(res: Response, bodyMs?: number): number | undefined {
  if (typeof bodyMs === 'number' && Number.isFinite(bodyMs)) return bodyMs;
  const header = res.headers.get('Retry-After');
  if (header == null) return undefined;
  const seconds = Number(header);
  return Number.isFinite(seconds) ? seconds * 1000 : undefined;
}

function fallbackCode(status: number): ApiErrorCodeOrClient {
  if (status === 400) return 'VALIDATION';
  if (status === 401) return 'UNAUTHORIZED';
  if (status === 404) return 'NOT_FOUND';
  if (status === 409) return 'IDEMPOTENCY_MISMATCH';
  if (status === 429) return 'RATE_LIMITED';
  if (status === 504) return 'TIMEOUT';
  if (status >= 500) return 'SERVER';
  return 'BAD_RESPONSE';
}

export async function apiRequest<T>(path: string, opts: RequestOptions): Promise<T> {
  const method = opts.method ?? 'GET';
  const headers: Record<string, string> = {
    Accept: 'application/json',
    Authorization: `Bearer ${opts.token}`,
    ...opts.headers,
  };
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json';

  let res: Response;
  try {
    res = await fetch(buildUrl(path, opts.query), {
      method,
      headers,
      body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
      signal: opts.signal,
    });
  } catch (e) {
    // Let React Query cancellations propagate untouched.
    if (opts.signal?.aborted) throw e;
    throw new ApiError({
      status: 0,
      code: 'NETWORK',
      method,
      message: 'Could not reach the server. Check your connection.',
    });
  }

  let json: unknown = undefined;
  const text = await res.text().catch(() => '');
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      json = undefined;
    }
  }

  if (!res.ok) {
    const err = (json as Partial<ApiErrorBody> | undefined)?.error;
    throw new ApiError({
      status: res.status,
      code: err?.code ?? fallbackCode(res.status),
      method,
      message: err?.message ?? `Request failed (${res.status})`,
      field: err?.field,
      retryAfterMs: res.status === 429 ? parseRetryAfter(res, err?.retryAfterMs) : err?.retryAfterMs,
    });
  }

  if (json === undefined) {
    throw new ApiError({
      status: res.status,
      code: 'BAD_RESPONSE',
      method,
      message: 'Unexpected response from the server.',
    });
  }
  return json as T;
}
