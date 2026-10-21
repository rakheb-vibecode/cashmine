import { Stack } from 'expo-router';
import { useSetAtom } from 'jotai';
import { Pressable, Text, View } from 'react-native';

import { tokenAtom } from '@/state/token';

export default function HomeScreen() {
  const setToken = useSetAtom(tokenAtom);
  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Stack.Screen
        options={{
          title: 'Balances',
          headerRight: () => (
            <Pressable accessibilityRole="button" onPress={() => setToken(null)} hitSlop={8}>
              <Text style={{ color: '#1A6DFF', fontSize: 15 }}>Change token</Text>
            </Pressable>
          ),
        }}
      />
      <Text>CashMine</Text>
    </View>
  );
}
