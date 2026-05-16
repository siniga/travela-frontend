'use client';

import { OrderApi } from '@/lib/api';
import { CheckCircle, CreditCard, Loader2, Lock } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

type Step = 'form' | 'complete';

export default function TestCheckoutPage() {
  const params = useSearchParams();
  const router = useRouter();

  const orderId = params.get('order_id') ?? '';

  const [step, setStep] = useState<Step>('form');
  const [submitting, setSubmitting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    cardNumber: '',
    cardName: '',
    expiry: '',
    cvv: '',
  });

  const formattedOrderId = useMemo(() => orderId.trim(), [orderId]);

  useEffect(() => {
    // Autofill for testing
    setForm({
      cardNumber: '4242 4242 4242 4242',
      cardName: 'Test User',
      expiry: '12/34',
      cvv: '123',
    });
  }, []);

  const onSubmit = async () => {
    setError('');
    if (!formattedOrderId) {
      setError('Missing order_id in URL.');
      return;
    }
    setSubmitting(true);
    try {
      // Fake processing delay
      await new Promise((r) => setTimeout(r, 600));
      setStep('complete');
    } finally {
      setSubmitting(false);
    }
  };

  const onReturnToDashboard = async () => {
    setError('');
    if (!formattedOrderId) {
      setError('Missing order_id in URL.');
      return;
    }
    setConfirming(true);
    try {
      const res = await OrderApi.paymentPaidTest(formattedOrderId);
      if (!res.ok) {
        const body = res.body as any;
        const msg =
          typeof body?.message === 'string'
            ? body.message
            : typeof body?.error === 'string'
              ? body.error
              : `Payment confirmation failed (HTTP ${res.status}).`;
        setError(msg);
        return;
      }

      localStorage.removeItem('pendingExternalPayment');
      localStorage.removeItem('cart');

      router.replace('/dashboard');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to confirm payment.');
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10" style={{ backgroundColor: '#f6f8f6' }}>
      <div className="w-full max-w-md">
        {step === 'form' ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-start gap-3 mb-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: 'rgba(17,33,22,0.07)' }}
              >
                <CreditCard size={18} style={{ color: '#112116' }} />
              </div>
              <div>
                <p className="text-sm font-extrabold text-slate-900">Test Checkout</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  This is a fake checkout page for testing.
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 px-4 py-3 mb-5">
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Order ID</p>
              <p className="text-sm font-extrabold text-slate-900 mt-1">{formattedOrderId || '—'}</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 block">
                  Card Number
                </label>
                <input
                  value={form.cardNumber}
                  onChange={(e) => setForm((f) => ({ ...f, cardNumber: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:border-slate-400 font-mono"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 block">
                  Name on Card
                </label>
                <input
                  value={form.cardName}
                  onChange={(e) => setForm((f) => ({ ...f, cardName: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:border-slate-400"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 block">
                    Expiry
                  </label>
                  <input
                    value={form.expiry}
                    onChange={(e) => setForm((f) => ({ ...f, expiry: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:border-slate-400 font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 block">
                    CVV
                  </label>
                  <input
                    value={form.cvv}
                    onChange={(e) => setForm((f) => ({ ...f, cvv: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:border-slate-400 font-mono"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="mt-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3">
                <p className="text-sm font-medium text-red-700">{error}</p>
              </div>
            )}

            <button
              type="button"
              disabled={submitting}
              onClick={() => void onSubmit()}
              className="mt-6 w-full flex items-center justify-center gap-2 py-4 rounded-xl text-base font-bold text-white disabled:opacity-60 hover:opacity-90 transition-opacity"
              style={{ backgroundColor: '#112116' }}
            >
              {submitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Processing…
                </>
              ) : (
                <>
                  <Lock size={16} /> Submit payment
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm text-center">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: 'rgba(23,207,84,0.14)' }}
            >
              <CheckCircle size={30} style={{ color: '#17cf54' }} />
            </div>
            <p className="text-lg font-extrabold text-slate-900">Payment complete</p>
            <p className="text-sm text-slate-600 mt-2">
              Click below to confirm payment with the backend and return to your dashboard.
            </p>

            {error && (
              <div className="mt-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-left">
                <p className="text-sm font-medium text-red-700">{error}</p>
              </div>
            )}

            <button
              type="button"
              disabled={confirming}
              onClick={() => void onReturnToDashboard()}
              className="mt-6 w-full flex items-center justify-center gap-2 py-4 rounded-xl text-base font-bold text-white disabled:opacity-60 hover:opacity-90 transition-opacity"
              style={{ backgroundColor: '#112116' }}
            >
              {confirming ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Confirming…
                </>
              ) : (
                <>Return to dashboard</>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

