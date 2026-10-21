import { StyleSheet } from 'react-native';

import { Colors, MaxContentWidth, Spacing } from '@/constants/theme';

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    padding: Spacing.three,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    padding: Spacing.four,
    backgroundColor: Colors.background,
  },
  item: { paddingVertical: Spacing.three, gap: Spacing.one },
  pressed: { opacity: 0.6 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.two },
  title: { fontSize: 16, fontWeight: '600', color: Colors.text, flexShrink: 1 },
  amount: { fontSize: 16, fontWeight: '600', color: Colors.text },
  badge: { fontSize: 13, fontWeight: '600', textTransform: 'capitalize' },
  muted: { fontSize: 13, color: Colors.textSecondary },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: Colors.border },
  footer: { alignItems: 'center', paddingVertical: Spacing.four, gap: Spacing.two, textAlign: 'center' },
  link: { color: Colors.primary, fontSize: 15 },
  banner: { marginBottom: Spacing.two, padding: Spacing.three, borderRadius: 10, backgroundColor: '#FDECEA' },
  bannerText: { color: Colors.danger, fontSize: 14 },
  errorTitle: { fontSize: 18, fontWeight: '600', color: Colors.text },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: Spacing.five,
  },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  disabled: { opacity: 0.5 },
});
