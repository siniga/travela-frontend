'use client';

import { useAuth } from '@/lib/auth-context';
import { ArrowRight, CheckCircle, Eye, EyeOff, Loader2, Smartphone } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [registered, setRegistered] = useState(false);
  const [firstName, setFirstName] = useState('');

  const update = (field: string, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await register({
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
        password_confirmation: form.confirmPassword,
      });
      setFirstName(form.name.split(' ')[0]);
      setRegistered(true);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e?.response?.data?.message ?? 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Post-registration: app download screen ──────────────────────────────
  if (registered) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4 py-12"
        style={{ backgroundColor: '#f6f8f6' }}
      >
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <Image
              src="/logos/travela_dark.png"
              alt="Travela"
              width={120}
              height={38}
              className="h-9 w-auto object-contain"
            />
          </div>

          {/* Welcome card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm text-center mb-4">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: 'rgba(23,207,84,0.12)' }}
            >
              <CheckCircle size={28} style={{ color: '#17cf54' }} />
            </div>
            <h1 className="text-xl font-extrabold text-slate-900 mb-1">
              Welcome, {firstName}!
            </h1>
            <p className="text-sm text-slate-500 mb-0">
              Your Travela account is ready. You&apos;re now signed in.
            </p>
          </div>

          {/* App download card */}
          <div
            className="rounded-2xl p-6 mb-4 text-white"
            style={{ backgroundColor: '#112116' }}
          >
            <div className="flex items-start gap-4 mb-5">
              <div
                className="w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center"
                style={{ backgroundColor: 'rgba(23,207,84,0.15)' }}
              >
                <Smartphone size={24} style={{ color: '#17cf54' }} />
              </div>
              <div>
                <p className="font-extrabold text-base mb-1">Get the Travela app</p>
                <p className="text-sm text-white/60 leading-relaxed">
                  Track your data usage, manage your SIM, top up anytime, and get 24/7 support — all from your phone.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <a
                href="#"
                className="flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-white/20 text-sm font-bold text-white hover:bg-white/10 transition-colors"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                </svg>
                Download on the App Store
              </a>
              <a
                href="#"
                className="flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-white/20 text-sm font-bold text-white hover:bg-white/10 transition-colors"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3.18 23.76c.3.17.64.24.99.19l12.6-7.27-2.79-2.79-10.8 9.87zm-1.9-20.7C1.1 3.4 1 3.75 1 4.13v15.74c0 .38.1.73.28 1.04l.06.05 8.82-8.82v-.2L1.34 3.01l-.06.05zm17.54 8.49l-2.52-1.46-3.14 3.13 3.14 3.14 2.54-1.47c.72-.42.72-1.1 0-1.52l-.02.18zM4.17.24L16.77 7.5l-2.79 2.79L3.18.42A1.2 1.2 0 0 1 4.17.24z" />
                </svg>
                Get it on Google Play
              </a>
            </div>
          </div>

          {/* Skip to dashboard */}
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors"
          >
            Maybe later — go to Dashboard <ArrowRight size={15} />
          </button>
        </div>
      </div>
    );
  }

  // ── Registration form ────────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ backgroundColor: '#f6f8f6' }}
    >
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Image
            src="/logos/travela_dark.png"
            alt="Travela"
            width={120}
            height={38}
            className="h-9 w-auto object-contain"
          />
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          <h1 className="text-xl font-extrabold text-slate-900 mb-1">Create an account</h1>
          <p className="text-sm text-slate-500 mb-6">Join Travela and stay connected.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { field: 'name', label: 'Full Name', type: 'text', placeholder: 'John Doe' },
              { field: 'email', label: 'Email', type: 'email', placeholder: 'you@example.com' },
              { field: 'phone', label: 'Phone Number', type: 'tel', placeholder: '+255 7XX XXX XXX' },
            ].map(({ field, label, type, placeholder }) => (
              <div key={field}>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">{label}</label>
                <input
                  type={type}
                  required={field !== 'phone'}
                  value={form[field as keyof typeof form]}
                  onChange={(e) => update(field, e.target.value)}
                  placeholder={placeholder}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-400 transition-colors"
                />
              </div>
            ))}

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={form.password}
                  onChange={(e) => update('password', e.target.value)}
                  placeholder="••••••••"
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
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">
                Confirm Password
              </label>
              <input
                type="password"
                required
                value={form.confirmPassword}
                onChange={(e) => update('confirmPassword', e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-400 transition-colors"
              />
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3">
                <p className="text-sm font-medium text-red-700">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold text-white disabled:opacity-60 hover:opacity-90 transition-opacity"
              style={{ backgroundColor: '#112116' }}
            >
              {loading
                ? <><Loader2 size={16} className="animate-spin" /> Creating account…</>
                : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-5">
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
