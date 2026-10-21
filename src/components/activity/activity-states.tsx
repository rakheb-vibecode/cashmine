import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { Colors } from '@/constants/theme';

import { styles } from './styles';

export function RetryButton({ busy, onPress }: { busy: boolean; onPress: () => void }) {
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

export function ActivityLoading() {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={Colors.primary} />
      <Text style={styles.muted}>Loading activity…</Text>
    </View>
  );
}

export function ActivityError({
  message,
  busy,
  onRetry,
}: {
  message: string;
  busy: boolean;
  onRetry: () => void;
}) {
  return (
    <View style={styles.center}>
      <Text style={styles.errorTitle}>Could not load activity</Text>
      <Text style={styles.muted}>{message}</Text>
      <RetryButton busy={busy} onPress={onRetry} />
    </View>
  );
}

export function RefreshErrorBanner({ message }: { message: string }) {
  return (
    <View style={styles.banner} accessibilityRole="alert">
      <Text style={styles.bannerText}>Couldn&apos;t refresh, showing older data. {message}</Text>
    </View>
  );
}

export function ActivityEmpty() {
  return <Text style={[styles.muted, styles.footer]}>No activity yet.</Text>;
}
