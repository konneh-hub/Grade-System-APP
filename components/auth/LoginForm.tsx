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
    <form onSubmit={submit} className="space-y-6">
      <div className="space-y-2">
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
          className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-[#2563EB] focus:ring-4 focus:ring-[#3B82F6]/20"
        />
      </div>
      <div className="space-y-2">
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
          className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-[#2563EB] focus:ring-4 focus:ring-[#3B82F6]/20"
        />
      </div>
      {error && <div className="text-sm text-red-600">{error}</div>}
      <button
        type="submit"
        disabled={loading}
        className="inline-flex w-full h-12 items-center justify-center rounded-xl bg-[#2563EB] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1d4ed8] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#3B82F6]/40 disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {loading ? 'Signing in...' : 'Sign in'}
      </button>
      <div className="flex flex-col gap-3 text-center text-sm sm:flex-row sm:items-center sm:justify-between">
        <Link href="/forgot-password" className="font-medium text-[#2563EB] transition hover:text-[#1d4ed8]">
          Forgot password?
        </Link>
        <Link
          href="/register"
          className="inline-flex items-center justify-center rounded-xl border border-[#2563EB] bg-white px-4 py-3 text-sm font-semibold text-[#2563EB] transition hover:bg-[#eff6ff]"
        >
          Register
        </Link>
      </div>
    </form>
  );
}
