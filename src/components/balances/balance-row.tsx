import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import type { Balance } from '@/api/types';
import { styles } from '@/components/balances/styles';
import { assetTotal, formatAmount, formatUsd, toUsd } from '@/lib/amount';

export function BalanceRow({ balance: b }: { balance: Balance }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityHint={`Claim ${b.asset}`}
      onPress={() => router.push({ pathname: '/claim/[asset]', params: { asset: b.asset } })}
      style={({ pressed }) => [styles.item, pressed && styles.pressed]}>
      <View style={styles.row}>
        <Text style={styles.asset}>{b.asset}</Text>
        <Text style={styles.usd}>{formatUsd(toUsd(assetTotal(b), b.usdPrice))}</Text>
      </View>
      <Text style={styles.available}>
        {formatAmount(b.available, b.decimals)} <Text style={styles.muted}>available</Text>
      </Text>
      <Text style={styles.small}>
        Pending {formatAmount(b.pending, b.decimals)} · Claiming{' '}
        {formatAmount(b.claiming, b.decimals)}
      </Text>
    </Pressable>
  );
}
