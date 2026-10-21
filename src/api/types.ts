// Amounts are decimal strings in the asset's unit and are never converted to JS numbers.

export type DecimalString = string;
export type IsoDateString = string;

export type Balance = {
  asset: string;
  decimals: number;
  available: DecimalString;
  pending: DecimalString;
  claiming: DecimalString;
  usdPrice: DecimalString;
};

export type BalancesResponse = {
  asOf: IsoDateString;
  items: Balance[];
};

export type ActivityType = 'accrual' | 'reversal' | 'claim';
// accrual: pending | confirmed; reversal: confirmed; claim: pending | completed | failed
export type ActivityStatus = 'pending' | 'confirmed' | 'completed' | 'failed';

export type ActivityItem = {
  id: string;
  type: ActivityType;
  asset: string;
  /** Signed: negative for reversals and claims. */
  amount: DecimalString;
  status: ActivityStatus;
  /** null for claims */
  exchange: string | null;
  createdAt: IsoDateString;
  /** reversal: the accrual id; claim: the claim id (null for older claims) */
  relatedId: string | null;
};

export type ActivityResponse = {
  items: ActivityItem[];
  nextCursor: string | null;
};

export type ClaimDestination = {
  id: string;
  label: string;
};

export type ClaimOptions = {
  asset: string;
  minAmount: DecimalString;
  /** Taken from the claimed amount: receive = amount - fee. */
  fee: DecimalString;
  destinations: ClaimDestination[];
};

export type CreateClaimBody = {
  asset: string;
  amount: DecimalString;
  destinationId: string;
};

export type ClaimStatus = 'pending' | 'completed' | 'failed';

export type Claim = {
  id: string;
  asset: string;
  amount: DecimalString;
  fee: DecimalString;
  receiveAmount: DecimalString;
  destinationId: string;
  status: ClaimStatus;
  failureReason: string | null;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
};

export type ApiErrorCode =
  | 'VALIDATION'
  | 'UNAUTHORIZED'
  | 'NOT_FOUND'
  | 'IDEMPOTENCY_MISMATCH'
  | 'RATE_LIMITED'
  | 'SERVER'
  | 'TIMEOUT';

export type ApiErrorBody = {
  error: {
    code: ApiErrorCode | string;
    message: string;
    field?: string;
    retryAfterMs?: number;
  };
};
