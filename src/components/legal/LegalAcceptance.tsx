'use client';

import Link from 'next/link';

type LegalAcceptanceProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: string;
  id?: string;
};

export default function LegalAcceptance({
  checked,
  onChange,
  error,
  id = 'accept-legal',
}: LegalAcceptanceProps) {
  return (
    <div>
      <label htmlFor={id} className="flex items-start gap-3 cursor-pointer select-none">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300"
          style={{ accentColor: '#112116' }}
        />
        <span className="text-sm text-slate-600 leading-relaxed">
          I agree to the{' '}
          <Link
            href="/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold underline underline-offset-2 hover:opacity-80"
            style={{ color: '#112116' }}
          >
            Terms &amp; Conditions
          </Link>{' '}
          and{' '}
          <Link
            href="/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold underline underline-offset-2 hover:opacity-80"
            style={{ color: '#112116' }}
          >
            Privacy Policy
          </Link>
          .
        </span>
      </label>
      {error ? <p className="text-xs font-medium text-red-600 mt-2">{error}</p> : null}
    </div>
  );
}
