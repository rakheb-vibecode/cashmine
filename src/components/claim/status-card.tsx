import { Link } from 'expo-router';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';

import type { Claim } from '@/api/types';
import { Colors } from '@/constants/theme';
import { formatAmount } from '@/lib/amount';

import { Row, styles } from './ui';

export function ClaimStatusCard({
  claim: c,
  decimals,
  refreshFailed,
}: {
  claim: Claim;
  decimals: number | undefined;
  refreshFailed: boolean;
}) {
  const fmt = (v: string) => `${decimals == null ? v : formatAmount(v, decimals)} ${c.asset}`;
  const statusColor =
    c.status === 'completed' ? Colors.success : c.status === 'failed' ? Colors.danger : Colors.warning;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
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
      {refreshFailed && <Text style={styles.error}>Couldn&apos;t refresh the status. Retrying…</Text>}
      <Link href="/" replace style={[styles.link, styles.centerText]}>
        Back to balances
      </Link>
    </ScrollView>
  );
}
