'use client';

import { EsimsApi, parseEsimActivation } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { ArrowLeft, Loader2, QrCode, RefreshCw, Smartphone } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { useCallback, useEffect, useState } from 'react';

function formatMsisdn(msisdn?: string | null) {
  if (!msisdn) return null;
  const trimmed = msisdn.trim();
  if (!trimmed) return null;
  return trimmed.startsWith('+') ? trimmed : `+${trimmed}`;
}

export default function EsimQrPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const userEsimId = Number(params.userEsimId);
  const validId = Number.isFinite(userEsimId) && userEsimId > 0;

  const [loading, setLoading] = useState(true);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [msisdn, setMsisdn] = useState<string | null>(null);
  const [iccid, setIccid] = useState<string | null>(null);
  const [error, setError] = useState('');

  const fetchActivation = useCallback(async () => {
    if (!validId) {
      setError('Invalid eSIM assignment.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    setQrCodeData(null);

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
      setMsisdn(activation.esim?.msisdn ?? activation.esim?.phone_number ?? null);
      setIccid(activation.esim?.iccid ?? null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load activation data.');
    } finally {
      setLoading(false);
    }
  }, [userEsimId, validId]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.replace('/auth/login');
      return;
    }
    void fetchActivation();
  }, [authLoading, fetchActivation, isAuthenticated, router]);

  if (authLoading || (!isAuthenticated && !error)) {
    return (
      <div
        className="min-h-[60vh] flex items-center justify-center"
        style={{ backgroundColor: '#f6f8f6' }}
      >
        <Loader2 size={28} className="animate-spin text-slate-400" />
      </div>
    );
  }

  const formattedMsisdn = formatMsisdn(msisdn);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f6f8f6' }}>
      <div className="max-w-lg mx-auto px-4 py-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 mb-6"
        >
          <ArrowLeft size={16} />
          Back to dashboard
        </Link>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100" style={{ backgroundColor: '#112116' }}>
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: 'rgba(23, 207, 84, 0.15)' }}
              >
                <QrCode size={20} style={{ color: '#17cf54' }} />
              </div>
              <div>
                <h1 className="text-lg font-extrabold text-white">Install your eSIM</h1>
                <p className="text-sm text-white/70">Scan this QR code on the phone where you want service.</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-500">
                <Loader2 size={28} className="animate-spin" />
                <p className="text-sm font-medium">Loading QR code…</p>
              </div>
            ) : error ? (
              <div className="py-8 text-center space-y-4">
                <p className="text-sm text-red-600">{error}</p>
                <button
                  type="button"
                  onClick={() => void fetchActivation()}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border border-slate-200 text-slate-700 hover:bg-slate-50"
                >
                  <RefreshCw size={15} />
                  Retry
                </button>
              </div>
            ) : qrCodeData ? (
              <div className="space-y-6">
                <div className="flex justify-center">
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <QRCodeSVG value={qrCodeData} size={260} level="M" includeMargin />
                  </div>
                </div>

                {(formattedMsisdn || iccid) && (
                  <div className="rounded-xl bg-slate-50 border border-slate-100 px-4 py-3 space-y-1.5 text-sm text-slate-600">
                    {formattedMsisdn && (
                      <p>
                        <span className="font-semibold text-slate-800">Number:</span> {formattedMsisdn}
                      </p>
                    )}
                    {iccid && (
                      <p>
                        <span className="font-semibold text-slate-800">ICCID:</span> {iccid}
                      </p>
                    )}
                  </div>
                )}

                <div className="space-y-4">
                  <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <Smartphone size={16} style={{ color: '#17cf54' }} />
                    How to install
                  </h2>
                  <ol className="space-y-3 text-sm text-slate-600 leading-relaxed list-decimal list-inside">
                    <li>
                      On <strong className="text-slate-800">iPhone</strong>, open{' '}
                      <strong className="text-slate-800">Settings → Cellular → Add eSIM</strong>, then scan this QR code.
                    </li>
                    <li>
                      On <strong className="text-slate-800">Android</strong>, open{' '}
                      <strong className="text-slate-800">Settings → Network &amp; internet → SIMs → Add eSIM</strong>, then scan the code.
                    </li>
                    <li>
                      Follow the on-screen prompts until the eSIM profile is installed. Keep this tab open while you scan.
                    </li>
                    <li>
                      Return to your dashboard and tap <strong className="text-slate-800">Activate eSIM</strong> once installation is complete.
                    </li>
                  </ol>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  Keep this page private — anyone with this QR code can install your eSIM profile.
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
