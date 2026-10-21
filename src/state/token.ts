import { atom } from 'jotai';

export const TOKEN_STORAGE_KEY = 'cashmine.token';

// null = no token. Loaded from storage by hydrate() before the gate renders the app.
export const tokenAtom = atom<string | null>(null);

/** Why the user was sent back to the token screen (e.g. a 401), if not by choice. */
export const signOutReasonAtom = atom<string | null>(null);
