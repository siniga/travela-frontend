export type BundleDetail = {
  data_mb?: number | null;
  name?: string | null;
};

export type BalanceRecord = {
  balances?: Record<string, unknown> | null;
  balance?: string | number | null;
  balance_fetched_at?: string | null;
  bundle?: BundleDetail | null;
  order_item?: { data_amount?: number | null } | null;
};

export function dataMbFromBalances(balances: unknown): number | null {
  if (!balances || typeof balances !== 'object') return null;
  const record = balances as Record<string, unknown>;
  const dataKb = record.DATA ?? record.data;
  if (dataKb == null || dataKb === '') return null;
  const n = Number(dataKb);
  return Number.isFinite(n) ? n / 1024 : null;
}

function coerceNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

/** Prefer live Vodacom DATA balance; fall back to bundle / order item metadata. */
export function dataMbFromAssignment(record: BalanceRecord | null | undefined): number | null {
  if (!record) return null;

  const fromCarrier = dataMbFromBalances(record.balances);
  if (fromCarrier != null && fromCarrier >= 0) return fromCarrier;

  const fromBundle = coerceNumber(record.bundle?.data_mb);
  if (fromBundle != null && fromBundle > 0) return fromBundle;

  const fromOrderItem = coerceNumber(record.order_item?.data_amount);
  if (fromOrderItem != null && fromOrderItem > 0) return fromOrderItem;

  return null;
}

export function dataMbFromBalanceStatusBody(body: unknown): number | null {
  if (!body || typeof body !== 'object') return null;
  const root = body as Record<string, unknown>;
  const data = root.data;
  if (!data || typeof data !== 'object') return null;
  return dataMbFromAssignment(data as BalanceRecord);
}
