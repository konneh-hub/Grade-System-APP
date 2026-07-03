'use client';

import { FormEvent, useEffect, useState } from 'react';

type AdminProfile = {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  avatar_url: string | null;
  mfa_enabled?: number;
  last_login_at: string | null;
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '' });

  useEffect(() => {
    void loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const response = await fetch('/api/admin/profile', { cache: 'no-store' });
      const payload = (await response.json()) as AdminProfile | { error?: string };
      if (!response.ok) throw new Error((payload as { error?: string }).error || 'Failed to load profile');
      setProfile(payload as AdminProfile);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    }
  }

  async function onSaveProfile(event: FormEvent) {
    event.preventDefault();
    if (!profile) return;
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const response = await fetch('/api/admin/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error || 'Failed to update profile');
      setSuccess('Profile updated successfully.');
      await loadProfile();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  }

  async function onChangePassword(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(passwordForm),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error || 'Failed to change password');
      setSuccess('Password changed successfully.');
      setPasswordForm({ oldPassword: '', newPassword: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Admin Profile</h1>
        <p className="mt-2 text-sm text-slate-600">Manage personal information, password, MFA, and profile settings.</p>
      </section>

      {error ? <p className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</p> : null}
      {success ? <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{success}</p> : null}

      <form onSubmit={onSaveProfile} className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-2">
        <input className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="First Name" value={profile?.first_name || ''} onChange={(event) => setProfile((prev) => (prev ? { ...prev, first_name: event.target.value } : prev))} />
        <input className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Last Name" value={profile?.last_name || ''} onChange={(event) => setProfile((prev) => (prev ? { ...prev, last_name: event.target.value } : prev))} />
        <input className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Email" value={profile?.email || ''} disabled />
        <input className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Phone" value={profile?.phone || ''} onChange={(event) => setProfile((prev) => (prev ? { ...prev, phone: event.target.value } : prev))} />
        <input className="md:col-span-2 rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Profile Picture URL" value={profile?.avatar_url || ''} onChange={(event) => setProfile((prev) => (prev ? { ...prev, avatar_url: event.target.value } : prev))} />
        <label className="md:col-span-2 flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={Boolean(profile?.mfa_enabled)} onChange={(event) => setProfile((prev) => (prev ? { ...prev, mfa_enabled: event.target.checked ? 1 : 0 } : prev))} /> Enable MFA
        </label>
        <button disabled={loading} type="submit" className="rounded-lg bg-[#1A3A6B] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{loading ? 'Saving...' : 'Save Profile'}</button>
      </form>

      <form onSubmit={onChangePassword} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-2">
        <input type="password" required className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Current Password" value={passwordForm.oldPassword} onChange={(event) => setPasswordForm((prev) => ({ ...prev, oldPassword: event.target.value }))} />
        <input type="password" required className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="New Password" value={passwordForm.newPassword} onChange={(event) => setPasswordForm((prev) => ({ ...prev, newPassword: event.target.value }))} />
        <button disabled={loading} type="submit" className="md:col-span-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-60">{loading ? 'Updating...' : 'Change Password'}</button>
      </form>
    </div>
  );
}
