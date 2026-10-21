import { useQuery } from '@tanstack/react-query';
import { randomUUID } from 'expo-crypto';
import { Link, router, Stack, useLocalSearchParams } from 'expo-router';
import { useAtomValue, useSetAtom } from 'jotai';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import { queryKeys, useBalances, useToken } from '@/api/queries';
import { queryClient, signOut } from '@/api/query-client';
import { createClaim, getClaimOptions } from '@/api/services';
import { Row, styles } from '@/components/claim-ui';
import { Colors } from '@/constants/theme';
import { formatAmount, validateClaimAmount, type ClaimAmountError } from '@/lib/amount';
import {
  loadSubmission,
  saveSubmission,
  submitWithRetry,
  type ClaimSubmission,
} from '@/lib/claim-submit';
import { addPendingClaimAtom, applyPendingClaims, pendingClaimsAtom } from '@/state/pendingClaims';

type Phase = 'edit' | 'review' | 'submitting' | 'unknown';

export default function ClaimScreen() {
  const { asset } = useLocalSearchParams<{ asset: string }>();
  const token = useToken();
  const balances = useBalances();
  const pendingClaims = useAtomValue(pendingClaimsAtom);
  const addPendingClaim = useSetAtom(addPendingClaimAtom);
  const options = useQuery({
    queryKey: queryKeys.claimOptions(asset),
    queryFn: ({ signal }) => getClaimOptions(token, asset, signal),
  });

  const [amount, setAmount] = useState('');
  const [destinationId, setDestinationId] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>('edit');
  const [serverError, setServerError] = useState<{ field?: string; message: string } | null>(null);
  // Resume an unresolved submission (e.g. after a reload) instead of letting the user claim again.
  const [submission, setSubmission] = useState<ClaimSubmission | null>(() => {
    const s = loadSubmission();
    return s?.body.asset === asset ? s : null;
  });
  const running = useRef(false);

  async function run(sub: ClaimSubmission) {
    if (running.current) return; // no double submit
    running.current = true;
    setPhase('submitting');
    setServerError(null);
    const result = await submitWithRetry(sub, (s) => createClaim(token, s.body, s.key));
    running.current = false;

    if (result.kind === 'created') {
      const { claim } = result;
      saveSubmission(null);
      addPendingClaim({
        claimId: claim.id,
        asset: claim.asset,
        amount: claim.amount,
        createdAt: claim.createdAt,
      });
      queryClient.setQueryData(queryKeys.claim(claim.id), claim);
      router.replace({ pathname: '/claims/[id]', params: { id: claim.id } });
    } else if (result.kind === 'rejected') {
      // The server answered and created nothing: safe to forget the key.
      saveSubmission(null);
      setSubmission(null);
      const e = result.error;
      if (e.isUnauthorized) return signOut('Your token was rejected or has expired. Enter a valid token.');
      setServerError({
        field: e.field,
        message:
          e.code === 'IDEMPOTENCY_MISMATCH'
            ? 'This claim conflicted with an earlier request. Check your activity before trying again.'
            : e.message,
      });
      setPhase('edit');
    } else {
      setPhase('unknown');
    }
  }

  const persisted = submission ?? loadSubmission();
  useEffect(() => {
    // One-off resume on mount; run() starts with setPhase, which is the point.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (submission) void run(submission);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once on mount
  }, []);

  const header = <Stack.Screen options={{ title: `Claim ${asset}` }} />;

  if (persisted && persisted.body.asset !== asset) {
    return (
      <View style={styles.center}>
        {header}
        <Text style={styles.text}>
          Your {persisted.body.asset} claim is still being confirmed. Finish it first.
        </Text>
        <Link href={{ pathname: '/claim/[asset]', params: { asset: persisted.body.asset } }} style={styles.link}>
          Go to {persisted.body.asset} claim
        </Link>
      </View>
    );
  }

  if (phase === 'submitting' || phase === 'unknown') {
    return (
      <View style={styles.center}>
        {header}
        {phase === 'submitting' ? (
          <>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.text}>Checking claim status…</Text>
          </>
        ) : (
          <>
            <Text style={[styles.text, styles.error]} accessibilityRole="alert">
              We couldn&apos;t confirm your claim. Don&apos;t claim again — tap Retry check.
            </Text>
            <Pressable
              accessibilityRole="button"
              style={styles.button}
              onPress={() => submission && run(submission)}>
              <Text style={styles.buttonText}>Retry check</Text>
            </Pressable>
          </>
        )}
      </View>
    );
  }

  const rawBalance = balances.data?.items.find((b) => b.asset === asset);
  if (!options.data || !balances.data || !rawBalance) {
    const loading = options.isPending || balances.isPending;
    return (
      <View style={styles.center}>
        {header}
        {loading ? (
          <ActivityIndicator size="large" color={Colors.primary} />
        ) : (
          <>
            <Text style={styles.text}>
              {options.error?.message ?? balances.error?.message ?? `No ${asset} balance.`}
            </Text>
            <Pressable
              accessibilityRole="button"
              style={styles.button}
              onPress={() => {
                void options.refetch();
                void balances.refetch();
              }}>
              <Text style={styles.buttonText}>Retry</Text>
            </Pressable>
          </>
        )}
      </View>
    );
  }

  const [balance] = applyPendingClaims([rawBalance], balances.data.asOf, pendingClaims);
  const { decimals } = balance;
  const opts = options.data;
  const fmt = (v: Parameters<typeof formatAmount>[0]) => `${formatAmount(v, decimals)} ${asset}`;
  const destination = opts.destinations.find((d) => d.id === destinationId) ?? opts.destinations[0];
  const validation = validateClaimAmount({
    input: amount,
    decimals,
    minAmount: opts.minAmount,
    available: balance.available,
    fee: opts.fee,
  });
  const amountError =
    serverError?.field === 'amount'
      ? serverError.message
      : !validation.ok
        ? errorText(validation.error, decimals, fmt(opts.minAmount), fmt(opts.fee))
        : null;
  const formError = serverError && serverError.field !== 'amount' ? serverError.message : null;

  if (phase === 'review' && validation.ok && destination) {
    const confirm = () => {
      if (running.current) return;
      const sub: ClaimSubmission = {
        key: randomUUID(),
        body: { asset, amount, destinationId: destination.id },
      };
      saveSubmission(sub); // before sending, so a reload mid-request resumes with this key
      setSubmission(sub);
      void run(sub);
    };
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        {header}
        <Text style={styles.title}>Review claim</Text>
        <Row label="Asset" value={asset} />
        <Row label="Amount" value={fmt(amount)} />
        <Row label="Fee" value={fmt(opts.fee)} />
        <Row label="You receive" value={fmt(validation.receive)} strong />
        <Row label="Destination" value={destination.label} />
        <Pressable accessibilityRole="button" style={styles.button} onPress={confirm}>
          <Text style={styles.buttonText}>Confirm</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => setPhase('edit')} hitSlop={8}>
          <Text style={[styles.link, styles.centerText]}>Edit</Text>
        </Pressable>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {header}
      <Row label="Available" value={fmt(balance.available)} strong />
      <Row label="Minimum" value={fmt(opts.minAmount)} />
      <Row label="Fee" value={fmt(opts.fee)} />

      <Text style={styles.label}>Amount</Text>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={amount}
          // Some locales' decimal pads type "," as the separator.
          onChangeText={(t) => {
            setAmount(t.replace(',', '.'));
            setServerError(null);
          }}
          keyboardType="decimal-pad"
          placeholder="0.00"
          accessibilityLabel={`Amount in ${asset}`}
          autoCorrect={false}
        />
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            setAmount(balance.available);
            setServerError(null);
          }}
          style={styles.maxButton}>
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
            onPress={() => setDestinationId(d.id)}
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
        disabled={!validation.ok || !destination || serverError?.field === 'amount'}
        style={[styles.button, (!validation.ok || !destination || serverError?.field === 'amount') && styles.disabled]}
        onPress={() => setPhase('review')}>
        <Text style={styles.buttonText}>Review</Text>
      </Pressable>
    </ScrollView>
  );
}

function errorText(error: ClaimAmountError, decimals: number, min: string, fee: string): string {
  switch (error) {
    case 'empty':
      return 'Enter an amount.';
    case 'format':
      return 'Enter a number like 0.5.';
    case 'too_many_decimals':
      return `At most ${decimals} decimal places.`;
    case 'below_min':
      return `Minimum is ${min}.`;
    case 'above_available':
      return 'More than your available balance.';
    case 'not_above_fee':
      return `Must be more than the fee (${fee}).`;
  }
}
