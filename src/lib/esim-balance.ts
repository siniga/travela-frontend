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

/** Live data remaining from `user_esims.balances.DATA` (stored as-is, not KB). */
export function dataMbFromBalances(balances: unknown): number | null {
  if (!balances || typeof balances !== 'object') return null;
  const record = balances as Record<string, unknown>;
  const raw = record.DATA ?? record.data;
  if (raw === null || raw === undefined || raw === '') return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

/** Prefer live Vodacom DATA on the assignment. Do not fall back to bundle size. */
export function dataMbFromAssignment(record: BalanceRecord | null | undefined): number | null {
  if (!record) return null;
  return dataMbFromBalances(record.balances);
}

export function dataMbFromBalanceStatusBody(body: unknown): number | null {
  if (!body || typeof body !== 'object') return null;
  const root = body as Record<string, unknown>;
  const data = root.data;
  if (!data || typeof data !== 'object') return null;
  return dataMbFromAssignment(data as BalanceRecord);
}
