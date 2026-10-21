# CashMine

Payback balances and claims, built with Expo SDK 58 + TypeScript (web build, sized for a ~390px phone).

**Live:** https://cashmine.expo.app

## Run locally

```bash
npm i
npx expo start --web
npm test
npx playwright install chromium && npm run test:e2e   # web e2e, API mocked
```

On first open the app asks for your API token. It is kept in this browser's localStorage and never in the code, repo or build. Use "Change token" on Home to switch tokens.

## What works

- **Balances (Home):** available, pending and claiming per asset, total in USD, "Updated Xs ago", pull-to-refresh and a Refresh button, auto-refresh every 15s, loading / error + retry / stale-data banner, 401 sends you back to the token screen, 429 waits `retryAfterMs`.
- **Claim:** pick an asset, enter an amount or Max, live validation against the API rules (format, decimals, min, available, fee), fee and receive amount, review + confirm, then a status screen that polls until completed or failed.
- **Unknown claim outcome:** one Idempotency-Key per submission, persisted and retried with the same body, so a timeout can never create a second claim; resumes after reload.
- **Activity:** paginated history (accruals, reversals, claims) with infinite scroll, "Load more" fallback, pull-to-refresh; claim rows open their status.
- **Tests:** unit tests for amount parsing, validation, fee, totals, the claim retry logic, the balance overlay and API error mapping, one test file per API service (`npm test`). Playwright e2e on a 390px viewport with the API mocked: balances, token screen, amount validation, claim to completed, and a 504 retried with the same Idempotency-Key (`npm run test:e2e`).

Design decisions and known issues: [NOTES.md](NOTES.md). AI session logs: [ai-logs/](ai-logs/).
