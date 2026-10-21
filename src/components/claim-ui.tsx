import { StyleSheet, Text, View } from 'react-native';

import { Colors, MaxContentWidth, Spacing } from '@/constants/theme';

// Shared by the claim form and the claim status screen.
export function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={styles.muted}>{label}</Text>
      <Text style={[styles.text, strong && styles.strong]}>{value}</Text>
    </View>
  );
}

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    padding: Spacing.three,
    gap: Spacing.three,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    padding: Spacing.four,
    backgroundColor: Colors.background,
  },
  title: { fontSize: 22, fontWeight: '700', color: Colors.text },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.three },
  text: { fontSize: 16, color: Colors.text, flexShrink: 1, textAlign: 'right' },
  centerText: { textAlign: 'center' },
  strong: { fontWeight: '700' },
  muted: { fontSize: 15, color: Colors.textSecondary },
  label: { fontSize: 15, fontWeight: '600', color: Colors.text, marginTop: Spacing.two },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  input: {
    flex: 1,
    fontSize: 22,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    padding: Spacing.three,
    color: Colors.text,
  },
  maxButton: { padding: Spacing.three },
  option: { borderWidth: 1, borderColor: Colors.border, borderRadius: 10, padding: Spacing.three },
  optionSelected: { borderColor: Colors.primary, backgroundColor: Colors.backgroundElement },
  error: { color: Colors.danger, fontSize: 14 },
  link: { color: Colors.primary, fontSize: 16 },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: Spacing.five,
    alignItems: 'center',
  },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  disabled: { opacity: 0.5 },
});
