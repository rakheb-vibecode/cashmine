import { atom } from 'jotai';

import { readItem, writeItem } from '@/lib/storage';
import { hydrateSubmission } from '@/lib/claim-submit';

import { appStore } from './store';
import { TOKEN_STORAGE_KEY, tokenAtom } from './token';

/** False until persisted state is loaded into the store; the token gate waits for it. */
export const hydratedAtom = atom(false);

async function hydrate() {
  const [token] = await Promise.all([readItem(TOKEN_STORAGE_KEY, { secure: true }), hydrateSubmission()]);
  appStore.set(tokenAtom, token);
  // Write-through from here on (subscribing after the load so it can't overwrite storage).
  appStore.sub(tokenAtom, () => writeItem(TOKEN_STORAGE_KEY, appStore.get(tokenAtom), { secure: true }));
  appStore.set(hydratedAtom, true);
}

// Started once at import, not in an effect, so StrictMode can't run it twice.
void hydrate();
