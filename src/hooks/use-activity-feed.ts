import { isApiError } from '@/api/http';
import { useActivity } from '@/api/queries';

export function useActivityFeed() {
  const query = useActivity();
  const items = query.data?.pages.flatMap((p) => p.items) ?? [];

  const loadMore = () => {
    // isFetching, not isFetchingNextPage: fetchNextPage during a pull-to-refresh would cancel the refetch.
    if (query.hasNextPage && !query.isFetching && !query.isFetchNextPageError) {
      void query.fetchNextPage();
    }
  };

  return {
    query,
    items,
    loadMore,
    retryNextPage: () => void query.fetchNextPage(),
    refresh: () => void query.refetch(),
    refreshing: query.isRefetching && !query.isFetchingNextPage,
    errorText: isApiError(query.error) ? query.error.message : 'Something went wrong.',
  };
}
