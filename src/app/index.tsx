import { router, Stack } from 'expo-router';
import { useAtom } from 'jotai';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { isApiError } from '@/api/client';
import { useBalances } from '@/api/queries';
import { signOut } from '@/api/query-client';
import type { Balance } from '@/api/types';
import { Colors, MaxContentWidth, Spacing } from '@/constants/theme';
import { assetTotal, formatAmount, formatUsd, toUsd, totalUsd } from '@/lib/amount';
import { applyPendingClaims, isNotInSnapshot, pendingClaimsAtom } from '@/state/pendingClaims';

function errorMessage(error: unknown): string {
  if (!isApiError(error)) return 'Something went wrong.';
  if (error.code === 'RATE_LIMITED') return 'Too many requests. Retrying shortly…';
  return error.message;
}

export default function HomeScreen() {
  const balances = useBalances();
  const [pendingClaims, setPendingClaims] = useAtom(pendingClaimsAtom);
  const asOf = balances.data?.asOf;

  // Once a snapshot is newer than a claim, the server numbers include it: drop it from the overlay.
  useEffect(() => {
    if (asOf) setPendingClaims((claims) => claims.filter((c) => isNotInSnapshot(c, asOf)));
  }, [asOf, setPendingClaims]);

  const items = balances.data
    ? applyPendingClaims(balances.data.items, balances.data.asOf, pendingClaims)
    : [];

  const header = (
    <Stack.Screen
      options={{
        title: 'Balances',
        headerRight: () => (
          <Pressable accessibilityRole="button" onPress={() => signOut()} hitSlop={8}>
            <Text style={styles.link}>Change token</Text>
          </Pressable>
        ),
      }}
    />
  );

  if (balances.isPending) {
    return (
      <View style={styles.center}>
        {header}
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.muted}>Loading balances…</Text>
      </View>
    );
  }

  if (!balances.data) {
    return (
      <View style={styles.center}>
        {header}
        <Text style={styles.errorTitle}>Could not load balances</Text>
        <Text style={styles.muted}>{errorMessage(balances.error)}</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => balances.refetch()}
          disabled={balances.isFetching}
          style={[styles.button, balances.isFetching && styles.disabled]}>
          <Text style={styles.buttonText}>{balances.isFetching ? 'Retrying…' : 'Retry'}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.screen}
      contentContainerStyle={styles.content}
      data={items}
      keyExtractor={(b) => b.asset}
      refreshControl={
        <RefreshControl
          refreshing={balances.isRefetching}
          onRefresh={() => void balances.refetch()}
          tintColor={Colors.primary}
        />
      }
      ListHeaderComponent={
        <View style={styles.summary}>
          {header}
          <Text style={styles.muted}>Total balance</Text>
          <Text style={styles.total} accessibilityLabel={`Total ${formatUsd(totalUsd(items))}`}>
            {formatUsd(totalUsd(items))}
          </Text>
          <View style={styles.row}>
            <UpdatedAgo asOf={balances.data.asOf} />
            <Pressable
              accessibilityRole="button"
              onPress={() => balances.refetch()}
              disabled={balances.isFetching}
              hitSlop={8}>
              <Text style={[styles.link, balances.isFetching && styles.disabled]}>
                {balances.isFetching ? 'Refreshing…' : 'Refresh'}
              </Text>
            </Pressable>
          </View>
          {balances.isError && (
            <View style={styles.banner} accessibilityRole="alert">
              <Text style={styles.bannerText}>
                Couldn&apos;t refresh, showing the last known balances.{' '}
                {errorMessage(balances.error)}
              </Text>
            </View>
          )}
        </View>
      }
      renderItem={({ item }) => <BalanceRow balance={item} />}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      ListEmptyComponent={<Text style={styles.muted}>No assets yet.</Text>}
    />
  );
}

function BalanceRow({ balance: b }: { balance: Balance }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityHint={`Claim ${b.asset}`}
      onPress={() => router.push({ pathname: '/claim/[asset]', params: { asset: b.asset } })}
      style={({ pressed }) => [styles.item, pressed && styles.pressed]}>
      <View style={styles.row}>
        <Text style={styles.asset}>{b.asset}</Text>
        <Text style={styles.usd}>{formatUsd(toUsd(assetTotal(b), b.usdPrice))}</Text>
      </View>
      <Text style={styles.available}>
        {formatAmount(b.available, b.decimals)} <Text style={styles.muted}>available</Text>
      </Text>
      <Text style={styles.small}>
        Pending {formatAmount(b.pending, b.decimals)} · Claiming{' '}
        {formatAmount(b.claiming, b.decimals)}
      </Text>
    </Pressable>
  );
}

/** "Updated 12s ago", ticking every second, from the snapshot's server time. */
function UpdatedAgo({ asOf }: { asOf: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  // Clamp: a device clock slightly behind the server would give negative seconds.
  const seconds = Math.max(0, Math.round((now - Date.parse(asOf)) / 1000));
  const label = seconds < 60 ? `${seconds}s` : `${Math.floor(seconds / 60)}m`;
  return <Text style={styles.muted}>Updated {label} ago</Text>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    padding: Spacing.three,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    padding: Spacing.four,
    backgroundColor: Colors.background,
  },
  summary: { gap: Spacing.one, marginBottom: Spacing.four },
  total: { fontSize: 36, fontWeight: '700', color: Colors.text },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  muted: { fontSize: 14, color: Colors.textSecondary },
  link: { color: Colors.primary, fontSize: 15 },
  disabled: { opacity: 0.5 },
  banner: {
    marginTop: Spacing.two,
    padding: Spacing.three,
    borderRadius: 10,
    backgroundColor: '#FDECEA',
  },
  bannerText: { color: Colors.danger, fontSize: 14 },
  errorTitle: { fontSize: 18, fontWeight: '600', color: Colors.text },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: Spacing.five,
  },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  item: { paddingVertical: Spacing.three, gap: Spacing.one },
  pressed: { opacity: 0.6 },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: Colors.border },
  asset: { fontSize: 17, fontWeight: '600', color: Colors.text },
  usd: { fontSize: 15, color: Colors.text },
  available: { fontSize: 22, fontWeight: '600', color: Colors.text },
  small: { fontSize: 13, color: Colors.textSecondary },
});
