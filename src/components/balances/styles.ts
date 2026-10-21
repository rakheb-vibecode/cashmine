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
  summary: { gap: Spacing.one, marginBottom: Spacing.four },
  total: { fontSize: 36, fontWeight: '700', color: Colors.text },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  muted: { fontSize: 14, color: Colors.textSecondary },
  link: { color: Colors.primary, fontSize: 15 },
  headerLeft: { paddingLeft: Spacing.three },
  headerRight: { paddingRight: Spacing.three },
  disabled: { opacity: 0.5 },
  banner: {
    marginTop: Spacing.two,
    padding: Spacing.three,
    borderRadius: 10,
    backgroundColor: '#FDECEA',
  },
  bannerText: { color: Colors.danger, fontSize: 14 },
  errorTitle: { fontSize: 18, fontWeight: '600', color: Colors.text },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: Spacing.five,
  },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  item: { paddingVertical: Spacing.three, gap: Spacing.one },
  pressed: { opacity: 0.6 },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: Colors.border },
  asset: { fontSize: 17, fontWeight: '600', color: Colors.text },
  usd: { fontSize: 15, color: Colors.text },
  available: { fontSize: 22, fontWeight: '600', color: Colors.text },
  small: { fontSize: 13, color: Colors.textSecondary },
});
