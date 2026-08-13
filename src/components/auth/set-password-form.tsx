'use client';

import LegalAcceptance from '@/components/legal/LegalAcceptance';
import { useAuth } from '@/lib/auth-context';
import {
  apiErrorMessage,
  apiFieldErrors,
  AuthApi,
} from '@/lib/api';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function SetPasswordFormContent() {
  const { login, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const params = useSearchParams();

  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [codeExpired, setCodeExpired] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState('');
  const [acceptedLegal, setAcceptedLegal] = useState(false);
  const [legalError, setLegalError] = useState('');

  useEffect(() => {
    const emailParam = params.get('email');
    const codeParam = params.get('code');
    if (emailParam) setEmail(emailParam);
    if (codeParam) setCode(codeParam.replace(/\D/g, '').slice(0, 6));
  }, [params]);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setCodeExpired(false);
    setFieldErrors({});
    setSuccess('');

    const trimmedEmail = email.trim();
    const digits = code.replace(/\D/g, '');
    const normalizedCode = digits.padStart(6, '0');

    const nextFieldErrors: Record<string, string> = {};
    if (!trimmedEmail) {
      nextFieldErrors.email = 'Email is required.';
    } else if (!EMAIL_RE.test(trimmedEmail)) {
      nextFieldErrors.email = 'Enter a valid email address.';
    }
    if (digits.length === 0 || digits.length > 6) {
      nextFieldErrors.code = 'Enter the 6-digit code from your email.';
    }
    if (password.length < 8) {
      nextFieldErrors.password = 'Password must be at least 8 characters.';
    }
    if (password !== confirmPassword) {
      nextFieldErrors.password_confirmation = 'Passwords do not match.';
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      return;
    }
    if (!acceptedLegal) {
      setLegalError('Please confirm that you agree to the Terms & Conditions and Privacy Policy.');
      return;
    }

    setLegalError('');
    setLoading(true);
    try {
      const result = await AuthApi.resetPassword({
        email: trimmedEmail,
        code: normalizedCode,
        password,
        password_confirmation: confirmPassword,
      });

      if (!result.ok) {
        const message = apiErrorMessage(
          result.body,
          'Could not set your password. Please try again.'
        );
        const serverFieldErrors = apiFieldErrors(result.body);
        if (Object.keys(serverFieldErrors).length > 0) {
          setFieldErrors(serverFieldErrors);
        }
        if (
          message.toLowerCase().includes('invalid') &&
          message.toLowerCase().includes('expired')
        ) {
          setCodeExpired(true);
          setError('That code is invalid or has expired. Request a new code.');
        } else {
          setError(message);
        }
        return;
      }

      setSuccess('Password set! You can now sign in.');

      try {
        await login(trimmedEmail, password);
        router.replace('/dashboard');
      } catch {
        router.replace(
          `/auth/login?email=${encodeURIComponent(trimmedEmail)}&passwordSet=1`
        );
      }
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ backgroundColor: '#f6f8f6' }}
    >
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          <h1 className="text-xl font-extrabold text-slate-900 mb-1">Set your password</h1>
          <p className="text-sm text-slate-500 mb-6">
            Enter the email used at the counter and the 6-digit code from your welcome email.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">
                Email address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-400 transition-colors"
              />
              {fieldErrors.email && (
                <p className="text-xs font-medium text-red-600 mt-1.5">{fieldErrors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">
                6-digit code
              </label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                inputMode="numeric"
                maxLength={6}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-800 tracking-[0.3em] text-center placeholder-slate-300 focus:outline-none focus:border-slate-400 transition-colors"
              />
              {fieldErrors.code && (
                <p className="text-xs font-medium text-red-600 mt-1.5">{fieldErrors.code}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">
                New password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={8}
                  className="w-full px-4 py-3 pr-11 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-400 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="text-xs font-medium text-red-600 mt-1.5">{fieldErrors.password}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">
                Confirm password
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                minLength={8}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-400 transition-colors"
              />
              {(fieldErrors.password_confirmation || fieldErrors.confirmPassword) && (
                <p className="text-xs font-medium text-red-600 mt-1.5">
                  {fieldErrors.password_confirmation ?? fieldErrors.confirmPassword}
                </p>
              )}
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              The code expires 15 minutes after your SIM was registered. Check your inbox for
              &lsquo;Your Travela SIM — Sign in to your account&rsquo;.
            </p>

            <LegalAcceptance
              checked={acceptedLegal}
              onChange={(value) => {
                setAcceptedLegal(value);
                if (value) setLegalError('');
              }}
              error={legalError}
            />

            {success && (
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3">
                <p className="text-sm font-medium text-emerald-700">{success}</p>
              </div>
            )}

            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3">
                <p className="text-sm font-medium text-red-700">{error}</p>
                {codeExpired && (
                  <p className="text-sm mt-2">
                    <Link
                      href="/forgot-password"
                      className="font-bold hover:underline"
                      style={{ color: '#112116' }}
                    >
                      Request a new code
                    </Link>
                  </p>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold text-white disabled:opacity-60 hover:opacity-90 transition-opacity"
              style={{ backgroundColor: '#112116' }}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Setting password…
                </>
              ) : (
                'Set password and continue'
              )}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-5">
            Code expired?{' '}
            <Link href="/forgot-password" className="font-bold hover:underline" style={{ color: '#112116' }}>
              Request a new one
            </Link>
          </p>
          <p className="text-center text-sm text-slate-500 mt-2">
            Already have an account?{' '}
            <Link href="/auth/login" className="font-bold hover:underline" style={{ color: '#112116' }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SetPasswordForm() {
  return (
    <Suspense>
      <SetPasswordFormContent />
    </Suspense>
  );
}
