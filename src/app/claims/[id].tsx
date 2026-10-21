import { Stack, useLocalSearchParams } from 'expo-router';

import { LoadState } from '@/components/claim/load-state';
import { ClaimStatusCard } from '@/components/claim/status-card';
import { useClaimStatus } from '@/hooks/use-claim-status';

export default function ClaimStatusScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { claim, decimals } = useClaimStatus(id);

  return (
    <>
      <Stack.Screen options={{ title: 'Claim status' }} />
      {claim.data ? (
        <ClaimStatusCard claim={claim.data} decimals={decimals} refreshFailed={claim.isError} />
      ) : (
        <LoadState
          loading={claim.isPending}
          message={claim.error?.message ?? 'Could not load the claim.'}
          onRetry={() => claim.refetch()}
        />
      )}
    </>
  );
}
