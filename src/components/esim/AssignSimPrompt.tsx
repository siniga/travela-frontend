'use client';

import ActivateEsimButton from '@/components/esim/ActivateEsimButton';
import { Loader2 } from 'lucide-react';

type AssignSimPromptProps = {
  step: 'assign' | 'activate';
  activationDateLabel: string | null;
  assigning: boolean;
  error: string;
  extendDate: string;
  minExtendDate: string;
  userEsimId: number | null;
  qrCodeData?: string | null;
  msisdn?: string | null;
  onExtendDateChange: (value: string) => void;
  onAssign: () => void;
  onExtend: () => void;
  onActivated: (activatedAt: string) => void;
  onClose: () => void;
};

export default function AssignSimPrompt({
  step,
  activationDateLabel,
  assigning,
  error,
  extendDate,
  minExtendDate,
  userEsimId,
  qrCodeData,
  msisdn,
  onExtendDateChange,
  onAssign,
  onExtend,
  onActivated,
  onClose,
}: AssignSimPromptProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50"
      role="presentation"
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="assign-sim-title"
      >
        {step === 'assign' ? (
          <>
            <h2 id="assign-sim-title" className="text-lg font-extrabold text-slate-900">
              Assign your SIM now?
            </h2>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              Your eSIM activation date
              {activationDateLabel ? ` (${activationDateLabel})` : ''} is here. A number is not assigned
              yet. Assign it now, or choose a later eSIM activation date.
            </p>
            <div className="mt-4">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 block">
                eSIM Activation Date
              </label>
              <input
                type="date"
                min={minExtendDate}
                value={extendDate}
                onChange={(e) => onExtendDateChange(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:border-slate-400"
              />
            </div>
            {error && <p className="text-xs font-medium text-red-600 mt-3">{error}</p>}
            <div className="mt-5 flex flex-col gap-2">
              <button
                type="button"
                onClick={onAssign}
                disabled={assigning}
                className="w-full py-3.5 rounded-xl text-sm font-bold text-white disabled:opacity-60"
                style={{ backgroundColor: '#112116' }}
              >
                {assigning ? (
                  <span className="inline-flex items-center justify-center gap-2">
                    <Loader2 size={16} className="animate-spin" /> Assigning…
                  </span>
                ) : (
                  'Assign now'
                )}
              </button>
              <button
                type="button"
                onClick={onExtend}
                disabled={assigning || !extendDate}
                className="w-full py-3.5 rounded-xl text-sm font-bold border border-slate-200 text-slate-800 disabled:opacity-60"
              >
                Use this later date
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={assigning}
                className="w-full py-2 text-xs font-semibold text-slate-400"
              >
                Not now
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 id="assign-sim-title" className="text-lg font-extrabold text-slate-900">
              Activate your eSIM
            </h2>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed mb-4">
              Your number is assigned. Activate your eSIM to finish setup.
            </p>
            {userEsimId != null && (
              <ActivateEsimButton
                userEsimId={userEsimId}
                qrCodeData={qrCodeData}
                msisdn={msisdn}
                variant="light"
                onActivated={onActivated}
              />
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-full mt-3 py-2 text-xs font-semibold text-slate-400"
            >
              Close
            </button>
          </>
        )}
      </div>
    </div>
  );
}
