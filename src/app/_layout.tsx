import { Provider as JotaiProvider } from 'jotai';
import { Stack } from 'expo-router';

import { TokenGate } from '@/components/token-gate';

export default function RootLayout() {
  return (
    <JotaiProvider>
      <TokenGate>
        <Stack />
      </TokenGate>
    </JotaiProvider>
  );
}
