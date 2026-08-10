'use client';

import { EsimsApi, parseEsimActivation } from '@/lib/api';
import { Loader2, RefreshCw, Smartphone } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useCallback, useEffect, useState } from 'react';

type QrCodePanelProps = {
  userEsimId: number;
  /** Prefer imported activation value from assignment payload when already known */
  qrCodeData?: string | null;
  msisdn?: string | null;
  iccid?: string | null;
};

function formatMsisdn(msisdn?: string | null) {
  if (!msisdn) return null;
  const trimmed = msisdn.trim();
  if (!trimmed) return null;
  return trimmed.startsWith('+') ? trimmed : `+${trimmed}`;
}

export default function QrCodePanel({
  userEsimId,
  qrCodeData: initialQrCodeData = null,
  msisdn = null,
  iccid = null,
}: QrCodePanelProps) {
  const trimmedInitial =
    typeof initialQrCodeData === 'string' ? initialQrCodeData.trim() : '';
  const [loading, setLoading] = useState(() => !trimmedInitial);
  const [qrCodeData, setQrCodeData] = useState<string | null>(trimmedInitial || null);
  const [error, setError] = useState('');

  const fetchActivation = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const res = await EsimsApi.getActivation(userEsimId);
      const activation = parseEsimActivation(res.body);

      if (!res.ok || !activation) {
        const message =
          res.body &&
          typeof res.body === 'object' &&
          typeof (res.body as { message?: unknown }).message === 'string'
            ? String((res.body as { message: string }).message)
            : res.status === 404
              ? 'Activation data is not available for this eSIM.'
              : `Could not load activation data (HTTP ${res.status}).`;
        setError(message);
        return;
      }

      setQrCodeData(activation.qr_code_data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load activation data.');
    } finally {
      setLoading(false);
    }
  }, [userEsimId]);

  useEffect(() => {
    if (trimmedInitial) {
      setQrCodeData(trimmedInitial);
      setLoading(false);
      setError('');
      return;
    }
    void fetchActivation();
  }, [fetchActivation, trimmedInitial]);

  const formattedMsisdn = formatMsisdn(msisdn);

  return (
    <div
      className="mt-3 rounded-2xl border border-white/15 p-5"
      style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}
    >
      {loading ? (
        <div className="flex flex-col items-center justify-center py-8 gap-3 text-white/70">
          <Loader2 size={24} className="animate-spin" />
          <p className="text-sm font-medium">Loading QR code…</p>
        </div>
      ) : error ? (
        <div className="py-4 text-center space-y-3">
          <p className="text-sm text-red-200">{error}</p>
          <button
            type="button"
            onClick={() => void fetchActivation()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border border-white/25 text-white hover:bg-white/10"
          >
            <RefreshCw size={15} />
            Retry
          </button>
        </div>
      ) : qrCodeData ? (
        <div className="space-y-5">
          <div className="flex justify-center">
            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <QRCodeSVG value={qrCodeData} size={200} level="M" includeMargin />
            </div>
          </div>

          {(formattedMsisdn || iccid) && (
            <div className="rounded-xl px-4 py-3 space-y-1.5 text-sm text-white/75 text-center" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
              {formattedMsisdn && (
                <p>
                  <span className="font-semibold text-white">Number:</span> {formattedMsisdn}
                </p>
              )}
              {iccid && (
                <p>
                  <span className="font-semibold text-white">ICCID:</span> {iccid}
                </p>
              )}
            </div>
          )}

          <div className="space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-white/60 flex items-center gap-2">
              <Smartphone size={14} />
              How to install
            </h3>
            <ol className="space-y-2 text-sm text-white/70 leading-relaxed list-decimal list-inside">
              <li>
                On <strong className="text-white">iPhone</strong>, open{' '}
                <strong className="text-white">Settings → Cellular → Add eSIM</strong>, then scan this QR code.
              </li>
              <li>
                On <strong className="text-white">Android</strong>, open{' '}
                <strong className="text-white">Settings → Network &amp; internet → SIMs → Add eSIM</strong>, then scan the code.
              </li>
              <li>Follow the on-screen prompts until the eSIM profile is installed.</li>
            </ol>
          </div>

          <p className="text-xs text-white/40 leading-relaxed">
            Keep this QR code private — anyone with it can install your eSIM profile.
          </p>
        </div>
      ) : null}
    </div>
  );
}
