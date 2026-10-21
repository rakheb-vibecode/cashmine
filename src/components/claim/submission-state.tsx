import { Link } from 'expo-router';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { Colors } from '@/constants/theme';

import { styles } from './ui';

export function OtherClaimPending({ asset }: { asset: string }) {
  return (
    <View style={styles.center}>
      <Text style={styles.text}>Your {asset} claim is still being confirmed. Finish it first.</Text>
      <Link href={{ pathname: '/claim/[asset]', params: { asset } }} style={styles.link}>
        Go to {asset} claim
      </Link>
    </View>
  );
}

export function SubmissionState({
  phase,
  onRetry,
}: {
  phase: 'submitting' | 'unknown';
  onRetry: () => void;
}) {
  return (
    <View style={styles.center}>
      {phase === 'submitting' ? (
        <>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.text}>Checking claim status…</Text>
        </>
      ) : (
        <>
          <Text style={[styles.text, styles.error]} accessibilityRole="alert">
            We couldn&apos;t confirm your claim. Don&apos;t claim again — tap Retry check.
          </Text>
          <Pressable accessibilityRole="button" style={styles.button} onPress={onRetry}>
            <Text style={styles.buttonText}>Retry check</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}
