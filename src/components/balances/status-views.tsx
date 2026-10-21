import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { HeaderActions } from '@/components/balances/header-actions';
import { styles } from '@/components/balances/styles';
import { Colors } from '@/constants/theme';

export function LoadingView() {
  return (
    <View style={styles.center}>
      <HeaderActions />
      <ActivityIndicator size="large" color={Colors.primary} />
      <Text style={styles.muted}>Loading balances…</Text>
    </View>
  );
}

type ErrorViewProps = { message: string; isFetching: boolean; onRetry: () => void };

export function ErrorView({ message, isFetching, onRetry }: ErrorViewProps) {
  return (
    <View style={styles.center}>
      <HeaderActions />
      <Text style={styles.errorTitle}>Could not load balances</Text>
      <Text style={styles.muted}>{message}</Text>
      <Pressable
        accessibilityRole="button"
        onPress={onRetry}
        disabled={isFetching}
        style={[styles.button, isFetching && styles.disabled]}>
        <Text style={styles.buttonText}>{isFetching ? 'Retrying…' : 'Retry'}</Text>
      </Pressable>
    </View>
  );
}
