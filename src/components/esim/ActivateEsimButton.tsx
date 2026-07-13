'use client';

import { EsimsApi, parseEsimActivation } from '@/lib/api';
import { Loader2, RefreshCw, Smartphone } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

type ActivateEsimButtonProps = {
  userEsimId: number;
  /** Use on dark SIM card background */
  variant?: 'dark' | 'light';
};

export default function ActivateEsimButton({
  userEsimId,
  variant = 'dark',
}: ActivateEsimButtonProps) {
  const [loading, setLoading] = useState(true);
  const [lpaString, setLpaString] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [unavailable, setUnavailable] = useState(false);

  const fetchActivation = useCallback(async () => {
    setLoading(true);
    setError('');
    setUnavailable(false);
    setLpaString(null);

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

      setLpaString(activation.lpa_string);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to load activation data.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [userEsimId]);

  useEffect(() => {
    void fetchActivation();
  }, [fetchActivation]);

  const handleActivate = () => {
    if (!lpaString) return;
    window.location.href = lpaString;
  };

  const isDark = variant === 'dark';

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

  if (unavailable || !lpaString) {
    return (
      <p
        className={`mt-5 text-sm text-center py-2 ${
          isDark ? 'text-white/60' : 'text-slate-500'
        }`}
      >
        eSIM activation is not available.
      </p>
    );
  }

  return (
    <button
      type="button"
      onClick={handleActivate}
      className={`mt-5 w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold transition-opacity hover:opacity-90 ${
        isDark ? '' : 'shadow-sm'
      }`}
      style={{ backgroundColor: '#17cf54', color: '#112116' }}
    >
      <Smartphone size={16} />
      Activate eSIM
    </button>
  );
}
