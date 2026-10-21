import { Stack } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { isApiError } from '@/api/client';
import { useBalances } from '@/api/queries';
import { signOut } from '@/api/query-client';
import { Colors, Spacing } from '@/constants/theme';

// Placeholder: dumps the raw balances response. Replaced by the balances screen.
export default function HomeScreen() {
  const balances = useBalances();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Stack.Screen
        options={{
          title: 'Balances',
          headerRight: () => (
            <Pressable accessibilityRole="button" onPress={signOut} hitSlop={8}>
              <Text style={styles.link}>Change token</Text>
            </Pressable>
          ),
        }}
      />
      {balances.isPending && <Text>Loading…</Text>}
      {balances.isError && (
        <Text style={styles.error}>
          {isApiError(balances.error)
            ? `${balances.error.code}: ${balances.error.message}`
            : String(balances.error)}
        </Text>
      )}
      <Pressable accessibilityRole="button" onPress={() => balances.refetch()}>
        <Text style={styles.link}>{balances.isFetching ? 'Refreshing…' : 'Refresh'}</Text>
      </Pressable>
      {balances.data && <Text style={styles.json}>{JSON.stringify(balances.data, null, 2)}</Text>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: Spacing.three, gap: Spacing.three },
  link: { color: Colors.primary, fontSize: 15 },
  error: { color: Colors.danger },
  json: { fontFamily: 'monospace', fontSize: 12, color: Colors.text },
});
