import { atom } from 'jotai';

import { readItem, writeItem } from '@/lib/storage';
import { hydrateSubmission } from '@/lib/claim-submit';

import { PENDING_CLAIMS_STORAGE_KEY, pendingClaimsAtom, type PendingClaim } from './pendingClaims';
import { appStore } from './store';
import { TOKEN_STORAGE_KEY, tokenAtom } from './token';

/** False until persisted state is loaded into the store; the token gate waits for it. */
export const hydratedAtom = atom(false);

async function hydrate() {
  const [token, pending] = await Promise.all([
    readItem(TOKEN_STORAGE_KEY, { secure: true }),
    readItem(PENDING_CLAIMS_STORAGE_KEY),
    hydrateSubmission(),
  ]);
  appStore.set(tokenAtom, token);
  appStore.set(pendingClaimsAtom, parseArray<PendingClaim>(pending));
  // Write-through from here on (subscribing after the load so it can't overwrite storage).
  appStore.sub(tokenAtom, () => writeItem(TOKEN_STORAGE_KEY, appStore.get(tokenAtom), { secure: true }));
  appStore.sub(pendingClaimsAtom, () =>
    writeItem(PENDING_CLAIMS_STORAGE_KEY, JSON.stringify(appStore.get(pendingClaimsAtom))),
  );
  appStore.set(hydratedAtom, true);
}

function parseArray<T>(raw: string | null): T[] {
  try {
    const v: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(v) ? (v as T[]) : [];
  } catch {
    return [];
  }
}

// Started once at import, not in an effect, so StrictMode can't run it twice.
void hydrate();
