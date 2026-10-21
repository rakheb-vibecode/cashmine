import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import type { ClaimFormState } from '@/hooks/use-claim-form';

import { Row, styles } from './ui';

export function ClaimForm({
  asset,
  form,
  onReview,
}: {
  asset: string;
  form: ClaimFormState;
  onReview: () => void;
}) {
  const { amount, balance, opts, fmt, destination, validation, amountError, formError } = form;
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Row label="Available" value={fmt(balance.available)} strong />
      <Row label="Minimum" value={fmt(opts.minAmount)} />
      <Row label="Fee" value={fmt(opts.fee)} />

      <Text style={styles.label}>Amount</Text>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={amount}
          onChangeText={form.changeAmount}
          keyboardType="decimal-pad"
          placeholder="0.00"
          accessibilityLabel={`Amount in ${asset}`}
          autoCorrect={false}
        />
        <Pressable accessibilityRole="button" onPress={form.setMax} style={styles.maxButton}>
          <Text style={styles.link}>Max</Text>
        </Pressable>
      </View>
      {amount !== '' && amountError && (
        <Text style={styles.error} accessibilityRole="alert">
          {amountError}
        </Text>
      )}
      {validation.ok && <Row label="You receive" value={fmt(validation.receive)} strong />}

      <Text style={styles.label}>Destination</Text>
      {opts.destinations.length > 1 ? (
        opts.destinations.map((d) => (
          <Pressable
            key={d.id}
            accessibilityRole="radio"
            accessibilityState={{ checked: d.id === destination?.id }}
            onPress={() => form.setDestinationId(d.id)}
            style={[styles.option, d.id === destination?.id && styles.optionSelected]}>
            <Text style={styles.text}>{d.label}</Text>
          </Pressable>
        ))
      ) : (
        <Text style={styles.text}>{destination?.label ?? 'No destination available'}</Text>
      )}

      {formError && (
        <Text style={styles.error} accessibilityRole="alert">
          {formError}
        </Text>
      )}
      <Pressable
        accessibilityRole="button"
        disabled={!form.canReview}
        style={[styles.button, !form.canReview && styles.disabled]}
        onPress={onReview}>
        <Text style={styles.buttonText}>Review</Text>
      </Pressable>
    </ScrollView>
  );
}
