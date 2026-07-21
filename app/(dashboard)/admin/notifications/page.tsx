"use client";

import { useCallback, FormEvent, useEffect, useState } from 'react';

type NotificationRow = {
  id: number;
  title: string;
  body: string;
  recipient_email?: string;
  channel: string;
  is_read: number;
  created_at: string;
};

export default function NotificationsPage() {
  const [rows, setRows] = useState<NotificationRow[]>([]);
  const [form, setForm] = useState({
    title: '',
    message: '',
    type: 'info',
    channel: 'in-app',
    audience: 'all',
    target_role: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchNotifications = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications', { cache: 'no-store' });
      const payload = (await response.json()) as NotificationRow[] | { error?: string };
      if (!response.ok) throw new Error((payload as { error?: string }).error || 'Failed to load notifications');
      setRows(payload as NotificationRow[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notifications');
    }
  }, []);

  useEffect(() => {
    void fetchNotifications();
  }, [fetchNotifications]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          message: form.message,
          deliveryType: form.channel === 'in-app' ? 'dashboard' : form.channel,
          targetAudience: form.audience === 'role' ? form.target_role : 'all',
        }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error || 'Failed to send notification');
      setSuccess('Notification sent successfully.');
      setForm({ title: '', message: '', type: 'info', channel: 'in-app', audience: 'all', target_role: '' });
      await fetchNotifications();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send notification');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Notification Management</h1>
        <p className="mt-2 text-sm text-slate-600">Send and track dashboard, email, and optional SMS notifications.</p>
      </section>

      <form onSubmit={onSubmit} className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-2">
        <label className="text-sm">Title<input required className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={form.title} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} /></label>
        <label className="text-sm">Type<select className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={form.type} onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value }))}><option value="info">Info</option><option value="warning">Warning</option><option value="success">Success</option><option value="error">Error</option></select></label>
        <label className="md:col-span-2 text-sm">Message<textarea required rows={4} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={form.message} onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))} /></label>
        <label className="text-sm">Channel<select className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={form.channel} onChange={(e) => setForm((prev) => ({ ...prev, channel: e.target.value }))}><option value="in-app">In-app</option><option value="email">Email</option><option value="sms">SMS</option></select></label>
        <label className="text-sm">Audience<select className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={form.audience} onChange={(e) => setForm((prev) => ({ ...prev, audience: e.target.value }))}><option value="all">All users</option><option value="role">By role</option></select></label>
        {form.audience === 'role' ? (
          <label className="md:col-span-2 text-sm">Target Role<select required className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={form.target_role} onChange={(e) => setForm((prev) => ({ ...prev, target_role: e.target.value }))}><option value="">Select role</option><option value="admin">Admin</option><option value="dean">Dean</option><option value="hod">HoD</option><option value="exam-officer">Exam Officer</option><option value="lecturer">Lecturer</option><option value="student">Student</option></select></label>
        ) : null}
        <button disabled={loading} type="submit" className="md:col-span-2 rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70">{loading ? 'Sending...' : 'Send Notification'}</button>
        {error ? <p className="md:col-span-2 text-sm text-rose-700">{error}</p> : null}
        {success ? <p className="md:col-span-2 text-sm text-emerald-700">{success}</p> : null}
      </form>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Recent notifications</h2>
        <div className="mt-4 space-y-2">
          {rows.length === 0 ? <p className="text-sm text-slate-600">No notifications yet.</p> : rows.map((row) => (
            <div key={row.id} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
              <p className="font-medium text-slate-900">{row.title} <span className="font-normal text-slate-500">({row.channel}/{row.is_read ? 'read' : 'unread'})</span></p>
              <p className="mt-1">{row.body}</p>
              <p className="mt-1 text-xs text-slate-500">Recipient: {row.recipient_email || 'unknown'}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
