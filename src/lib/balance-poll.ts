const AWAIT_SINCE_KEY = 'travela_await_balance_since';
const AWAIT_MSISDN_KEY = 'travela_await_balance_msisdn';
const OPTIMISTIC_DATA_MB_KEY = 'travela_optimistic_data_mb';

export type BalancePollContext = {
  since: string;
  msisdn?: string;
  optimisticDataMb: number;
};

function readStored(key: string): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(key) ?? localStorage.getItem(key);
}

function writeStored(key: string, value: string) {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(key, value);
  localStorage.setItem(key, value);
}

function removeStored(key: string) {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(key);
  localStorage.removeItem(key);
}

export function getOptimisticDataMb(): number | null {
  const raw = readStored(OPTIMISTIC_DATA_MB_KEY);
  if (raw == null || raw === '') return null;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/** Start or extend optimistic balance polling after checkout or a top-up. */
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

  writeStored(OPTIMISTIC_DATA_MB_KEY, String(baseline + purchased));
  writeStored(AWAIT_SINCE_KEY, new Date().toISOString());

  if (opts.msisdn) {
    writeStored(AWAIT_MSISDN_KEY, opts.msisdn);
  } else {
    removeStored(AWAIT_MSISDN_KEY);
  }
}

export function getBalancePollContext(): BalancePollContext | null {
  if (typeof window === 'undefined') return null;

  const since = readStored(AWAIT_SINCE_KEY);
  const optimistic = getOptimisticDataMb();
  if (!since || optimistic == null) return null;

  const msisdn = readStored(AWAIT_MSISDN_KEY);
  return msisdn
    ? { since, msisdn, optimisticDataMb: optimistic }
    : { since, optimisticDataMb: optimistic };
}

export function clearBalancePoll() {
  if (typeof window === 'undefined') return;
  removeStored(AWAIT_SINCE_KEY);
  removeStored(AWAIT_MSISDN_KEY);
  removeStored(OPTIMISTIC_DATA_MB_KEY);
}

export function initBalancePollFromUrl() {
  if (typeof window === 'undefined') return;

  const params = new URLSearchParams(window.location.search);
  const purchased = Number(params.get('purchased_mb') ?? '0');
  const hasPurchaseHint =
    params.get('await_balance') === '1' || (Number.isFinite(purchased) && purchased > 0);
  if (!hasPurchaseHint) return;

  const existing = getBalancePollContext();
  const purchasedMb = Number.isFinite(purchased) ? purchased : 0;

  if (!existing) {
    startBalancePoll({
      msisdn: params.get('msisdn') || undefined,
      purchasedDataMb: purchasedMb,
    });
    return;
  }

  if (purchasedMb > 0 && existing.optimisticDataMb < purchasedMb) {
    writeStored(OPTIMISTIC_DATA_MB_KEY, String(purchasedMb));
  }

  const urlMsisdn = params.get('msisdn');
  if (urlMsisdn) {
    writeStored(AWAIT_MSISDN_KEY, urlMsisdn);
  }
}
