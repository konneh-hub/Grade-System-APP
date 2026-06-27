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
    } catch (err: any) {
      setError(err?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <div>
        <label htmlFor="register-email">Email</label>
        <input id="register-email" title="Email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
      </div>
      <div>
        <label htmlFor="register-token">Registration token</label>
        <input id="register-token" title="Registration token" placeholder="Enter registration token" value={registrationToken} onChange={(e) => setRegistrationToken(e.target.value)} required />
      </div>
      <div>
        <label htmlFor="register-password">Password</label>
        <input id="register-password" title="Password" placeholder="Create a password" value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
      </div>
      <p>Registration is only available for provisioned staff and students. Ask your administrator for the registration code.</p>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <button type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create account'}</button>
    </form>
  );
}
