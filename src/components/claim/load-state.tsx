import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { Colors } from '@/constants/theme';

import { styles } from './ui';

export function LoadState({
  loading,
  message,
  onRetry,
}: {
  loading: boolean;
  message: string;
  onRetry: () => void;
}) {
  return (
    <View style={styles.center}>
      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} />
      ) : (
        <>
          <Text style={styles.text}>{message}</Text>
          <Pressable accessibilityRole="button" style={styles.button} onPress={onRetry}>
            <Text style={styles.buttonText}>Retry</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}
