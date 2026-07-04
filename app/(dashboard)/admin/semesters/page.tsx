'use client';

import { FormEvent, useEffect, useState } from 'react';

type Session = {
  id: number;
  name: string;
  is_active: boolean;
};

type Semester = {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  status: string;
  academic_session_id: number;
  academic_session_name: string;
};

export default function SemestersPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [rows, setRows] = useState<Semester[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({
    name: '',
    academicSessionId: '',
    startDate: '',
    endDate: '',
    status: 'inactive',
  });

  useEffect(() => {
    void loadData();
  }, []);

  async function loadData() {
    try {
      const [sessionsRes, semestersRes] = await Promise.all([
        fetch('/api/academic-sessions', { cache: 'no-store' }),
        fetch('/api/semesters', { cache: 'no-store' }),
      ]);

      const sessionsPayload = (await sessionsRes.json()) as { data?: Session[]; error?: string };
      const semestersPayload = (await semestersRes.json()) as Semester[] | { error?: string };

      if (!sessionsRes.ok) throw new Error(sessionsPayload.error || 'Failed to load sessions');
      if (!semestersRes.ok) throw new Error((semestersPayload as { error?: string }).error || 'Failed to load semesters');

      setSessions(sessionsPayload.data || []);
      setRows(semestersPayload as Semester[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load semesters');
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/semesters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          academic_session_id: Number(form.academicSessionId),
          start_date: form.startDate,
          end_date: form.endDate,
          status: form.status,
        }),
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error || 'Failed to create semester');

      setSuccess('Semester created successfully.');
      setForm({ name: '', academicSessionId: '', startDate: '', endDate: '', status: 'inactive' });
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create semester');
    } finally {
      setLoading(false);
    }
  }

  async function updateSemesterStatus(id: number, status: 'active' | 'closed') {
    setError('');
    try {
      const response = await fetch(`/api/semesters/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error || 'Failed to update semester');

      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update semester');
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Semester Management</h1>
        <p className="mt-2 text-sm text-slate-600">Create, activate, close, and track semesters under each academic session.</p>
      </section>

      <form onSubmit={onSubmit} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-3">
        <input
          required
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          placeholder="Semester Name"
          value={form.name}
          onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
        />
        <select
          required
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          value={form.academicSessionId}
          onChange={(event) => setForm((prev) => ({ ...prev, academicSessionId: event.target.value }))}
        >
          <option value="">Select Academic Session</option>
          {sessions.map((session) => (
            <option key={session.id} value={session.id}>
              {session.name}
              {session.is_active ? ' (active)' : ''}
            </option>
          ))}
        </select>
        <select
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          value={form.status}
          onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value }))}
        >
          <option value="inactive">Inactive</option>
          <option value="active">Active</option>
          <option value="closed">Closed</option>
        </select>
        <input
          required
          type="date"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          value={form.startDate}
          onChange={(event) => setForm((prev) => ({ ...prev, startDate: event.target.value }))}
        />
        <input
          required
          type="date"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          value={form.endDate}
          onChange={(event) => setForm((prev) => ({ ...prev, endDate: event.target.value }))}
        />
        <button disabled={loading} type="submit" className="rounded-lg bg-[#1A3A6B] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
          {loading ? 'Saving...' : 'Create Semester'}
        </button>
        {error ? <p className="md:col-span-3 text-sm text-rose-700">{error}</p> : null}
        {success ? <p className="md:col-span-3 text-sm text-emerald-700">{success}</p> : null}
      </form>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Semesters</h2>
        <div className="mt-3 space-y-2">
          {rows.length === 0 ? (
            <p className="text-sm text-slate-600">No semesters created yet.</p>
          ) : (
            rows.map((row) => (
              <div key={row.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                <div>
                  <p className="font-semibold text-slate-900">
                    {row.name} ({row.academic_session_name})
                  </p>
                  <p className="text-xs text-slate-600">
                    {row.start_date} - {row.end_date} | {row.status}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => updateSemesterStatus(row.id, 'active')} className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs">
                    Activate
                  </button>
                  <button type="button" onClick={() => updateSemesterStatus(row.id, 'closed')} className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs">
                    Close
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
