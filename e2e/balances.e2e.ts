import { expect, test } from '@playwright/test';

import { mockApi } from './mock-api';

test('shows balances and the USD total for a stored token', async ({ page }) => {
  await mockApi(page);
  await page.goto('/');

  await expect(page.getByText('Total balance')).toBeVisible();
  await expect(page.getByText('$101.50').first()).toBeVisible();
  await expect(page.getByText('100.50 available')).toBeVisible();
});

test('asks for a token when none is stored', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByText('Paste your API token to continue', { exact: false })).toBeVisible();
});
