"use client";
import Link from 'next/link';
import { useState } from 'react';

interface LoginResponse {
  roles?: string[];
}

export default function LoginForm({ onSuccess }: { onSuccess?: (data: LoginResponse) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Login failed');
      onSuccess?.(data as LoginResponse);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-4 space-y-5">
      <div className="space-y-1.5">
        <label htmlFor="login-email" className="block text-sm font-medium text-[#475569]">
          Email
        </label>
        <input
          id="login-email"
          name="email"
          autoComplete="email"
          inputMode="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          required
          spellCheck={false}
          className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition-all duration-300 ease-out placeholder:text-slate-400 hover:border-slate-300 focus:border-[#1E3A8A] focus:bg-[#F8FAFC] focus:ring-4 focus:ring-[#1E3A8A]/10 focus:shadow-lg focus:shadow-[#1E3A8A]/5"
        />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="login-password" className="block text-sm font-medium text-[#475569]">
          Password
        </label>
        <input
          id="login-password"
          name="password"
          autoComplete="current-password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          required
          className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition-all duration-300 ease-out placeholder:text-slate-400 hover:border-slate-300 focus:border-[#1E3A8A] focus:bg-[#F8FAFC] focus:ring-4 focus:ring-[#1E3A8A]/10 focus:shadow-lg focus:shadow-[#1E3A8A]/5"
        />
      </div>
      {error && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 ring-1 ring-red-100 animate-fade-in-up">{error}</div>}
      <button
        type="submit"
        disabled={loading}
        className="group inline-flex w-full h-12 items-center justify-center rounded-xl bg-[#1E3A8A] px-4 text-sm font-semibold text-white shadow-lg shadow-[#1E3A8A]/25 transition-all duration-300 ease-out hover:bg-[#152C6B] hover:shadow-xl hover:shadow-[#152C6B]/30 hover:-translate-y-0.5 active:translate-y-0 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#1E3A8A]/40 disabled:cursor-not-allowed disabled:bg-slate-400 disabled:shadow-none disabled:hover:translate-y-0"
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Signing in...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            Sign in
            <svg className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </span>
        )}
      </button>
      <div className="flex flex-col gap-3 text-center text-sm sm:flex-row sm:items-center sm:justify-between">
        <Link href="/forgot-password" className="group font-medium text-[#1E3A8A] transition-all duration-300 hover:text-[#152C6B]">
          <span className="inline-flex items-center gap-1">
            Forgot password?
            <span className="inline-block transition-transform duration-300 group-hover:translate-x-0.5">→</span>
          </span>
        </Link>
        <Link
          href="/register"
          className="inline-flex items-center justify-center rounded-xl border border-[#1E3A8A] bg-white px-5 py-2.5 text-sm font-semibold text-[#1E3A8A] transition-all duration-300 hover:bg-[#1E3A8A] hover:text-white hover:shadow-lg hover:shadow-[#1E3A8A]/25 active:scale-[0.98]"
        >
          Register
        </Link>
      </div>
    </form>
  );
}
