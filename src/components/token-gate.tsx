import { useAtomValue, useSetAtom } from 'jotai';
import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, MaxContentWidth, Spacing } from '@/constants/theme';
import { tokenAtom } from '@/state/token';

// Renders children only once an API token is stored. Clearing the token
// (header button, or a 401 from the API) brings this screen back.
export function TokenGate({ children }: { children: ReactNode }) {
  const token = useAtomValue(tokenAtom);
  if (!token) return <TokenScreen />;
  return children;
}

function TokenScreen() {
  const setToken = useSetAtom(tokenAtom);
  const [value, setValue] = useState('');
  const trimmed = value.trim();

  const save = () => {
    if (trimmed) setToken(trimmed);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.card}>
        <Text style={styles.title}>CashMine</Text>
        <Text style={styles.hint}>
          Paste your API token to continue. It is stored only in this browser.
        </Text>
        <TextInput
          accessibilityLabel="API token"
          value={value}
          onChangeText={setValue}
          onSubmitEditing={save}
          placeholder="API token"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="off"
          secureTextEntry
          style={styles.input}
        />
        <Pressable
          accessibilityRole="button"
          onPress={save}
          disabled={!trimmed}
          style={[styles.button, !trimmed && styles.buttonDisabled]}>
          <Text style={styles.buttonText}>Save</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.three,
  },
  card: { width: '100%', maxWidth: MaxContentWidth, gap: Spacing.three },
  title: { fontSize: 28, fontWeight: '700', color: Colors.text },
  hint: { fontSize: 15, color: Colors.textSecondary },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: Spacing.three,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.text,
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.4 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});
