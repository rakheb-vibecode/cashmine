import { Pressable, ScrollView, Text } from 'react-native';

import { Row, styles } from './ui';

export function ClaimReview({
  asset,
  amount,
  fee,
  receive,
  destination,
  onConfirm,
  onEdit,
}: {
  asset: string;
  amount: string;
  fee: string;
  receive: string;
  destination: string;
  onConfirm: () => void;
  onEdit: () => void;
}) {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Review claim</Text>
      <Row label="Asset" value={asset} />
      <Row label="Amount" value={amount} />
      <Row label="Fee" value={fee} />
      <Row label="You receive" value={receive} strong />
      <Row label="Destination" value={destination} />
      <Pressable accessibilityRole="button" style={styles.button} onPress={onConfirm}>
        <Text style={styles.buttonText}>Confirm</Text>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={onEdit} hitSlop={8}>
        <Text style={[styles.link, styles.centerText]}>Edit</Text>
      </Pressable>
    </ScrollView>
  );
}
