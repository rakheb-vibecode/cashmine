import { Link, Stack } from 'expo-router';
import { Pressable, Text } from 'react-native';

import { signOut } from '@/api/query-client';
import { styles } from '@/components/balances/styles';

export function HeaderActions() {
  return (
    <Stack.Screen
      options={{
        title: 'Balances',
        headerTitleAlign: 'center',
        headerLeft: () => (
          <Link href="/activity" style={[styles.link, styles.headerLeft]}>
            Activity
          </Link>
        ),
        headerRight: () => (
          <Pressable accessibilityRole="button" onPress={() => signOut()} hitSlop={8} style={styles.headerRight}>
            <Text style={styles.link}>Change token</Text>
          </Pressable>
        ),
      }}
    />
  );
}
