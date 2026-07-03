'use client';

import { FormEvent, useEffect, useState } from 'react';

type SettingsPayload = Record<string, Record<string, string>>;

export default function SystemSettingsPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [settings, setSettings] = useState<SettingsPayload>({
    general: { university_name: '', logo_url: '', address: '', contact_email: '', time_zone: 'Africa/Monrovia' },
    authentication: { password_policy: 'strong', session_timeout_minutes: '60', mfa: 'optional', max_login_attempts: '5' },
    email: { smtp_host: '', smtp_port: '', sender_email: '', sender_name: '' },
    storage: { max_upload_size_mb: '10', allowed_file_types: 'pdf,jpg,jpeg,png,docx,xlsx,csv' },
  });

  useEffect(() => {
    void loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const response = await fetch('/api/admin/settings', { cache: 'no-store' });
      const payload = (await response.json()) as SettingsPayload | { error?: string };
      if (!response.ok) throw new Error((payload as { error?: string }).error || 'Failed to load settings');
      setSettings((prev) => ({ ...prev, ...(payload as SettingsPayload) }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings');
    }
  }

  function update(category: string, key: string, value: string) {
    setSettings((prev) => ({
      ...prev,
      [category]: {
        ...(prev[category] || {}),
        [key]: value,
      },
    }));
  }

  async function onSave(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error || 'Failed to save settings');
      setSuccess('Settings saved successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">System Settings</h1>
        <p className="mt-2 text-sm text-slate-600">Configure global platform behavior across general, authentication, email, and storage.</p>
      </section>

      <form onSubmit={onSave} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h2 className="mb-3 font-semibold text-slate-900">General</h2>
            <div className="space-y-2">
              <input className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="University Name" value={settings.general?.university_name || ''} onChange={(event) => update('general', 'university_name', event.target.value)} />
              <input className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Logo URL" value={settings.general?.logo_url || ''} onChange={(event) => update('general', 'logo_url', event.target.value)} />
              <input className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Address" value={settings.general?.address || ''} onChange={(event) => update('general', 'address', event.target.value)} />
              <input className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Contact Email" value={settings.general?.contact_email || ''} onChange={(event) => update('general', 'contact_email', event.target.value)} />
              <input className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Time Zone" value={settings.general?.time_zone || ''} onChange={(event) => update('general', 'time_zone', event.target.value)} />
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h2 className="mb-3 font-semibold text-slate-900">Authentication</h2>
            <div className="space-y-2">
              <input className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Password Policy" value={settings.authentication?.password_policy || ''} onChange={(event) => update('authentication', 'password_policy', event.target.value)} />
              <input className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Session Timeout (minutes)" value={settings.authentication?.session_timeout_minutes || ''} onChange={(event) => update('authentication', 'session_timeout_minutes', event.target.value)} />
              <input className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="MFA (optional/required)" value={settings.authentication?.mfa || ''} onChange={(event) => update('authentication', 'mfa', event.target.value)} />
              <input className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Max Login Attempts" value={settings.authentication?.max_login_attempts || ''} onChange={(event) => update('authentication', 'max_login_attempts', event.target.value)} />
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h2 className="mb-3 font-semibold text-slate-900">Email</h2>
            <div className="space-y-2">
              <input className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="SMTP Host" value={settings.email?.smtp_host || ''} onChange={(event) => update('email', 'smtp_host', event.target.value)} />
              <input className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="SMTP Port" value={settings.email?.smtp_port || ''} onChange={(event) => update('email', 'smtp_port', event.target.value)} />
              <input className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Sender Email" value={settings.email?.sender_email || ''} onChange={(event) => update('email', 'sender_email', event.target.value)} />
              <input className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Sender Name" value={settings.email?.sender_name || ''} onChange={(event) => update('email', 'sender_name', event.target.value)} />
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h2 className="mb-3 font-semibold text-slate-900">Storage</h2>
            <div className="space-y-2">
              <input className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Max Upload Size (MB)" value={settings.storage?.max_upload_size_mb || ''} onChange={(event) => update('storage', 'max_upload_size_mb', event.target.value)} />
              <textarea className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" rows={4} placeholder="Allowed file types (comma separated)" value={settings.storage?.allowed_file_types || ''} onChange={(event) => update('storage', 'allowed_file_types', event.target.value)} />
            </div>
          </div>
        </div>

        <button disabled={loading} type="submit" className="rounded-lg bg-[#1A3A6B] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{loading ? 'Saving...' : 'Save Settings'}</button>
        {error ? <p className="text-sm text-rose-700">{error}</p> : null}
        {success ? <p className="text-sm text-emerald-700">{success}</p> : null}
      </form>
    </div>
  );
}
