'use client';

import { ArrowRight, Check, Loader2, Package, Smartphone, Wifi } from 'lucide-react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { BundlesApi, EsimsApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { filterBundlesForRole, filterUiBundlesForRole } from '@/lib/bundle-visibility';
import { getOptimisticDataMb } from '@/lib/balance-poll';
import {
  type Bundle,
  type BundlesResponse,
  bundleImageFor,
  formatMb,
  mapApiBundles,
} from '@/lib/bundles';
import { dataMbFromAssignment } from '@/lib/esim-balance';

type CheckoutMode = 'standard' | 'topup';

type SimType = 'esim' | 'physical';

function BundlesContent() {
  const params = useSearchParams();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const country = params.get('country') ?? 'TZ';
  const countryName = params.get('countryName') ?? 'Tanzania';
  const topupParam = params.get('topup');

  const bundleIdParam = params.get('bundleId');

  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBundleId, setSelectedBundleId] = useState<string | number | null>(null);
  const [simType, setSimType] = useState<SimType>('esim');
  const [browseAllPlans, setBrowseAllPlans] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const res = await BundlesApi.list<BundlesResponse>();
        const role = typeof user?.role === 'string' ? user.role : null;
        const apiBundles = filterBundlesForRole(res.data?.bundles ?? [], role);
        const uiBundles = filterUiBundlesForRole(mapApiBundles(apiBundles), role);

        if (!cancelled) setBundles(uiBundles);
      } catch {
        if (!cancelled) setBundles([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [country, authLoading, user?.role]);

  // Coming from a specific "Buy Now" click (e.g. landing page plan card) — skip re-choosing the bundle.
  useEffect(() => {
    if (!bundleIdParam || bundles.length === 0) return;
    const match = bundles.find((b) => String(b.id) === String(bundleIdParam));
    if (match) setSelectedBundleId(match.id);
  }, [bundleIdParam, bundles]);

  const selectedBundle = bundles.find((b) => String(b.id) === String(selectedBundleId)) ?? null;
  const preselectedBundle =
    bundleIdParam && !browseAllPlans
      ? bundles.find((b) => String(b.id) === String(bundleIdParam)) ?? null
      : null;

  const handleCheckout = async () => {
    if (!selectedBundle) return;
    const isRegisteredCustomer = !!localStorage.getItem('token');
    const checkoutMode: CheckoutMode =
      topupParam === '1' || isRegisteredCustomer ? 'topup' : 'standard';

    let user_esim_id: number | undefined;
    let msisdn: string | undefined;
    let current_data_mb: number | undefined;

    if (checkoutMode === 'topup') {
      try {
        const res = await EsimsApi.listMine();
        if (!res.ok) {
          window.alert('Could not load your SIM. Try again from the dashboard.');
          return;
        }
        const body = res.body as { data?: unknown[]; esims?: unknown[] } | unknown[];
        const rows = Array.isArray(body)
          ? body
          : Array.isArray(body?.data)
            ? body.data
            : Array.isArray(body?.esims)
              ? body.esims
              : [];
        const first = rows[0] as {
          id?: number;
          balances?: Record<string, unknown> | null;
          bundle?: { data_mb?: number | null };
          order_item?: { data_amount?: number | null };
          esim?: { msisdn?: string | null; phone_number?: string | null };
        } | undefined;
        user_esim_id = first?.id;
        msisdn =
          first?.esim?.msisdn?.trim() ||
          first?.esim?.phone_number?.trim() ||
          undefined;
        if (!user_esim_id || !msisdn) {
          window.alert('No SIM found on your account. Complete your first purchase first.');
          return;
        }
        current_data_mb =
          getOptimisticDataMb() ?? dataMbFromAssignment(first) ?? 0;
      } catch {
        window.alert('Could not load your SIM. Try again from the dashboard.');
        return;
      }
    }

    localStorage.setItem(
      'cart',
      JSON.stringify({
        bundle: selectedBundle,
        country,
        countryName,
        simType,
        checkoutMode,
      })
    );
    router.push('/checkout');
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f6f8f6' }}>
      {/* Header */}
      <div
        className="relative py-16 px-4 overflow-hidden"
        style={{ backgroundColor: '#112116' }}
      >
        <div className="absolute inset-0 opacity-20">
          <Image
            src="/backgrounds/1.jpg"
            alt=""
            fill
            sizes="100vw"
            className="object-cover"
          />
        </div>
        <div className="relative max-w-4xl mx-auto text-center">
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#17cf54' }}>
            Tanzania · Zanzibar
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-2">
            {preselectedBundle ? 'How Would You Like to Connect?' : 'Choose Your Data Plan'}
          </h1>
          <p className="text-white/60 text-base">
            {preselectedBundle
              ? 'For eSIM, you choose your activation date at checkout.'
              : '30 days of data per plan. For eSIM, you choose your activation date at checkout.'}
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* SIM Type Selector */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-8">
          <p className="text-sm font-bold text-slate-700 mb-4">How would you like to connect?</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setSimType('esim')}
              className="flex flex-col items-center gap-3 p-5 rounded-xl border-2 transition-all text-center"
              style={
                simType === 'esim'
                  ? { borderColor: '#112116', backgroundColor: 'rgba(17,33,22,0.05)' }
                  : { borderColor: '#e2e8f0', backgroundColor: 'white' }
              }
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{
                  backgroundColor: simType === 'esim' ? '#112116' : '#f1f5f9',
                  color: simType === 'esim' ? 'white' : '#64748b',
                }}
              >
                <Wifi size={22} />
              </div>
              <div>
                <p className="text-sm font-extrabold text-slate-900">eSIM</p>
                <p className="text-xs text-slate-500 mt-0.5">Digital · You choose the activation date</p>
              </div>
              {simType === 'esim' && (
                <span
                  className="text-xs font-bold px-2.5 py-0.5 rounded-full"
                  style={{ backgroundColor: '#17cf54', color: '#112116' }}
                >
                  Selected
                </span>
              )}
            </button>

            <button
              onClick={() => setSimType('physical')}
              className="flex flex-col items-center gap-3 p-5 rounded-xl border-2 transition-all text-center"
              style={
                simType === 'physical'
                  ? { borderColor: '#112116', backgroundColor: 'rgba(17,33,22,0.05)' }
                  : { borderColor: '#e2e8f0', backgroundColor: 'white' }
              }
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{
                  backgroundColor: simType === 'physical' ? '#112116' : '#f1f5f9',
                  color: simType === 'physical' ? 'white' : '#64748b',
                }}
              >
                <Smartphone size={22} />
              </div>
              <div>
                <p className="text-sm font-extrabold text-slate-900">Physical SIM</p>
                <p className="text-xs text-slate-500 mt-0.5">Plastic card · Delivered / collected</p>
              </div>
              {simType === 'physical' && (
                <span
                  className="text-xs font-bold px-2.5 py-0.5 rounded-full"
                  style={{ backgroundColor: '#17cf54', color: '#112116' }}
                >
                  Selected
                </span>
              )}
            </button>
          </div>
          {simType === 'esim' && (
            <p className="text-xs text-slate-500 mt-3 text-center leading-relaxed">
              To ensure the smoothest possible setup, make sure you have access to your email and complete the
              purchase process on the device where you want to install the new eSIM. You can also place an order
              on your computer and install your eSIM by scanning the QR code included in the order confirmation
              with your phone. When making your purchase, you can select the date on which you want your eSIM to
              be activated.
            </p>
          )}
          {simType === 'physical' && (
            <p className="text-xs text-slate-500 mt-3 text-center">
              Your physical SIM card will be ready for collection or delivered to your address in Tanzania.
            </p>
          )}
        </div>

        {/* Bundles */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={28} className="animate-spin text-slate-400" />
          </div>
        ) : preselectedBundle ? (
          <div className="max-w-sm mx-auto">
            <div className="rounded-2xl overflow-hidden border-2 bg-white shadow-md" style={{ borderColor: '#112116' }}>
              <div className="relative h-40">
                <Image
                  src={bundleImageFor(preselectedBundle.id)}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 100vw, 33vw"
                  className="object-cover"
                />
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between mb-0.5">
                  <p className="text-lg font-black text-slate-900">{preselectedBundle.name}</p>
                  <span
                    className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: '#17cf54', color: '#112116' }}
                  >
                    <Check size={12} /> Selected
                  </span>
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-1 tracking-tight">
                  {formatMb(preselectedBundle.data_mb)}
                </h3>
                {preselectedBundle.tagline && (
                  <p className="text-xs font-semibold text-slate-600 mb-1">{preselectedBundle.tagline}</p>
                )}
                <p className="text-sm text-slate-500">
                  {preselectedBundle.validity_days ?? 30} days · {preselectedBundle.currency ?? 'USD'}{' '}
                  {Number(preselectedBundle.price ?? 0).toFixed(2)}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setBrowseAllPlans(true)}
              className="block w-full text-center mt-3 text-xs font-bold text-slate-500 hover:text-slate-800"
            >
              Choose a different plan
            </button>
          </div>
        ) : bundles.length === 0 ? (
          <div className="text-center py-20">
            <Package size={40} className="mx-auto mb-4 text-slate-300" />
            <p className="text-slate-500 font-medium">No bundles available for this destination.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {bundles.map((bundle) => {
              const isSelected = String(selectedBundleId) === String(bundle.id);
              const imgSrc = bundleImageFor(bundle.id);
              return (
                <button
                  key={bundle.id}
                  type="button"
                  onClick={() => setSelectedBundleId(bundle.id)}
                  className={`text-left rounded-2xl overflow-hidden border bg-white shadow-sm hover:shadow-md transition-all ${
                    isSelected ? 'border-[#112116] shadow-md ring-2 ring-[#112116]' : 'border-slate-100'
                  }`}
                >
                  <div className="relative h-44">
                    <Image
                      src={imgSrc}
                      alt=""
                      fill
                      sizes="(max-width: 640px) 100vw, 33vw"
                      className="object-cover"
                    />
                  </div>

                  <div className="p-5">
                    <p className="text-lg font-black text-slate-900 mb-0.5">{bundle.name}</p>
                    <h3 className="text-2xl font-black text-slate-900 mb-1 tracking-tight">
                      {formatMb(bundle.data_mb)}
                    </h3>
                    {bundle.tagline && (
                      <p className="text-xs font-semibold text-slate-600 mb-1">{bundle.tagline}</p>
                    )}
                    <p className="text-sm text-slate-500 mb-4">
                      {bundle.validity_days ?? 30} days · {bundle.currency ?? 'USD'}{' '}
                      {Number(bundle.price ?? 0).toFixed(2)}
                    </p>

                    <div
                      className="w-full py-3 rounded-xl text-sm font-bold text-center transition-opacity flex items-center justify-center gap-2"
                      style={
                        isSelected
                          ? { backgroundColor: '#17cf54', color: '#112116' }
                          : { backgroundColor: '#112116', color: 'white' }
                      }
                    >
                      {isSelected ? (
                        <>
                          <Check size={16} /> Selected
                        </>
                      ) : (
                        'Select Plan'
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Bottom padding for sticky bar */}
        <div className="h-24" />
      </div>

      {/* Sticky checkout bar */}
      {selectedBundle && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 px-4 w-full max-w-sm">
          <button
            onClick={handleCheckout}
            className="w-full flex items-center justify-between px-5 py-4 rounded-2xl shadow-xl text-sm font-bold text-white transition-opacity hover:opacity-95"
            style={{ backgroundColor: '#112116' }}
          >
            <div className="flex items-center gap-2">
              <Wifi size={18} />
              <span>{selectedBundle.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span>
                {selectedBundle.currency ?? 'USD'} {Number(selectedBundle.price ?? 0).toFixed(2)}
              </span>
              <span>·</span>
              <span>Continue</span>
              <ArrowRight size={16} />
            </div>
          </button>
        </div>
      )}
    </div>
  );
}

export default function BundlesPage() {
  return (
    <Suspense>
      <BundlesContent />
    </Suspense>
  );
}
