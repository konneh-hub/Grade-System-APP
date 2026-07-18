"use client";

import Link from 'next/link';
import { useState } from 'react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('sending');
    setError(null);

    try {
      const res = await fetch('/api/auth/password/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'request', email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Unable to send reset link');
      setStatus('success');
    } catch (err: unknown) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Unable to send reset link');
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
                Reset your Slughub password
              </h1>
              <p className="mt-2 text-sm leading-5 text-[#64748B] max-w-xs">
                Enter the email address tied to your account and we’ll send a secure reset link.
              </p>
            </div>

            <div className="mt-7 border-t border-slate-100 pt-7">
              {status === 'success' ? (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-900">
                    If an account exists for that email, a password reset link has been sent. Please check your inbox.
                  </div>
                  <Link href="/login" className="inline-flex w-full items-center justify-center rounded-xl bg-[#1E3A8A] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#152C6B]">
                    Back to sign in
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <label className="block text-sm font-medium text-[#475569]">
                    Email
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-all duration-300 focus:border-[#1E3A8A] focus:bg-[#F8FAFC] focus:ring-4 focus:ring-[#1E3A8A]/10"
                      placeholder="you@example.com"
                    />
                  </label>

                  {error ? <p className="text-sm text-red-600">{error}</p> : null}

                  <button
                    type="submit"
                    disabled={status === 'sending'}
                    className="inline-flex w-full items-center justify-center rounded-xl bg-[#1E3A8A] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#152C6B] disabled:cursor-not-allowed disabled:bg-slate-400"
                  >
                    {status === 'sending' ? 'Sending reset link…' : 'Send reset link'}
                  </button>

                  <p className="text-center text-sm text-slate-500">
                    Remembered your password?{' '}
                    <Link href="/login" className="font-semibold text-[#1E3A8A] hover:text-[#152C6B]">
                      Sign in
                    </Link>
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
