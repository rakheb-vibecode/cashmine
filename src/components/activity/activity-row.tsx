import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import type { ActivityItem, ActivityStatus } from '@/api/types';
import { Colors } from '@/constants/theme';
import { formatAmount } from '@/lib/amount';

import { styles } from './styles';

const TYPE_LABEL = { accrual: 'Payback', reversal: 'Reversal', claim: 'Claim' } as const;

const STATUS_COLOR: Record<ActivityStatus, string> = {
  pending: Colors.warning,
  confirmed: Colors.success,
  completed: Colors.success,
  failed: Colors.danger,
};

export function StatusBadge({ status }: { status: ActivityStatus }) {
  return <Text style={[styles.badge, { color: STATUS_COLOR[status] }]}>{status}</Text>;
}

export function ActivitySeparator() {
  return <View style={styles.separator} />;
}

export function ActivityRow({ item }: { item: ActivityItem }) {
  // No decimals in activity items: show the server string's own precision.
  const decimals = item.amount.split('.')[1]?.length ?? 0;
  const negative = item.amount.startsWith('-');
  const claimId = item.type === 'claim' ? item.relatedId : null;
  const body = (
    <>
      <View style={styles.row}>
        <Text style={styles.title}>
          {item.exchange ? `${TYPE_LABEL[item.type]} · ${item.exchange}` : TYPE_LABEL[item.type]}
        </Text>
        <Text style={[styles.amount, negative && { color: Colors.danger }]}>
          {negative ? '' : '+'}
          {formatAmount(item.amount, decimals)} {item.asset}
        </Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.muted}>{new Date(item.createdAt).toLocaleString()}</Text>
        <StatusBadge status={item.status} />
      </View>
    </>
  );
  if (!claimId) return <View style={styles.item}>{body}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityHint="Open claim status"
      onPress={() => router.push({ pathname: '/claims/[id]', params: { id: claimId } })}
      style={({ pressed }) => [styles.item, pressed && styles.pressed]}>
      {body}
    </Pressable>
  );
}
