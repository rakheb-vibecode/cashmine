import type { Page, Route } from '@playwright/test';

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'Authorization, Content-Type, Idempotency-Key',
  'access-control-allow-methods': 'GET, POST, OPTIONS',
};

const now = () => new Date().toISOString();

export const balances = () => ({
  asOf: now(),
  items: [{ asset: 'USDT', decimals: 6, available: '100.5', pending: '1', claiming: '0', usdPrice: '1' }],
});

export const claimOptions = {
  asset: 'USDT',
  minAmount: '10',
  fee: '1.5',
  destinations: [{ id: 'dest_wallet', label: 'Wallet 0xabc' }],
};

export const claim = (status: 'pending' | 'completed') => ({
  id: 'clm_e2e',
  asset: 'USDT',
  amount: '20',
  fee: '1.5',
  receiveAmount: '18.5',
  destinationId: 'dest_wallet',
  status,
  failureReason: null,
  createdAt: now(),
  updatedAt: now(),
});

export type ClaimPost = { key: string | undefined; body: unknown };

/** Mocks the API; `postResponses` are answered in order for POST /v1/claims. */
export async function mockApi(page: Page, postResponses: { status: number; body: unknown }[] = []) {
  const posts: ClaimPost[] = [];
  await page.addInitScript(() => localStorage.setItem('cashmine.token', 'e2e-token'));
  await page.route('https://task-api.cashmine.io/**', async (route: Route) => {
    const req = route.request();
    const json = (status: number, body: unknown) =>
      route.fulfill({ status, headers: { ...CORS, 'content-type': 'application/json' }, body: JSON.stringify(body) });
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS });
    const path = new URL(req.url()).pathname;
    if (path === '/v1/balances') return json(200, balances());
    if (path === '/v1/claim-options') return json(200, claimOptions);
    if (path === '/v1/activity') return json(200, { items: [], nextCursor: null });
    if (path === '/v1/claims' && req.method() === 'POST') {
      posts.push({ key: req.headers()['idempotency-key'], body: req.postDataJSON() });
      const next = postResponses[posts.length - 1] ?? { status: 201, body: claim('pending') };
      return json(next.status, next.body);
    }
    if (path.startsWith('/v1/claims/')) return json(200, claim('completed'));
    return json(404, { error: { code: 'NOT_FOUND', message: 'not mocked' } });
  });
  return posts;
}
