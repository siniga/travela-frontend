'use client';

import { EsimsApi, parseEsimActivation } from '@/lib/api';
import {
  buildEsimActivationHref,
  clearPendingEsimInstall,
  hasPendingEsimInstall,
  writePendingEsimInstall,
} from '@/lib/esim-activation';
import { CheckCircle, Loader2, RefreshCw, Smartphone, X } from 'lucide-react';
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
  const [confirming, setConfirming] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
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
    if (initialDeviceActivatedAt) {
      clearPendingEsimInstall(userEsimId);
      setConfirmOpen(false);
    }
  }, [initialDeviceActivatedAt, userEsimId]);

  const openConfirmIfPending = useCallback(() => {
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
      return;
    }
    if (deviceActivatedAt || initialDeviceActivatedAt) {
      clearPendingEsimInstall(userEsimId);
      setConfirmOpen(false);
      setActivating(false);
      return;
    }
    if (hasPendingEsimInstall(userEsimId)) {
      setActivating(false);
      setConfirmOpen(true);
    }
  }, [deviceActivatedAt, initialDeviceActivatedAt, userEsimId]);

  useEffect(() => {
    openConfirmIfPending();

    const onVisibility = () => {
      if (document.visibilityState === 'visible') openConfirmIfPending();
    };
    const onReturn = () => openConfirmIfPending();

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', onReturn);
    window.addEventListener('pageshow', onReturn);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', onReturn);
      window.removeEventListener('pageshow', onReturn);
    };
  }, [openConfirmIfPending]);

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

  const launchInstall = useCallback(
    (payload: string) => {
      writePendingEsimInstall(userEsimId);
      window.location.href = buildEsimActivationHref(payload);
    },
    [userEsimId]
  );

  const handleActivate = () => {
    if (!qrCodeData || activating || confirming) return;
    setError('');
    setActivating(true);
    try {
      launchInstall(qrCodeData);
    } catch (err: unknown) {
      clearPendingEsimInstall(userEsimId);
      setError(err instanceof Error ? err.message : 'Failed to start activation.');
      setActivating(false);
    }
  };

  const handleConfirmYes = async () => {
    if (confirming) return;
    setConfirming(true);
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

      clearPendingEsimInstall(userEsimId);
      setConfirmOpen(false);
      setDeviceActivatedAt(activatedAt);
      onActivated?.(activatedAt);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to confirm activation.');
    } finally {
      setConfirming(false);
    }
  };

  const handleConfirmNo = () => {
    clearPendingEsimInstall(userEsimId);
    setConfirmOpen(false);
    setError('');
  };

  const handleConfirmRetry = () => {
    if (!qrCodeData || confirming) return;
    setError('');
    launchInstall(qrCodeData);
  };

  const isDark = variant === 'dark';
  const formattedMsisdn = formatMsisdn(msisdn);

  const confirmModal = confirmOpen ? (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50"
      role="presentation"
    >
      <div
        className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="esim-install-confirm-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-start justify-between gap-3 px-5 py-4"
          style={{ backgroundColor: '#112116' }}
        >
          <div>
            <h2
              id="esim-install-confirm-title"
              className="text-base font-extrabold text-white"
            >
              Did the eSIM install finish?
            </h2>
            <p className="text-xs text-white/65 mt-1 leading-relaxed">
              Confirm only if your phone finished adding the eSIM profile. If setup
              failed or you cancelled, choose No or Retry.
            </p>
          </div>
          <button
            type="button"
            onClick={handleConfirmNo}
            disabled={confirming}
            className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-3">
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={() => void handleConfirmYes()}
            disabled={confirming}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold transition-opacity hover:opacity-90 disabled:opacity-60"
            style={{ backgroundColor: '#17cf54', color: '#112116' }}
          >
            {confirming ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <CheckCircle size={16} />
                Yes, it installed
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleConfirmRetry}
            disabled={confirming || !qrCodeData}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold border border-slate-200 text-slate-800 hover:bg-slate-50 transition-colors disabled:opacity-60"
          >
            <RefreshCw size={16} />
            Retry
          </button>

          <button
            type="button"
            onClick={handleConfirmNo}
            disabled={confirming}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors disabled:opacity-60"
          >
            No, not yet
          </button>
        </div>
      </div>
    </div>
  ) : null;

  if (deviceActivatedAt) {
    return (
      <>
        {confirmModal}
        <div
          className={`rounded-xl border px-4 py-3.5 ${
            isDark
              ? 'border-emerald-400/30 bg-emerald-500/10'
              : 'border-emerald-200 bg-emerald-50'
          }`}
        >
          <div className="flex items-start gap-3">
            <CheckCircle
              size={20}
              className={
                isDark
                  ? 'text-emerald-300 mt-0.5 flex-shrink-0'
                  : 'text-emerald-600 mt-0.5 flex-shrink-0'
              }
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
                <p
                  className={`text-sm mt-1 ${
                    isDark ? 'text-white/75' : 'text-emerald-800'
                  }`}
                >
                  Your number{' '}
                  <span className="font-bold">{formattedMsisdn}</span> is ready to
                  use.
                </p>
              ) : (
                <p
                  className={`text-sm mt-1 ${
                    isDark ? 'text-white/70' : 'text-emerald-700'
                  }`}
                >
                  This eSIM has been installed on your device.
                </p>
              )}
            </div>
          </div>
        </div>
      </>
    );
  }

  if (loading) {
    return (
      <>
        {confirmModal}
        <div
          className={`flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold ${
            isDark ? 'bg-white/10 text-white/80' : 'bg-slate-100 text-slate-500'
          }`}
        >
          <Loader2 size={16} className="animate-spin" />
          Loading activation…
        </div>
      </>
    );
  }

  if (error && !confirmOpen) {
    return (
      <div className="space-y-3">
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
      <>
        {confirmModal}
        <div className="space-y-3">
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
      </>
    );
  }

  return (
    <>
      {confirmModal}
      <button
        type="button"
        onClick={handleActivate}
        disabled={activating || confirming}
        className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold transition-opacity hover:opacity-90 disabled:opacity-60 ${
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
    </>
  );
}
