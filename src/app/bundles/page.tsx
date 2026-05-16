'use client';

import { ArrowRight, Loader2, Package, ShoppingCart, Smartphone, Wifi } from 'lucide-react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { BundlesApi } from '@/lib/api';

interface Bundle {
  id: string | number;
  sim_bundle_id?: number | null;
  name: string;
  data_mb?: number;
  validity_days?: number;
  price?: string | number;
  currency?: string;
  description?: string;
  tagline?: string;
}

type CheckoutMode = 'standard' | 'topup';

type ApiBundle = {
  id: number;
  sim_bundle_id?: number | null;
  name: string;
  alias?: string | null;
  validity_days?: number | null;
  price?: string | number | null;
  currency?: string | null;
  data_mb?: number | null;
  bundle_size?: string | number | null;
  bundle_size_in_mb?: number | null;
  unit?: string | null; // e.g. "GB" | "MB"
  active?: boolean;
};

type BundlesResponse = { bundles: ApiBundle[] };

function toMb(bundle: ApiBundle): number | undefined {
  if (typeof bundle.data_mb === 'number') return bundle.data_mb;
  if (typeof bundle.bundle_size_in_mb === 'number') return bundle.bundle_size_in_mb;

  const size = Number(bundle.bundle_size);
  if (!Number.isFinite(size)) return undefined;

  const unit = (bundle.unit ?? '').toUpperCase();
  if (unit === 'GB') return Math.round(size * 1024);
  if (unit === 'MB') return Math.round(size);
  return undefined;
}

const bundleImages: Record<number, string> = {
  1: '/backgrounds/3.jpg',
  2: '/backgrounds/1.jpg',
  3: '/backgrounds/5.jpg',
};

function formatMb(mb?: number) {
  if (!mb) return '—';
  return mb >= 1024 ? `${(mb / 1024).toFixed(0)} GB` : `${mb} MB`;
}

type SimType = 'esim' | 'physical';

function BundlesContent() {
  const params = useSearchParams();
  const router = useRouter();
  const country = params.get('country') ?? 'TZ';
  const countryName = params.get('countryName') ?? 'Tanzania';
  const topupParam = params.get('topup');

  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<Record<string | number, number>>({});
  const [simType, setSimType] = useState<SimType>('esim');

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const res = await BundlesApi.list<BundlesResponse>();
        const apiBundles = res.data?.bundles ?? [];

        const uiBundles: Bundle[] = apiBundles.map((b) => ({
            id: b.id,
            sim_bundle_id: b.sim_bundle_id ?? null,
            name: b.alias?.trim() || b.name,
            data_mb: toMb(b),
            validity_days: b.validity_days ?? undefined,
            price: b.price ?? undefined,
            currency: b.currency ?? undefined,
            tagline: b.name,
          }));

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
  }, [country]);

  const totalItems = Object.values(cart).reduce((a, b) => a + b, 0);
  const totalPrice = Object.entries(cart).reduce((sum, [id, qty]) => {
    const b = bundles.find((b) => String(b.id) === id);
    return sum + Number(b?.price ?? 0) * qty;
  }, 0);

  const handleCheckout = () => {
    const cartBundles = Object.entries(cart)
      .filter(([, qty]) => qty > 0)
      .map(([id, qty]) => ({
        bundle: bundles.find((b) => String(b.id) === id)!,
        quantity: qty,
      }));
    const isRegisteredCustomer = !!localStorage.getItem('token');
    const checkoutMode: CheckoutMode =
      topupParam === '1' || isRegisteredCustomer ? 'topup' : 'standard';

    localStorage.setItem(
      'cart',
      JSON.stringify({ items: cartBundles, country, countryName, simType, checkoutMode })
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
            className="object-cover"
          />
        </div>
        <div className="relative max-w-4xl mx-auto text-center">
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#17cf54' }}>
            Tanzania · Zanzibar
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-2">
            Choose Your Data Plan
          </h1>
          <p className="text-white/60 text-base">
            30 days of data per plan. For eSIM, we activate on your arrival date — you choose the dates at checkout.
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
                <p className="text-xs text-slate-500 mt-0.5">Digital · Activation on your arrival date</p>
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
            <p className="text-xs text-slate-500 mt-3 text-center">
              After purchase, your eSIM is scheduled to go live on the arrival date you enter at checkout (not automatically today).
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
        ) : bundles.length === 0 ? (
          <div className="text-center py-20">
            <Package size={40} className="mx-auto mb-4 text-slate-300" />
            <p className="text-slate-500 font-medium">No bundles available for this destination.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {bundles.map((bundle) => {
              const qty = cart[bundle.id] ?? 0;
              const imgSrc = bundleImages[Number(bundle.id)] ?? '/backgrounds/5.jpg';
              return (
                <div
                  key={bundle.id}
                  className={`rounded-2xl overflow-hidden border bg-white shadow-sm hover:shadow-md transition-all ${
                    qty > 0 ? 'border-[#112116] shadow-md' : 'border-slate-100'
                  }`}
                >
                  <div className="relative h-44">
                    <Image
                      src={imgSrc}
                      alt=""
                      fill
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
                      {Number(bundle.price ?? 0).toFixed(0)}
                    </p>

                    {/* Quantity control */}
                    {qty === 0 ? (
                      <button
                        onClick={() => setCart((c) => ({ ...c, [bundle.id]: 1 }))}
                        className="w-full py-3 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90"
                        style={{ backgroundColor: '#112116' }}
                      >
                        Add to Cart
                      </button>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() =>
                              setCart((c) => ({ ...c, [bundle.id]: Math.max(0, (c[bundle.id] ?? 0) - 1) }))
                            }
                            className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-50 font-bold"
                          >
                            −
                          </button>
                          <span className="text-sm font-bold text-slate-800 w-5 text-center">{qty}</span>
                          <button
                            onClick={() =>
                              setCart((c) => ({ ...c, [bundle.id]: (c[bundle.id] ?? 0) + 1 }))
                            }
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold hover:opacity-90"
                            style={{ backgroundColor: '#112116' }}
                          >
                            +
                          </button>
                        </div>
                        <span className="text-xs font-bold text-slate-500">
                          {bundle.currency ?? 'USD'}{' '}
                          {(Number(bundle.price ?? 0) * qty).toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Bottom padding for sticky bar */}
        <div className="h-24" />
      </div>

      {/* Sticky checkout bar */}
      {totalItems > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 px-4 w-full max-w-sm">
          <button
            onClick={handleCheckout}
            className="w-full flex items-center justify-between px-5 py-4 rounded-2xl shadow-xl text-sm font-bold text-white transition-opacity hover:opacity-95"
            style={{ backgroundColor: '#112116' }}
          >
            <div className="flex items-center gap-2">
              <ShoppingCart size={18} />
              <span>{totalItems} item{totalItems > 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-center gap-2">
              <span>USD {totalPrice.toFixed(2)}</span>
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
