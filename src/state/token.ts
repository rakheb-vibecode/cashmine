import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

export const TOKEN_STORAGE_KEY = 'cashmine.token';

// Raw-string storage on top of localStorage (we ship a web build). Every access
// is guarded: private mode / disabled storage must not crash the app, it just
// means the token lives in memory for this session. On native there is no
// localStorage, so the same in-memory fallback applies.
// Same shape as jotai's (unexported) SyncStorage.
type TokenStorage = {
  getItem: (key: string, initialValue: string | null) => string | null;
  setItem: (key: string, value: string | null) => void;
  removeItem: (key: string) => void;
};

const memory = new Map<string, string>();

function getLocalStorage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

const tokenStorage: TokenStorage = {
  getItem(key, initialValue) {
    try {
      const value = getLocalStorage()?.getItem(key);
      if (value) return value;
    } catch {
      // fall through to memory
    }
    return memory.get(key) ?? initialValue;
  },
  setItem(key, value) {
    if (!value) return this.removeItem(key);
    memory.set(key, value);
    try {
      getLocalStorage()?.setItem(key, value);
    } catch {
      // keep the in-memory copy only
    }
  },
  removeItem(key) {
    memory.delete(key);
    try {
      getLocalStorage()?.removeItem(key);
    } catch {
      // nothing else to clear
    }
  },
};

// null = no token yet. Read on init so the gate decides on the first render.
export const tokenAtom = atomWithStorage<string | null>(TOKEN_STORAGE_KEY, null, tokenStorage, {
  getOnInit: true,
});

/** Why the user was sent back to the token screen (e.g. a 401), if not by choice. */
export const signOutReasonAtom = atom<string | null>(null);
