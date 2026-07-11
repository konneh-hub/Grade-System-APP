"use client";

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function ResetPasswordClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token') ?? '';

  const [validating, setValidating] = useState(true);
  const [valid, setValid] = useState(false);
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function validateToken() {
      if (!token) {
        setValid(false);
        setError('A reset token is required.');
        setValidating(false);
        return;
      }

      try {
        const res = await fetch(`/api/auth/password/reset?token=${encodeURIComponent(token)}`);
        const data = await res.json();
        if (!res.ok || !data.valid) {
          setValid(false);
          setError(data?.error ?? 'The reset token is invalid or expired.');
        } else {
          setValid(true);
          setEmail(data.email ?? '');
          setFirstName(data.firstName ?? '');
          setError(null);
        }
      } catch (err: unknown) {
        setValid(false);
        setError(err instanceof Error ? err.message : 'Unable to validate reset token.');
      } finally {
        setValidating(false);
      }
    }

    validateToken();
  }, [token]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setStatus('submitting');
    setError(null);

    try {
      const res = await fetch('/api/auth/password/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'confirm', token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to reset password');
      setStatus('success');
      setTimeout(() => router.push('/login'), 1500);
    } catch (err: unknown) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Unable to reset password.');
    }
  }

  return (
    <div className="grid w-full max-w-7xl gap-10 lg:grid-cols-[1.2fr_1fr]">
      <section className="relative hidden items-center justify-center lg:flex">
        <img src="/slughublogo.png" alt="Slughub" className="h-auto w-full max-w-[600px] animate-float object-contain" />
      </section>

      <section className="mx-auto w-full max-w-[420px] animate-fade-in-up">
        <div className="rounded-2xl bg-white p-8 shadow-xl ring-1 ring-slate-200 sm:p-10 relative overflow-hidden">
          <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-[#1E3A8A]/5 blur-3xl" />
          <div className="relative z-10">
            <div className="flex flex-col items-center text-center">
              <div className="animate-float">
                <img src="/slughublogo.png" alt="Slughub" className="h-16 w-16 object-contain" />
              </div>
              <h1 className="mt-5 text-2xl font-bold leading-tight text-[#0F172A]">
                Create a new password
              </h1>
              <p className="mt-2 text-sm leading-5 text-[#64748B] max-w-xs">
                {validating
                  ? 'Validating your reset link…'
                  : valid
                  ? `Reset password for ${email}`
                  : 'Your reset link is invalid or expired. Please request a new one.'}
              </p>
            </div>

            <div className="mt-7 border-t border-slate-100 pt-7">
              {validating ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">Checking token validity…</div>
              ) : valid ? (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-[#475569]">
                      New password
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-all duration-300 focus:border-[#1E3A8A] focus:bg-[#F8FAFC] focus:ring-4 focus:ring-[#1E3A8A]/10"
                        placeholder="New password"
                      />
                    </label>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-[#475569]">
                      Confirm password
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-all duration-300 focus:border-[#1E3A8A] focus:bg-[#F8FAFC] focus:ring-4 focus:ring-[#1E3A8A]/10"
                        placeholder="Confirm password"
                      />
                    </label>
                  </div>

                  {error ? <p className="text-sm text-red-600">{error}</p> : null}

                  <button
                    type="submit"
                    disabled={status === 'submitting'}
                    className="inline-flex w-full items-center justify-center rounded-xl bg-[#1E3A8A] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#152C6B] disabled:cursor-not-allowed disabled:bg-slate-400"
                  >
                    {status === 'submitting' ? 'Updating password…' : 'Reset password'}
                  </button>

                  {status === 'success' ? (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                      Your password has been updated. Redirecting to sign in…
                    </div>
                  ) : null}
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-900">{error}</div>
                  <button
                    type="button"
                    onClick={() => router.push('/forgot-password')}
                    className="inline-flex w-full items-center justify-center rounded-xl bg-[#1E3A8A] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#152C6B]"
                  >
                    Request a new reset link
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
