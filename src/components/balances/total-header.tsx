import { Link } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import type { Balance } from '@/api/types';
import { styles } from '@/components/balances/styles';
import { UpdatedAgo } from '@/components/balances/updated-ago';
import { formatUsd, totalUsd } from '@/lib/amount';
import type { ClaimSubmission } from '@/lib/claim-submit';

type Props = {
  items: Balance[];
  asOf: string;
  isFetching: boolean;
  onRefresh: () => void;
  unresolved: ClaimSubmission | null;
  error: string | null;
};

export function TotalHeader({ items, asOf, isFetching, onRefresh, unresolved, error }: Props) {
  return (
    <>
      <Text style={styles.muted}>Total balance</Text>
      <Text style={styles.total} accessibilityLabel={`Total ${formatUsd(totalUsd(items))}`}>
        {formatUsd(totalUsd(items))}
      </Text>
      <View style={styles.row}>
        <UpdatedAgo asOf={asOf} />
        <Pressable accessibilityRole="button" onPress={onRefresh} disabled={isFetching} hitSlop={8}>
          <Text style={[styles.link, isFetching && styles.disabled]}>
            {isFetching ? 'Refreshing…' : 'Refresh'}
          </Text>
        </Pressable>
      </View>
      {unresolved && (
        <Link
          href={{ pathname: '/claim/[asset]', params: { asset: unresolved.body.asset } }}
          style={[styles.banner, styles.bannerText]}>
          Your {unresolved.body.asset} claim is still being confirmed. Tap to check it.
        </Link>
      )}
      {error !== null && <ErrorBanner message={error} />}
    </>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <View style={styles.banner} accessibilityRole="alert">
      <Text style={styles.bannerText}>
        Couldn&apos;t refresh, showing the last known balances.{' '}
        {message}
      </Text>
    </View>
  );
}
