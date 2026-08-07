const AWAIT_SINCE_KEY = 'travela_await_balance_since';
const AWAIT_MSISDN_KEY = 'travela_await_balance_msisdn';
const OPTIMISTIC_DATA_MB_KEY = 'travela_optimistic_data_mb';

export type BalancePollContext = {
  since: string;
  msisdn?: string;
  optimisticDataMb: number;
};

export function getOptimisticDataMb(): number | null {
  if (typeof window === 'undefined') return null;
  const raw = sessionStorage.getItem(OPTIMISTIC_DATA_MB_KEY);
  if (raw == null || raw === '') return null;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/** Start or extend optimistic balance polling after a top-up purchase. */
export function startBalancePoll(opts: {
  msisdn?: string;
  purchasedDataMb: number;
  currentDataMb?: number | null;
}) {
  if (typeof window === 'undefined') return;

  const purchased = Math.max(0, opts.purchasedDataMb);
  const baseline =
    getOptimisticDataMb() ??
    (opts.currentDataMb != null && Number.isFinite(opts.currentDataMb)
      ? Math.max(0, opts.currentDataMb)
      : 0);

  sessionStorage.setItem(OPTIMISTIC_DATA_MB_KEY, String(baseline + purchased));
  sessionStorage.setItem(AWAIT_SINCE_KEY, new Date().toISOString());

  if (opts.msisdn) {
    sessionStorage.setItem(AWAIT_MSISDN_KEY, opts.msisdn);
  } else {
    sessionStorage.removeItem(AWAIT_MSISDN_KEY);
  }
}

export function getBalancePollContext(): BalancePollContext | null {
  if (typeof window === 'undefined') return null;

  const since = sessionStorage.getItem(AWAIT_SINCE_KEY);
  const optimistic = getOptimisticDataMb();
  if (!since || optimistic == null) return null;

  const msisdn = sessionStorage.getItem(AWAIT_MSISDN_KEY);
  return msisdn ? { since, msisdn, optimisticDataMb: optimistic } : { since, optimisticDataMb: optimistic };
}

export function clearBalancePoll() {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(AWAIT_SINCE_KEY);
  sessionStorage.removeItem(AWAIT_MSISDN_KEY);
  sessionStorage.removeItem(OPTIMISTIC_DATA_MB_KEY);
}

export function initBalancePollFromUrl() {
  if (typeof window === 'undefined') return;

  const params = new URLSearchParams(window.location.search);
  if (params.get('await_balance') !== '1') return;

  if (!getBalancePollContext()) {
    const purchased = Number(params.get('purchased_mb') ?? '0');
    startBalancePoll({
      msisdn: params.get('msisdn') || undefined,
      purchasedDataMb: Number.isFinite(purchased) ? purchased : 0,
    });
  }

  params.delete('await_balance');
  params.delete('msisdn');
  params.delete('purchased_mb');
  const qs = params.toString();
  window.history.replaceState({}, '', `${window.location.pathname}${qs ? `?${qs}` : ''}`);
}
