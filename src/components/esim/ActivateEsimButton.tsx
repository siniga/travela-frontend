'use client';

import { EsimsApi, parseEsimActivation } from '@/lib/api';
import { buildEsimActivationHref } from '@/lib/esim-activation';
import { CheckCircle, Loader2, RefreshCw, Smartphone } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

type ActivateEsimButtonProps = {
  userEsimId: number;
  /** Prefer imported activation value from assignment payload when already known */
  qrCodeData?: string | null;
  /** ISO timestamp from API — eSIM profile installed on user's device */
  deviceActivatedAt?: string | null;
  /** Shown in the activated state */
  msisdn?: string | null;
  /** Use on dark SIM card background */
  variant?: 'dark' | 'light';
  /** Called after the server records device activation */
  onActivated?: (deviceActivatedAt: string) => void;
};

function formatMsisdn(msisdn?: string | null) {
  if (!msisdn) return null;
  const trimmed = msisdn.trim();
  if (!trimmed) return null;
  return trimmed.startsWith('+') ? trimmed : `+${trimmed}`;
}

export default function ActivateEsimButton({
  userEsimId,
  qrCodeData: initialQrCodeData = null,
  deviceActivatedAt: initialDeviceActivatedAt = null,
  msisdn = null,
  variant = 'dark',
  onActivated,
}: ActivateEsimButtonProps) {
  const trimmedInitial =
    typeof initialQrCodeData === 'string' ? initialQrCodeData.trim() : '';
  const [loading, setLoading] = useState(() => !trimmedInitial);
  const [activating, setActivating] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<string | null>(
    trimmedInitial || null
  );
  const [deviceActivatedAt, setDeviceActivatedAt] = useState<string | null>(
    initialDeviceActivatedAt ?? null
  );
  const [error, setError] = useState('');
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    setDeviceActivatedAt(initialDeviceActivatedAt ?? null);
  }, [initialDeviceActivatedAt]);

  const fetchActivation = useCallback(async () => {
    setLoading(true);
    setError('');
    setUnavailable(false);
    setQrCodeData(null);

    try {
      const res = await EsimsApi.getActivation(userEsimId);
      const activation = parseEsimActivation(res.body);

      if (!res.ok || !activation) {
        if (res.status === 404) {
          setUnavailable(true);
          return;
        }

        const message =
          res.body &&
          typeof res.body === 'object' &&
          typeof (res.body as { message?: unknown }).message === 'string'
            ? String((res.body as { message: string }).message)
            : `Could not load activation data (HTTP ${res.status}).`;
        setError(message);
        return;
      }

      setQrCodeData(activation.qr_code_data);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to load activation data.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [userEsimId]);

  useEffect(() => {
    if (trimmedInitial) {
      setQrCodeData(trimmedInitial);
      setLoading(false);
      setUnavailable(false);
      setError('');
      return;
    }
    void fetchActivation();
  }, [fetchActivation, trimmedInitial]);

  const handleActivate = async () => {
    if (!qrCodeData || activating) return;

    setActivating(true);
    setError('');

    try {
      const res = await EsimsApi.markDeviceActivated(userEsimId);
      if (!res.ok) {
        const message =
          res.body &&
          typeof res.body === 'object' &&
          typeof (res.body as { message?: unknown }).message === 'string'
            ? String((res.body as { message: string }).message)
            : `Could not record activation (HTTP ${res.status}).`;
        setError(message);
        return;
      }

      const body = res.body as Record<string, unknown> | null;
      const data =
        body?.data && typeof body.data === 'object' && !Array.isArray(body.data)
          ? (body.data as Record<string, unknown>)
          : null;
      const activatedAt =
        typeof data?.device_activated_at === 'string'
          ? data.device_activated_at
          : new Date().toISOString();

      setDeviceActivatedAt(activatedAt);
      onActivated?.(activatedAt);
      window.location.href = buildEsimActivationHref(qrCodeData);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to start activation.';
      setError(message);
    } finally {
      setActivating(false);
    }
  };

  const isDark = variant === 'dark';
  const formattedMsisdn = formatMsisdn(msisdn);

  if (deviceActivatedAt) {
    return (
      <div
        className={`mt-5 rounded-xl border px-4 py-3.5 ${
          isDark
            ? 'border-emerald-400/30 bg-emerald-500/10'
            : 'border-emerald-200 bg-emerald-50'
        }`}
      >
        <div className="flex items-start gap-3">
          <CheckCircle
            size={20}
            className={isDark ? 'text-emerald-300 mt-0.5 flex-shrink-0' : 'text-emerald-600 mt-0.5 flex-shrink-0'}
          />
          <div>
            <p
              className={`text-sm font-extrabold ${
                isDark ? 'text-emerald-100' : 'text-emerald-900'
              }`}
            >
              eSIM active on your device
            </p>
            {formattedMsisdn ? (
              <p className={`text-sm mt-1 ${isDark ? 'text-white/75' : 'text-emerald-800'}`}>
                Your number <span className="font-bold">{formattedMsisdn}</span> is ready to use.
              </p>
            ) : (
              <p className={`text-sm mt-1 ${isDark ? 'text-white/70' : 'text-emerald-700'}`}>
                This eSIM has been installed on your device.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div
        className={`mt-5 flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold ${
          isDark ? 'bg-white/10 text-white/80' : 'bg-slate-100 text-slate-500'
        }`}
      >
        <Loader2 size={16} className="animate-spin" />
        Loading activation…
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-5 space-y-3">
        <p className={`text-sm ${isDark ? 'text-red-200' : 'text-red-600'}`}>{error}</p>
        <button
          type="button"
          onClick={() => void fetchActivation()}
          className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold border transition-colors ${
            isDark
              ? 'border-white/20 text-white hover:bg-white/10'
              : 'border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <RefreshCw size={15} />
          Retry
        </button>
      </div>
    );
  }

  if (unavailable || !qrCodeData) {
    return (
      <div className="mt-5 space-y-3">
        <p
          className={`text-sm text-center py-2 ${
            isDark ? 'text-white/60' : 'text-slate-500'
          }`}
        >
          Activation data is not available for this eSIM.
        </p>
        <button
          type="button"
          disabled
          className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold opacity-50 cursor-not-allowed ${
            isDark ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-500'
          }`}
        >
          <Smartphone size={16} />
          Activate eSIM
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => void handleActivate()}
      disabled={activating}
      className={`mt-5 w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold transition-opacity hover:opacity-90 disabled:opacity-60 ${
        isDark ? '' : 'shadow-sm'
      }`}
      style={{ backgroundColor: '#17cf54', color: '#112116' }}
    >
      {activating ? (
        <>
          <Loader2 size={16} className="animate-spin" />
          Starting activation…
        </>
      ) : (
        <>
          <Smartphone size={16} />
          Activate eSIM
        </>
      )}
    </button>
  );
}
