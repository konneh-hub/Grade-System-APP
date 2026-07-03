'use client';

import { FormEvent, useEffect, useState } from 'react';

type SessionStatus = 'inactive' | 'active' | 'closed';

type SessionItem = {
  id: number;
  name: string;
  code: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
};

export default function Page() {
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({ name: '', code: '', startDate: '', endDate: '', status: 'inactive' as SessionStatus });

  useEffect(() => {
    void loadSessions();
  }, []);

  async function loadSessions() {
    try {
      const response = await fetch('/api/academic-sessions', { cache: 'no-store' });
      const payload = (await response.json()) as { data?: SessionItem[]; error?: string };
      if (!response.ok) throw new Error(payload.error || 'Failed to load sessions');
      setSessions(payload.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sessions');
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/academic-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          code: form.code || form.name,
          start_date: form.startDate,
          end_date: form.endDate,
          is_active: form.status === 'active',
        }),
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error || 'Failed to create session');

      setSuccess('Session created successfully.');
      setForm({ name: '', code: '', startDate: '', endDate: '', status: 'inactive' });
      await loadSessions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create session');
    } finally {
      setLoading(false);
    }
  }

  async function setSessionStatus(sessionId: number, status: SessionStatus) {
    setError('');
    try {
      const response = await fetch(`/api/academic-sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: status === 'active' }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error || 'Failed to update session');
      await loadSessions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update session');
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Academic Session Management</h1>
        <p className="mt-2 text-sm text-slate-600">Only one session can be active. Activating a session automatically deactivates previous active session.</p>
      </section>

      <form onSubmit={onSubmit} className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-2">
        <label className="text-sm">Session Name<input required className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} placeholder="2026/2027" /></label>
        <label className="text-sm">Session Code<input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={form.code} onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value }))} placeholder="2026-2027" /></label>
        <label className="text-sm">Status<select className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={form.status} onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value as SessionStatus }))}><option value="inactive">Inactive</option><option value="active">Active</option><option value="closed">Closed</option></select></label>
        <label className="text-sm">Start Date<input required type="date" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={form.startDate} onChange={(e) => setForm((prev) => ({ ...prev, startDate: e.target.value }))} /></label>
        <label className="text-sm">End Date<input required type="date" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={form.endDate} onChange={(e) => setForm((prev) => ({ ...prev, endDate: e.target.value }))} /></label>
        <button disabled={loading} type="submit" className="md:col-span-2 rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{loading ? 'Saving...' : 'Create Session'}</button>
        {error ? <p className="md:col-span-2 text-sm text-rose-700">{error}</p> : null}
        {success ? <p className="md:col-span-2 text-sm text-emerald-700">{success}</p> : null}
      </form>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Session list</h2>
        <div className="mt-3 space-y-2">
          {sessions.length === 0 ? <p className="text-sm text-slate-600">No sessions created.</p> : sessions.map((item) => (
            <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
              <div>
                {item.name} ({item.start_date} - {item.end_date}) - {item.is_active ? 'active' : 'inactive'}
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setSessionStatus(item.id, 'active')} className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs">Activate</button>
                <button type="button" onClick={() => setSessionStatus(item.id, 'closed')} className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs">Close</button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
