import { useQuery } from '@tanstack/react-query';
import { Link, Stack, useLocalSearchParams } from 'expo-router';
import { useSetAtom } from 'jotai';
import { useEffect } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';

import { queryKeys, useBalances, useToken } from '@/api/queries';
import { queryClient } from '@/api/query-client';
import { getClaim } from '@/api/services';
import { Row, styles } from '@/components/claim-ui';
import { Colors } from '@/constants/theme';
import { formatAmount } from '@/lib/amount';
import { removePendingClaimAtom } from '@/state/pendingClaims';

const POLL_MS = 2000;

export default function ClaimStatusScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const token = useToken();
  const removePendingClaim = useSetAtom(removePendingClaimAtom);
  const balances = useBalances();
  const claim = useQuery({
    queryKey: queryKeys.claim(id),
    queryFn: ({ signal }) => getClaim(token, id, signal),
    refetchInterval: (q) => (q.state.data?.status === 'pending' ? POLL_MS : false),
  });
  const status = claim.data?.status;

  useEffect(() => {
    if (status !== 'completed' && status !== 'failed') return;
    // Failed: the amount is available again. Completed stays in the overlay until a snapshot includes it.
    if (status === 'failed') removePendingClaim(id);
    void queryClient.invalidateQueries({ queryKey: queryKeys.balances });
  }, [status, id, removePendingClaim]);

  const header = <Stack.Screen options={{ title: 'Claim status' }} />;

  if (!claim.data) {
    return (
      <View style={styles.center}>
        {header}
        {claim.isPending ? (
          <ActivityIndicator size="large" color={Colors.primary} />
        ) : (
          <>
            <Text style={styles.text}>{claim.error?.message ?? 'Could not load the claim.'}</Text>
            <Pressable accessibilityRole="button" style={styles.button} onPress={() => claim.refetch()}>
              <Text style={styles.buttonText}>Retry</Text>
            </Pressable>
          </>
        )}
      </View>
    );
  }

  const c = claim.data;
  // Decimals come from balances; until they load, show the server's strings as-is.
  const decimals = balances.data?.items.find((b) => b.asset === c.asset)?.decimals;
  const fmt = (v: string) => `${decimals == null ? v : formatAmount(v, decimals)} ${c.asset}`;
  const statusColor =
    c.status === 'completed' ? Colors.success : c.status === 'failed' ? Colors.danger : Colors.warning;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {header}
      <View style={styles.row}>
        <Text style={styles.title}>{c.asset} claim</Text>
        {c.status === 'pending' && <ActivityIndicator color={Colors.primary} />}
      </View>
      <Text style={[styles.title, { color: statusColor }]} accessibilityLiveRegion="polite">
        {c.status === 'pending' ? 'Pending…' : c.status === 'completed' ? 'Completed' : 'Failed'}
      </Text>
      {c.status === 'failed' && (
        <Text style={styles.error} accessibilityRole="alert">
          {c.failureReason ?? 'The claim failed.'} The amount is back in your available balance.
        </Text>
      )}
      <Row label="Amount" value={fmt(c.amount)} />
      <Row label="Fee" value={fmt(c.fee)} />
      <Row label="You receive" value={fmt(c.receiveAmount)} strong />
      <Row label="Claim ID" value={c.id} />
      {claim.isError && <Text style={styles.error}>Couldn&apos;t refresh the status. Retrying…</Text>}
      <Link href="/" replace style={[styles.link, styles.centerText]}>
        Back to balances
      </Link>
    </ScrollView>
  );
}
