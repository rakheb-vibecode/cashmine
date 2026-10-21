import { createStore } from 'jotai';

// Explicit store so non-React code (the React Query error handler) can read
// and clear the token.
export const appStore = createStore();
