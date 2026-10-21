# Plan and session prompts

Made in the planning session (Claude Code) at ~09:27 UTC. Full planning transcript: see export next to this file.

## Decisions taken in planning
- Amounts: `big.js` for arithmetic, own strict parser/validator (API format: digits, optional dot + digits, no leading zeros, no ".5"/"1."/"05"/"1e-3", max `decimals` places). Never JS numbers for money. USD only at display, 2 decimals.
- Balance after claim: local overlay. After a 201/200 the claimed amount is shown as moved from `available` to `claiming` immediately, and the overlay is kept until a snapshot arrives whose `asOf` > claim `createdAt`; then server data wins. Alternatives considered: server-only + banner + block re-claim; plain optimistic update reset on next refetch (causes "dropped then jumped back").
- Unknown claim result (timeout/504/5xx/network): the Idempotency-Key is created once per confirmed submit and persisted with the body; retries reuse the same key+body, so a retry can never create a second claim. UI shows "Checking claim status…", not "failed". Only a new user submission gets a new key.
- UI: plain StyleSheet + a few own components (no gluestack: setup risk on web under a 2h timer).
- State: TanStack Query for server data, jotai `atomWithStorage` (localStorage) for the token.
- Tests: jest-expo + pure unit tests for `src/lib/amount.ts`.
- Work sequentially in sessions: foundation -> balances -> claim -> activity/notes.

---

## Prompt 1: foundation

```
You are working in an Expo SDK 58 + TypeScript app (expo-router, src/app). This is a 2-hour timed take-home; be fast and correct.
Read .context/brief.md and .context/api.md first. Do NOT read .env and never put the API token in code, repo or build.

Do:
1. Remove template demo screens/components we don't need (explore tab, animated icons, etc.). Keep a simple Stack layout.
2. src/config.ts: API_BASE_URL = "https://task-api.cashmine.io" (the only place).
3. Token: jotai atomWithStorage("cashmine.token") in src/state/token.ts. A TokenGate in the root layout: if no token, show a screen with a text field + Save. Provide a way to change/clear the token (header button on Home). Wrap try/catch around storage.
4. src/api/client.ts: typed fetch wrapper. Adds Authorization: Bearer, parses JSON, maps errors to an ApiError class {status, code, message, field?, retryAfterMs?}. Network failure -> code "NETWORK". 504/network on POST must be distinguishable as "unknown outcome". 401 -> clear token is handled by UI (expose isUnauthorized).
5. src/api/types.ts + src/api/services.ts: getBalances, getActivity(cursor?), getClaimOptions(asset), createClaim(body, idempotencyKey), getClaim(id). Types match docs exactly; amounts stay strings.
6. src/lib/amount.ts using big.js: parseAmount(str, decimals) strict per API format -> {ok, value} | {ok:false, error}; validateClaimAmount({input, decimals, minAmount, available, fee}) returning a typed error ("format","too_many_decimals","below_min","above_available","not_above_fee"); receiveAmount(amount, fee); toUsd(amount, price); totalUsd(balances) = sum((available+pending+claiming) * usdPrice) — write the chosen formula in a comment; formatAmount/formatUsd for display (no float math anywhere).
7. jest-expo setup (`npx expo install jest-expo jest @types/jest -- --save-dev`, "test" script) and src/lib/amount.test.ts covering parsing edge cases (".5","1.","05","1e-3","0","0.0","00.1", too many decimals), validation boundaries (== min, == available, min-epsilon), fee/receive, totals. Run tests until green.
8. Install QueryClientProvider + jotai Provider in root layout. Placeholder Home screen that calls getBalances and dumps JSON.
Commit after each logical step with clear messages (git add/commit; push at the end). Check `npx tsc --noEmit` passes.
```

## Prompt 2: balances (Home)

```
Continue in this repo (read .context/brief.md, .context/api.md, src/api, src/lib/amount.ts). Build the Home/Balances screen for a 390px phone:
- Header: total in USD (lib totalUsd), "Updated Xs ago" from asOf (ticking), token change button.
- List per asset: asset, available (big), pending and claiming (small), USD value. Tap -> claim screen for that asset (route /claim/[asset], stub ok).
- States: first load skeleton/spinner; error with message + Retry; pull-to-refresh (RefreshControl works on web) + refetch button; keep showing stale data with an inline error banner if a refetch fails. 401 -> message and go to token screen. 429 -> respect retryAfterMs before retrying.
- useBalances via TanStack Query, refetchInterval 15s (snapshot cadence), retry only on 5xx/network/429.
- Leave a hook point for a "pending claims overlay" (src/state/pendingClaims.ts, jotai) that adjusts available/claiming per asset; Home renders adjusted values. Overlay entry {claimId, asset, amount, createdAt}; drop it when balances.asOf > createdAt or claim settled.
Commit, push, then run `npx expo export -p web && eas deploy --prod` and confirm the live URL loads.
```

## Prompt 3: claim flow

```
Continue in this repo. Build /claim/[asset] for 390px phone. Money is real; correctness first.
1. Load claim-options for the asset + current balance. Show available (overlay-adjusted), min, fee, destination (select if >1, preselect first).
2. Amount input (decimal-pad), Max button = available. Live validation with lib/amount validateClaimAmount; show inline error text. Show fee and "You receive" = amount - fee only when valid.
3. Review step: asset, amount, fee, receive, destination -> Confirm button (disabled while submitting; no double submit).
4. Submit: generate Idempotency-Key (crypto.randomUUID) once at Confirm; persist {key, body} in localStorage until resolved. POST /v1/claims.
   - 201/200 -> add overlay entry, go to claim status view.
   - 400 VALIDATION -> show message on field, back to edit.
   - 409 -> show error (should not happen; key reuse with different body).
   - 504 / 5xx / network / timeout -> outcome UNKNOWN: show "Checking claim status…", retry the SAME key+body with backoff (respect 429 retryAfterMs) up to ~5 times; never a new key. If still unknown, show "We couldn't confirm your claim. Don't claim again — tap Retry check." with Retry reusing same key. On app reload, resume a persisted unresolved submission.
5. Claim status view /claims/[id]: poll GET /v1/claims/{id} every 2s while pending (stop on completed/failed), show amount/fee/receive/status, failureReason on fail. On settle, invalidate balances and remove overlay entry.
Add unit tests for the submit state machine if cheap (pure reducer). Commit in steps, push, redeploy.
```

## Prompt 4: activity + docs (if time)

```
Continue in this repo. Add /activity: useInfiniteQuery over GET /v1/activity (limit 20, cursor), FlatList with onEndReached + "Load more" fallback, rows: type, exchange or "Claim", signed amount (red for negative), status badge, date. Loading/error/retry/empty states. Link from Home.
Then write README.md (live link https://cashmine.expo.app, run locally: npm i && npx expo start --web, npm test, what works) and draft NOTES.md sections (Decisions, Working with AI with TODO placeholders for me to fill pointers, Not done/known issues). Commit, push, redeploy. Stop before 10:55 UTC.
```
