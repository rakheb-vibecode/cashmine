import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { Colors } from '@/constants/theme';

import { RetryButton } from './activity-states';
import { styles } from './styles';

export function ActivityFooter({
  loading,
  error,
  hasMore,
  onRetry,
  onLoadMore,
}: {
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  onRetry: () => void;
  onLoadMore: () => void;
}) {
  if (loading) return <ActivityIndicator style={styles.footer} color={Colors.primary} />;
  if (error !== null) {
    return (
      <View style={styles.footer}>
        <Text style={styles.bannerText}>{error}</Text>
        <RetryButton busy={false} onPress={onRetry} />
      </View>
    );
  }
  if (hasMore) {
    // Fallback when onEndReached doesn't fire (e.g. short list on a tall web window).
    return (
      <Pressable accessibilityRole="button" onPress={onLoadMore} style={styles.footer}>
        <Text style={styles.link}>Load more</Text>
      </Pressable>
    );
  }
  return <Text style={[styles.muted, styles.footer]}>That&apos;s everything.</Text>;
}
