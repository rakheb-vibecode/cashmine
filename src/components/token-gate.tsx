import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useState, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, MaxContentWidth, Spacing } from '@/constants/theme';
import { hydratedAtom } from '@/state/hydrate';
import { signOutReasonAtom, tokenAtom } from '@/state/token';

// Renders children only once an API token is stored. Clearing the token
// (header button, or a 401 from the API) brings this screen back.
export function TokenGate({ children }: { children: ReactNode }) {
  const hydrated = useAtomValue(hydratedAtom);
  const token = useAtomValue(tokenAtom);
  // Storage reads are async on native: don't flash the token screen before they finish.
  if (!hydrated) {
    return (
      <View style={styles.safe}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }
  if (!token) return <TokenScreen />;
  return children;
}

function TokenScreen() {
  const setToken = useSetAtom(tokenAtom);
  const [reason, setReason] = useAtom(signOutReasonAtom);
  const [value, setValue] = useState('');
  const trimmed = value.trim();

  const save = () => {
    if (!trimmed) return;
    setReason(null);
    setToken(trimmed);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.card}>
        <Text style={styles.title}>CashMine</Text>
        <Text style={styles.hint}>
          Paste your API token to continue. It is stored only on this device.
        </Text>
        {reason && (
          <Text accessibilityRole="alert" style={styles.reason}>
            {reason}
          </Text>
        )}
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
  reason: { fontSize: 15, color: Colors.danger },
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
