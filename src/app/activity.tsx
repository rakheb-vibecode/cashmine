import { router, Stack } from 'expo-router';
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
import { useActivity } from '@/api/queries';
import type { ActivityItem, ActivityStatus } from '@/api/types';
import { Colors, MaxContentWidth, Spacing } from '@/constants/theme';
import { formatAmount } from '@/lib/amount';

const TYPE_LABEL = { accrual: 'Payback', reversal: 'Reversal', claim: 'Claim' } as const;

const STATUS_COLOR: Record<ActivityStatus, string> = {
  pending: Colors.warning,
  confirmed: Colors.success,
  completed: Colors.success,
  failed: Colors.danger,
};

const errorMessage = (e: unknown) => (isApiError(e) ? e.message : 'Something went wrong.');

export default function ActivityScreen() {
  const activity = useActivity();
  const items = activity.data?.pages.flatMap((p) => p.items) ?? [];
  const header = <Stack.Screen options={{ title: 'Activity' }} />;

  if (activity.isPending) {
    return (
      <View style={styles.center}>
        {header}
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.muted}>Loading activity…</Text>
      </View>
    );
  }

  if (!activity.data) {
    return (
      <View style={styles.center}>
        {header}
        <Text style={styles.errorTitle}>Could not load activity</Text>
        <Text style={styles.muted}>{errorMessage(activity.error)}</Text>
        <RetryButton busy={activity.isFetching} onPress={() => activity.refetch()} />
      </View>
    );
  }

  const loadMore = () => {
    // isFetching, not isFetchingNextPage: fetchNextPage during a pull-to-refresh would cancel the refetch.
    if (activity.hasNextPage && !activity.isFetching && !activity.isFetchNextPageError) {
      void activity.fetchNextPage();
    }
  };

  return (
    <FlatList
      style={styles.screen}
      contentContainerStyle={styles.content}
      data={items}
      keyExtractor={(i) => i.id}
      renderItem={({ item }) => <ActivityRow item={item} />}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      onEndReached={loadMore}
      onEndReachedThreshold={0.5}
      refreshControl={
        <RefreshControl
          refreshing={activity.isRefetching && !activity.isFetchingNextPage}
          onRefresh={() => void activity.refetch()}
          tintColor={Colors.primary}
        />
      }
      ListHeaderComponent={
        <>
          {header}
          {activity.isRefetchError && (
            <View style={styles.banner} accessibilityRole="alert">
              <Text style={styles.bannerText}>
                Couldn&apos;t refresh, showing older data. {errorMessage(activity.error)}
              </Text>
            </View>
          )}
        </>
      }
      ListEmptyComponent={<Text style={[styles.muted, styles.footer]}>No activity yet.</Text>}
      ListFooterComponent={
        items.length === 0 ? undefined : activity.isFetchingNextPage ? (
          <ActivityIndicator style={styles.footer} color={Colors.primary} />
        ) : activity.isFetchNextPageError ? (
          <View style={styles.footer}>
            <Text style={styles.bannerText}>{errorMessage(activity.error)}</Text>
            <RetryButton busy={false} onPress={() => activity.fetchNextPage()} />
          </View>
        ) : activity.hasNextPage ? (
          // Fallback when onEndReached doesn't fire (e.g. short list on a tall web window).
          <Pressable accessibilityRole="button" onPress={loadMore} style={styles.footer}>
            <Text style={styles.link}>Load more</Text>
          </Pressable>
        ) : (
          <Text style={[styles.muted, styles.footer]}>That&apos;s everything.</Text>
        )
      }
    />
  );
}

function ActivityRow({ item }: { item: ActivityItem }) {
  // No decimals in activity items: show the server string's own precision.
  const decimals = item.amount.split('.')[1]?.length ?? 0;
  const negative = item.amount.startsWith('-');
  const claimId = item.type === 'claim' ? item.relatedId : null;
  const body = (
    <>
      <View style={styles.row}>
        <Text style={styles.title}>
          {TYPE_LABEL[item.type]} · {item.exchange ?? 'Claim'}
        </Text>
        <Text style={[styles.amount, negative && { color: Colors.danger }]}>
          {negative ? '' : '+'}
          {formatAmount(item.amount, decimals)} {item.asset}
        </Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.muted}>{new Date(item.createdAt).toLocaleString()}</Text>
        <Text style={[styles.badge, { color: STATUS_COLOR[item.status] }]}>{item.status}</Text>
      </View>
    </>
  );
  if (!claimId) return <View style={styles.item}>{body}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityHint="Open claim status"
      onPress={() => router.push({ pathname: '/claims/[id]', params: { id: claimId } })}
      style={({ pressed }) => [styles.item, pressed && styles.pressed]}>
      {body}
    </Pressable>
  );
}

function RetryButton({ busy, onPress }: { busy: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={busy}
      style={[styles.button, busy && styles.disabled]}>
      <Text style={styles.buttonText}>{busy ? 'Retrying…' : 'Retry'}</Text>
    </Pressable>
  );
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
  item: { paddingVertical: Spacing.three, gap: Spacing.one },
  pressed: { opacity: 0.6 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.two },
  title: { fontSize: 16, fontWeight: '600', color: Colors.text, flexShrink: 1 },
  amount: { fontSize: 16, fontWeight: '600', color: Colors.text },
  badge: { fontSize: 13, fontWeight: '600', textTransform: 'capitalize' },
  muted: { fontSize: 13, color: Colors.textSecondary },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: Colors.border },
  footer: { alignItems: 'center', paddingVertical: Spacing.four, gap: Spacing.two, textAlign: 'center' },
  link: { color: Colors.primary, fontSize: 15 },
  banner: { marginBottom: Spacing.two, padding: Spacing.three, borderRadius: 10, backgroundColor: '#FDECEA' },
  bannerText: { color: Colors.danger, fontSize: 14 },
  errorTitle: { fontSize: 18, fontWeight: '600', color: Colors.text },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: Spacing.five,
  },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  disabled: { opacity: 0.5 },
});
