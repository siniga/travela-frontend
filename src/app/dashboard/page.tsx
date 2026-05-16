'use client';

import { EsimsApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import {
  ArrowRight,
  CheckCircle,
  Clock,
  Globe,
  Info,
  Loader2,
  RefreshCw,
  Smartphone,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

interface PurchaseData {
  items?: {
    bundle: {
      name: string;
      data_mb?: number;
      validity_days?: number;
      price?: string | number;
      currency?: string;
    };
    quantity: number;
  }[];
  trip?: {
    countryName?: string;
    duration?: number;
    arrivalDate?: string;
    departureDate?: string;
  };
  total?: number;
  currency?: string;
  orderId?: string;
  date?: string;
}

interface EsimDetail {
  id: number;
  sim_id?: number | null;
  msisdn?: string | null;
  iccid?: string | null;
  description?: string | null;
  status?: string | null;
}

interface UserEsimRecord {
  id: number;
  esim_id: number;
  balance?: string | null;
  balance_currency?: string | null;
  balance_fetched_at?: string | null;
  created_at?: string | null;
  esim?: EsimDetail | null;
}

function formatMb(mb?: number) {
  if (!mb) return '0 MB';
  return mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${mb} MB`;
}

function formatBalance(amount?: string | null, currency?: string | null) {
  if (amount == null || amount === '') return '—';
  const num = Number(amount);
  const formatted = Number.isFinite(num)
    ? num.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })
    : amount;
  return currency ? `${formatted} ${currency}` : formatted;
}

function formatTripDate(iso?: string | null) {
  if (!iso) return null;
  const datePart = iso.includes('T') ? iso.split('T')[0] : iso;
  return new Date(datePart + 'T12:00:00').toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function parseEsimsFromBody(body: unknown): UserEsimRecord[] {
  if (!body || typeof body !== 'object') return [];
  const b = body as { data?: unknown; success?: boolean };
  if (!Array.isArray(b.data)) return [];
  return b.data as UserEsimRecord[];
}

function esimStatusLabel(status?: string | null) {
  if (!status) return 'ACTIVE';
  const s = status.toUpperCase();
  if (s === 'MANAGED' || s === 'ACTIVE') return 'ACTIVE';
  return status.replace(/_/g, ' ');
}

export default function DashboardPage() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const [purchase, setPurchase] = useState<PurchaseData | null>(null);
  const [userEsims, setUserEsims] = useState<UserEsimRecord[]>([]);
  const [esimsLoading, setEsimsLoading] = useState(false);
  const [esimsError, setEsimsError] = useState('');
  const [pendingExternalPayment, setPendingExternalPayment] = useState(false);
  const [pendingInfo, setPendingInfo] = useState<{ order_id?: string | number; draft_id?: string; checkout_url?: string } | null>(null);

  const loadEsims = useCallback(async () => {
    setEsimsLoading(true);
    setEsimsError('');
    try {
      const res = await EsimsApi.listMine();
      if (!res.ok) {
        const msg =
          res.body &&
          typeof res.body === 'object' &&
          typeof (res.body as { message?: unknown }).message === 'string'
            ? String((res.body as { message: string }).message)
            : `Could not load eSIMs (HTTP ${res.status}).`;
        setEsimsError(msg);
        setUserEsims([]);
        return;
      }
      setUserEsims(parseEsimsFromBody(res.body));
    } catch (e: unknown) {
      const fallback =
        e instanceof Error ? e.message : typeof e === 'string' ? e : String(e);
      setEsimsError(fallback || 'Failed to load eSIM details.');
      setUserEsims([]);
    } finally {
      setEsimsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/auth/login?redirect=/dashboard');
      return;
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const raw = localStorage.getItem('lastPurchase');
    if (raw) {
      try {
        setPurchase(JSON.parse(raw));
      } catch {
        setPurchase(null);
      }
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const pending = localStorage.getItem('pendingExternalPayment');
    if (pending) {
      setPendingExternalPayment(true);
      try {
        const parsed = JSON.parse(pending) as { order_id?: string | number; draft_id?: string; checkout_url?: string };
        setPendingInfo(parsed);
      } catch {
        setPendingInfo(null);
      }
    } else {
      setPendingExternalPayment(false);
      setPendingInfo(null);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    loadEsims();
  }, [isAuthenticated, loadEsims]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f6f8f6' }}>
        <Loader2 size={28} className="animate-spin text-slate-400" />
      </div>
    );
  }

  const primaryUserEsim = userEsims[0] ?? null;
  const primaryBundle = purchase?.items?.[0]?.bundle;
  const totalEsims = userEsims.length > 0
    ? userEsims.length
    : (purchase?.items?.reduce((s, c) => s + c.quantity, 0) ?? 0);

  const headlineData = primaryBundle?.data_mb
    ? formatMb(primaryBundle.data_mb)
    : formatBalance(primaryUserEsim?.balance, primaryUserEsim?.balance_currency);

  const esimTitle =
    primaryBundle?.name ??
    primaryUserEsim?.esim?.description?.trim() ??
    (primaryUserEsim?.esim?.msisdn ? `+${primaryUserEsim.esim.msisdn}` : 'eSIM');

  const activationIso =
    purchase?.trip?.arrivalDate ?? primaryUserEsim?.created_at ?? null;

  const hasActiveEsim = userEsims.length > 0;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f6f8f6' }}>
      {/* Header bar */}
      <div className="bg-white border-b border-slate-100 px-4 py-5">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-0.5">
            Dashboard
          </p>
          <h1 className="text-xl font-extrabold text-slate-900">
            {isAuthenticated
              ? `Welcome back, ${user?.name?.split(' ')[0] ?? 'Traveller'}`
              : 'Your eSIM Dashboard'}
          </h1>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {pendingExternalPayment && (
          <div
            className="rounded-2xl border border-slate-200 bg-white p-6"
            style={{ borderColor: 'rgba(17,33,22,0.12)' }}
          >
            <div className="flex items-start gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: 'rgba(23,207,84,0.14)' }}
              >
                <Clock size={18} style={{ color: '#112116' }} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-extrabold text-slate-900">Payment pending</p>
                <p className="text-sm text-slate-600 mt-1">
                  Finish the checkout in the payment tab. Once payment is completed, your order status will update.
                </p>
                {pendingInfo?.draft_id && (
                  <p className="text-xs text-slate-500 mt-2">
                    Draft ID: <span className="font-semibold text-slate-700">{pendingInfo.draft_id}</span>
                  </p>
                )}
                {pendingInfo?.order_id && (
                  <button
                    type="button"
                    className="mt-3 inline-flex items-center gap-2 text-xs font-bold hover:underline"
                    style={{ color: '#112116' }}
                    onClick={() =>
                      window.open(
                        `/test-checkout?order_id=${encodeURIComponent(String(pendingInfo.order_id))}`,
                        '_blank',
                        'noopener,noreferrer'
                      )
                    }
                  >
                    Open checkout again <ArrowRight size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {esimsError && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {esimsError}
          </div>
        )}

        {esimsLoading ? (
          <div className="rounded-2xl p-12 flex items-center justify-center bg-white border border-slate-100">
            <Loader2 size={28} className="animate-spin text-slate-400" />
          </div>
        ) : hasActiveEsim ? (
          <>
            {/* Active eSIM card */}
            <div
              className="rounded-2xl p-6 text-white"
              style={{ backgroundColor: '#112116' }}
            >
              <div className="flex items-start justify-between mb-5">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-white/50 mb-1">
                    Active eSIM
                  </p>
                  <h2 className="text-4xl font-black tracking-tight">{headlineData}</h2>
                  <p className="text-base font-black text-white mt-1">{esimTitle}</p>
                  {formatTripDate(activationIso) && (
                    <p className="text-xs font-semibold text-white/60 uppercase tracking-wide mt-2">
                      Scheduled activation
                    </p>
                  )}
                  {formatTripDate(activationIso) && (
                    <p className="text-sm font-bold" style={{ color: '#17cf54' }}>
                      {formatTripDate(activationIso)}
                    </p>
                  )}
                  {purchase?.trip?.countryName && (
                    <p className="text-sm font-semibold mt-1 text-white/80">{purchase.trip.countryName}</p>
                  )}
                  {primaryUserEsim?.esim?.msisdn && !primaryBundle?.name && (
                    <p className="text-sm font-semibold mt-1 text-white/60">
                      +{primaryUserEsim.esim.msisdn}
                    </p>
                  )}
                </div>
                <span
                  className="text-xs font-extrabold px-3 py-1.5 rounded-full"
                  style={{ backgroundColor: '#17cf54', color: '#112116' }}
                >
                  {esimStatusLabel(primaryUserEsim?.esim?.status)}
                </span>
              </div>

              <div
                className="h-2.5 rounded-full overflow-hidden mb-1"
                style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
              >
                <div
                  className="h-full rounded-full w-full"
                  style={{ backgroundColor: '#17cf54' }}
                />
              </div>

              {totalEsims > 1 && (
                <div
                  className="mt-4 flex items-center gap-2 text-sm"
                  style={{ color: 'rgba(255,255,255,0.6)' }}
                >
                  <Globe size={14} />
                  <span>
                    You have {totalEsims} eSIMs on your account
                  </span>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[
                {
                  icon: <Smartphone size={16} style={{ color: '#17cf54' }} />,
                  label: 'eSIMs',
                  value: String(totalEsims),
                  sub: 'On your account',
                },
                {
                  icon: <Globe size={16} style={{ color: '#17cf54' }} />,
                  label: 'Balance',
                  value: formatBalance(
                    primaryUserEsim?.balance,
                    primaryUserEsim?.balance_currency
                  ),
                  sub: primaryUserEsim?.balance_fetched_at
                    ? `Updated ${formatTripDate(primaryUserEsim.balance_fetched_at) ?? '—'}`
                    : (purchase?.trip?.countryName ?? 'Wallet balance'),
                },
                {
                  icon: <Clock size={16} style={{ color: '#17cf54' }} />,
                  label: 'Date',
                  value: formatTripDate(
                    primaryUserEsim?.created_at ?? purchase?.date ?? null
                  ) ?? '—',
                  sub: primaryUserEsim?.created_at ? 'Assigned' : 'Order date',
                },
              ].map((s) => (
                <div
                  key={s.label}
                  className="bg-white rounded-xl border border-slate-100 p-4"
                >
                  <div className="flex items-center gap-2 mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                    {s.icon} {s.label}
                  </div>
                  <p className="text-xl font-extrabold text-slate-900">{s.value}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{s.sub}</p>
                </div>
              ))}
            </div>

            {/* Activation instructions */}
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Info size={18} style={{ color: '#17cf54' }} />
                <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-600">
                  How to Activate
                </h3>
              </div>
              {[
                { num: '1', text: 'Open the email from Travela with your ', bold: 'eSIM QR Code' },
                {
                  num: '2',
                  text: 'Go to Settings › Cellular › ',
                  bold: 'Add eSIM',
                  after: ' and scan the QR code',
                },
                { num: '3', text: 'Turn on ', bold: 'Data Roaming', after: ' for the new eSIM' },
              ].map((step) => (
                <div key={step.num} className="flex gap-3 mb-3">
                  <div
                    className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold"
                    style={{ backgroundColor: 'rgba(23,207,84,0.15)', color: '#112116' }}
                  >
                    {step.num}
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {step.text}
                    <strong className="text-slate-900">{step.bold}</strong>
                    {step.after ?? ''}
                  </p>
                </div>
              ))}
            </div>
          </>
        ) : (
          /* Empty state */
          <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center">
            <div
              className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4 border border-slate-100"
              style={{ backgroundColor: '#f6f8f6' }}
            >
              <Smartphone size={30} className="text-slate-300" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 mb-2">No Active eSIM</h2>
            <p className="text-sm text-slate-500 max-w-xs mx-auto leading-relaxed">
              Purchase an eSIM bundle to stay connected during your travels.
            </p>
          </div>
        )}

        {/* Quick actions */}
        <Link
          href="/bundles?country=TZ&countryName=Tanzania&topup=1"
          className="flex items-center justify-center gap-2 py-4 rounded-xl text-sm font-bold border-2 transition-colors hover:bg-slate-50"
          style={{
            backgroundColor: 'rgba(23,207,84,0.08)',
            borderColor: 'rgba(23,207,84,0.3)',
            color: '#112116',
          }}
        >
          <RefreshCw size={16} /> Top Up
        </Link>

        {/* Travela branding footer */}
        <div
          className="rounded-2xl p-6 text-center"
          style={{ backgroundColor: '#112116' }}
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <CheckCircle size={16} style={{ color: '#17cf54' }} />
            <span className="text-xs font-bold text-white/70">
              Travela · by Onnela · For A More Enjoyable Life
            </span>
          </div>
          <p className="text-xs text-white/30">Available in 50+ African countries</p>
        </div>
      </div>
    </div>
  );
}
