import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { Provider as JotaiProvider } from 'jotai';

import { queryClient } from '@/api/query-client';
import { TokenGate } from '@/components/token-gate';
import { appStore } from '@/state/store';

export default function RootLayout() {
  return (
    <JotaiProvider store={appStore}>
      <QueryClientProvider client={queryClient}>
        <TokenGate>
          <Stack />
        </TokenGate>
      </QueryClientProvider>
    </JotaiProvider>
  );
}
