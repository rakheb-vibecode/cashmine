import { Stack } from 'expo-router';
import { FlatList, RefreshControl } from 'react-native';

import { ActivityFooter } from '@/components/activity/activity-footer';
import { ActivityRow, ActivitySeparator } from '@/components/activity/activity-row';
import {
  ActivityEmpty,
  ActivityError,
  ActivityLoading,
  RefreshErrorBanner,
} from '@/components/activity/activity-states';
import { styles } from '@/components/activity/styles';
import { Colors } from '@/constants/theme';
import { useActivityFeed } from '@/hooks/use-activity-feed';

export default function ActivityScreen() {
  const { query, items, loadMore, retryNextPage, refresh, refreshing, errorText } = useActivityFeed();
  const header = <Stack.Screen options={{ title: 'Activity' }} />;

  if (query.isPending) return <>{header}<ActivityLoading /></>;
  if (!query.data) {
    return <>{header}<ActivityError message={errorText} busy={query.isFetching} onRetry={refresh} /></>;
  }

  return (
    <FlatList
      style={styles.screen}
      contentContainerStyle={styles.content}
      data={items}
      keyExtractor={(i) => i.id}
      renderItem={({ item }) => <ActivityRow item={item} />}
      ItemSeparatorComponent={ActivitySeparator}
      onEndReached={loadMore}
      onEndReachedThreshold={0.5}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={Colors.primary} />}
      ListHeaderComponent={<>{header}{query.isRefetchError && <RefreshErrorBanner message={errorText} />}</>}
      ListEmptyComponent={<ActivityEmpty />}
      ListFooterComponent={
        items.length === 0 ? undefined : (
          <ActivityFooter
            loading={query.isFetchingNextPage}
            error={query.isFetchNextPageError ? errorText : null}
            hasMore={query.hasNextPage}
            onRetry={retryNextPage}
            onLoadMore={loadMore}
          />
        )
      }
    />
  );
}
