"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [registrationToken, setRegistrationToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, registration_token: registrationToken }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Registration failed');
      router.push('/');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="space-y-2">
        <label htmlFor="register-email" className="block text-sm font-medium text-[#475569]">
          Email
        </label>
        <input
          id="register-email"
          title="Email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          required
          className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-[#2563EB] focus:ring-4 focus:ring-[#3B82F6]/20"
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="register-token" className="block text-sm font-medium text-[#475569]">
          Registration token
        </label>
        <input
          id="register-token"
          title="Registration token"
          placeholder="Enter registration token"
          value={registrationToken}
          onChange={(e) => setRegistrationToken(e.target.value)}
          required
          className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-[#2563EB] focus:ring-4 focus:ring-[#3B82F6]/20"
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="register-password" className="block text-sm font-medium text-[#475569]">
          Password
        </label>
        <input
          id="register-password"
          title="Password"
          placeholder="Create a password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          required
          className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-[#2563EB] focus:ring-4 focus:ring-[#3B82F6]/20"
        />
      </div>
      <p className="text-sm leading-6 text-[#475569]">
        Registration is only available for provisioned staff and students. Ask your administrator for the registration code.
      </p>
      {error && <div className="text-sm text-red-600">{error}</div>}
      <button
        type="submit"
        disabled={loading}
        className="inline-flex w-full h-12 items-center justify-center rounded-xl bg-[#2563EB] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1d4ed8] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#3B82F6]/40 disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {loading ? 'Creating...' : 'Create account'}
      </button>
    </form>
  );
}
