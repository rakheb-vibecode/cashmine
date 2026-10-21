import { expect, test } from '@playwright/test';

import { claim, mockApi } from './mock-api';

const body = { asset: 'USDT', amount: '20', destinationId: 'dest_wallet' };

async function submitClaim(page: import('@playwright/test').Page) {
  await page.goto('/claim/USDT');
  await page.getByLabel('Amount in USDT').fill('20');
  await expect(page.getByText('18.50 USDT')).toBeVisible();
  await page.getByText('Review', { exact: true }).click();
  await page.getByText('Confirm', { exact: true }).click();
}

test('rejects an amount in a format the API does not accept', async ({ page }) => {
  await mockApi(page);
  await page.goto('/claim/USDT');

  await page.getByLabel('Amount in USDT').fill('05');

  await expect(page.getByText('Enter a number like 0.5.')).toBeVisible();
});

test('submits a claim and follows it until completed', async ({ page }) => {
  const posts = await mockApi(page);

  await submitClaim(page);

  await expect(page.getByText('Completed')).toBeVisible({ timeout: 10_000 });
  expect(posts).toHaveLength(1);
  expect(posts[0].body).toEqual(body);
  expect(posts[0].key).toBeTruthy();
});

test('retries a timed-out claim with the same idempotency key', async ({ page }) => {
  const posts = await mockApi(page, [
    { status: 504, body: { error: { code: 'TIMEOUT', message: 'timeout' } } },
    { status: 201, body: claim('pending') },
  ]);

  await submitClaim(page);

  await expect(page.getByText('Completed')).toBeVisible({ timeout: 10_000 });
  expect(posts).toHaveLength(2);
  expect(posts[1].key).toBe(posts[0].key);
  expect(posts[1].body).toEqual(posts[0].body);
});
