import { jest } from '@jest/globals';

export type FetchCall = { url: string; init: RequestInit };

export function stubFetch(status: number, body: unknown): FetchCall[] {
  const calls: FetchCall[] = [];
  globalThis.fetch = jest.fn((url: string, init: RequestInit) => {
    calls.push({ url, init });
    return Promise.resolve(new Response(JSON.stringify(body), { status }));
  }) as unknown as typeof fetch;
  return calls;
}

export const header = (call: FetchCall, name: string) =>
  (call.init.headers as Record<string, string>)[name];
