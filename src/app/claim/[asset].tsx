import { Stack, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Colors, Spacing } from '@/constants/theme';

// Stub: the claim flow replaces this screen.
export default function ClaimScreen() {
  const { asset } = useLocalSearchParams<{ asset: string }>();
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: `Claim ${asset}` }} />
      <Text style={styles.text}>Claiming {asset} is coming next.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: Spacing.three, backgroundColor: Colors.background },
  text: { fontSize: 16, color: Colors.text },
});
