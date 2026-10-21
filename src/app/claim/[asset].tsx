import { Stack, useLocalSearchParams } from 'expo-router';

import { ClaimForm } from '@/components/claim/claim-form';
import { ClaimReview } from '@/components/claim/claim-review';
import { LoadState } from '@/components/claim/load-state';
import { OtherClaimPending, SubmissionState } from '@/components/claim/submission-state';
import { useClaimForm } from '@/hooks/use-claim-form';
import { useClaimSubmission } from '@/hooks/use-claim-submission';

export default function ClaimScreen() {
  const { asset } = useLocalSearchParams<{ asset: string }>();
  const { phase, setPhase, serverError, setServerError, persisted, retry, confirm } =
    useClaimSubmission(asset);
  const { load, form } = useClaimForm(asset, serverError, setServerError);
  const header = <Stack.Screen options={{ title: `Claim ${asset}` }} />;

  const body = () => {
    if (persisted && persisted.body.asset !== asset) return <OtherClaimPending asset={persisted.body.asset} />;
    if (phase === 'submitting' || phase === 'unknown') return <SubmissionState phase={phase} onRetry={retry} />;
    if (!form) return <LoadState {...load} />;
    const { fmt, validation, destination } = form;
    if (phase === 'review' && validation.ok && destination) {
      return (
        <ClaimReview
          asset={asset}
          amount={fmt(form.amount)}
          fee={fmt(form.opts.fee)}
          receive={fmt(validation.receive)}
          destination={destination.label}
          onConfirm={() => confirm(form.amount, destination.id)}
          onEdit={() => setPhase('edit')}
        />
      );
    }
    return <ClaimForm asset={asset} form={form} onReview={() => setPhase('review')} />;
  };

  return (
    <>
      {header}
      {body()}
    </>
  );
}
