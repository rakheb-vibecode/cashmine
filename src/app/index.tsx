import { FlatList, RefreshControl, Text, View } from 'react-native';

import { BalanceRow } from '@/components/balances/balance-row';
import { HeaderActions } from '@/components/balances/header-actions';
import { ErrorView, LoadingView } from '@/components/balances/status-views';
import { styles } from '@/components/balances/styles';
import { TotalHeader } from '@/components/balances/total-header';
import { Colors } from '@/constants/theme';
import { useHomeBalances } from '@/hooks/use-home-balances';

export default function HomeScreen() {
  const { balances, items, unresolved, errorText, refresh } = useHomeBalances();

  if (balances.isPending) return <LoadingView />;
  if (!balances.data) {
    return <ErrorView message={errorText} isFetching={balances.isFetching} onRetry={refresh} />;
  }

  return (
    <FlatList
      style={styles.screen}
      contentContainerStyle={styles.content}
      data={items}
      keyExtractor={(b) => b.asset}
      refreshControl={
        <RefreshControl refreshing={balances.isRefetching} onRefresh={refresh} tintColor={Colors.primary} />
      }
      ListHeaderComponent={
        <View style={styles.summary}>
          <HeaderActions />
          <TotalHeader
            items={items}
            asOf={balances.data.asOf}
            isFetching={balances.isFetching}
            onRefresh={refresh}
            unresolved={unresolved}
            error={balances.isError ? errorText : null}
          />
        </View>
      }
      renderItem={({ item }) => <BalanceRow balance={item} />}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      ListEmptyComponent={<Text style={styles.muted}>No assets yet.</Text>}
    />
  );
}
