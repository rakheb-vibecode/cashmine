import { atom } from 'jotai';

export const TOKEN_STORAGE_KEY = 'cashmine.token';

export const tokenAtom = atom<string | null>(null);

export const signOutReasonAtom = atom<string | null>(null);
