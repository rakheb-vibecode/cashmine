# NOTES

## Decisions

**Amounts.** Every amount stays a decimal string from the API until it hits `big.js` (`src/lib/amount.ts`), with `Big.strict = true` so a JS number can't sneak in (`new Big(0.1)` throws). Input is checked by our own strict parser that mirrors the API rules (digits, optional dot + digits, no leading zeros, no `.5` / `1.` / `05` / `1e-3`, at most `decimals` places counted on the string), so what we validate is exactly what we send; `toPlainString` never emits exponent notation. Display rounds asset amounts **down** (never show more than the user has) and USD half-up to cents. Alternatives: JS numbers (float error on money, no), `decimal.js`/`bignumber.js` (bigger, same result), integer minor units with BigInt (needs per-asset scaling everywhere; more code for the same correctness).

**Total in USD.** `sum((available + pending + claiming) * usdPrice)`. Assumption: the total is "what payback you have", so pending (not yet confirmed) and claiming (on its way out) are both included; the per-asset row shows the split.

**Balance right after a claim.** The two complaints in the brief pull opposite ways: "it didn't change so I claimed again" (server-only view; the snapshot is up to 15s old) and "it dropped then jumped back" (naive optimistic update undone by the next refetch, whose snapshot is still older than the claim). We keep a local overlay (`src/lib/pending-claims.ts`): after a 201/200 the claimed amount moves from available to claiming at once, and the overlay is held until a snapshot arrives with `asOf > claim.createdAt`, then server data wins. A failed claim drops out of the overlay immediately (its amount really returns). Alternatives considered: server-only + "claim in progress" banner + block re-claim (honest but looks broken for 15s); optimistic reset on refetch (causes the jump back).

**Unknown claim outcome** (504, 5xx, network error, 429). One Idempotency-Key is made at Confirm and persisted with the exact body in localStorage *before* the POST (`src/lib/claim-submit.ts`). Retries reuse the same key and body with backoff (1, 2, 4, 8s, or `retryAfterMs`), so the server returns the original claim instead of a second one. The UI says "Checking claim status…", never "failed"; if still unknown it says "We couldn't confirm your claim. Don't claim again" with a Retry that reuses the key. The form is blocked while a submission is unresolved, Home links back to it, and it resumes after a reload. It is dropped on sign-out so a different token never resumes it. Only non-transient 4xx responses (400/401/404/409) count as a definite rejection.

**Other choices.** Claim status polls every 2s until settled (claims settle in ~20s); balances refetch every 15s, the server's snapshot cadence. Queries retry only transient errors (max 3) and honour `retryAfterMs`; writes never auto-retry. Any 401 clears the token and cache and shows why. The token lives in browser localStorage (the brief asks to keep it in the browser; acceptable for a test token, not for a real secret). API base URL only in `src/config.ts`. No UI kit: plain `StyleSheet` and a few own components (gluestack setup on web was a risk under a 2h timer). Activity items carry no `decimals`, so their amounts are shown at the server string's own precision.

## Working with AI

Workflow: one planning session in Claude Code produced the decisions and four prompts (`ai-logs/00-plan-and-prompts.md`), then four sequential implementation sessions (foundation, balances, claim, activity + docs), each started with `/ponytail:ponytail full` (smallest complete change). After each iteration a `/ponytail:ponytail-review` pass reviewed that iteration's commits; must-fix findings were committed as separate `fix:` commits before the next prompt.

- TODO(me): **a prompt that failed.** Candidate: prompt 2 asked the session to run `eas deploy --prod`; it was blocked by the agent's permission check, so deploys are done by hand. Pointer: `ai-logs/…`
- TODO(me): **AI output that was wrong or risky.** Candidates: `b2fcb6b`, the first overlay dropped a claim as soon as it *completed*, which showed the amount as available again until the next snapshot (exactly the "jumped back" case), caught by review. `73ec3ee`, an unresolved claim submission survived sign-out, so a different token could resume it and claim on the wrong account. Pointer: `ai-logs/…`
- TODO(me): **a disagreement.** Candidate: UI kit, gluestack vs plain `StyleSheet`; chose `StyleSheet` for setup risk on web under the timer. Pointer: `ai-logs/00-plan-and-prompts.md` (planning). 

## Not done / known issues

- Not tested end-to-end against the real API by the agents (they never read the token); the logic is unit-tested and the web build compiles. TODO(me): say what you checked by hand with your token.
- The pending-claims overlay is in memory only: after a reload within ~15s of a claim, Home can show the older snapshot until the next one.
- The persisted claim submission uses `localStorage`, so the resume-after-reload path works on web only (the target build).
- Activity is not refreshed when a claim settles (it refetches on open, pull-to-refresh or focus).
- `app.json` uses `web.output: "server"` (template default): the token gate may log a hydration warning on first load.
- No end-to-end or component tests; tests cover pure logic only. Light theme only.
