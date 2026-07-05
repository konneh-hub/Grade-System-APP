'use client';

import { FormEvent, useEffect, useState } from 'react';

type CalendarEvent = {
  id: number;
  title: string;
  category: string;
  start_date: string;
  end_date: string;
  description: string | null;
  status: string;
};

export default function AcademicCalendarPage() {
  const [rows, setRows] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({
    title: '',
    category: 'registration',
    startDate: '',
    endDate: '',
    description: '',
    status: 'active',
  });

  useEffect(() => {
    void loadEvents();
  }, []);

  async function loadEvents() {
    try {
      const response = await fetch('/api/admin/calendar', { cache: 'no-store' });
      const payload = (await response.json()) as CalendarEvent[] | { error?: string };
      if (!response.ok) throw new Error((payload as { error?: string }).error || 'Failed to load calendar events');
      setRows(payload as CalendarEvent[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load calendar events');
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const response = await fetch('/api/admin/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          category: form.category,
          start_date: form.startDate,
          end_date: form.endDate,
          description: form.description,
          status: form.status,
        }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error || 'Failed to create calendar event');

      setSuccess('Calendar event created successfully.');
      setForm({ title: '', category: 'registration', startDate: '', endDate: '', description: '', status: 'active' });
      await loadEvents();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create calendar event');
    } finally {
      setLoading(false);
    }
  }

  async function setStatus(id: number, status: string) {
    setError('');
    try {
      const response = await fetch(`/api/admin/calendar/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error || 'Failed to update event status');
      await loadEvents();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update event status');
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Academic Calendar</h1>
        <p className="mt-2 text-sm text-slate-600">Create and manage academic events such as registration, exams, and result periods.</p>
      </section>

      <form onSubmit={onSubmit} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-3">
        <label className="block">
          <span className="sr-only">Event title</span>
          <input required className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Event title" value={form.title} onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))} />
        </label>
        <label className="block">
          <span className="sr-only">Category</span>
          <select className="rounded-lg border border-slate-300 px-3 py-2 text-sm" value={form.category} onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))} aria-label="Category">
            <option value="registration">Registration</option>
            <option value="examination">Examination</option>
            <option value="result-entry">Result Entry</option>
            <option value="submission-deadline">Submission Deadline</option>
            <option value="graduation">Graduation</option>
            <option value="holiday">Holiday</option>
          </select>
        </label>
        <label className="block">
          <span className="sr-only">Status</span>
          <select className="rounded-lg border border-slate-300 px-3 py-2 text-sm" value={form.status} onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value }))} aria-label="Status">
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="closed">Closed</option>
          </select>
        </label>
        <label className="block">
          <span className="sr-only">Start date</span>
          <input required type="date" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" value={form.startDate} onChange={(event) => setForm((prev) => ({ ...prev, startDate: event.target.value }))} aria-label="Start date" />
        </label>
        <label className="block">
          <span className="sr-only">End date</span>
          <input required type="date" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" value={form.endDate} onChange={(event) => setForm((prev) => ({ ...prev, endDate: event.target.value }))} aria-label="End date" />
        </label>
        <label className="block">
          <span className="sr-only">Description</span>
          <input className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Description" value={form.description} onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))} />
        </label>
        <button disabled={loading} type="submit" className="md:col-span-3 rounded-lg bg-[#1A3A6B] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{loading ? 'Saving...' : 'Create Event'}</button>
        {error ? <p className="md:col-span-3 text-sm text-rose-700">{error}</p> : null}
        {success ? <p className="md:col-span-3 text-sm text-emerald-700">{success}</p> : null}
      </form>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Events</h2>
        <div className="mt-3 space-y-2">
          {rows.length === 0 ? <p className="text-sm text-slate-600">No events created yet.</p> : rows.map((item) => (
            <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
              <div>
                <p className="font-semibold text-slate-900">{item.title}</p>
                <p className="text-xs text-slate-600">{item.category} | {item.start_date} - {item.end_date} | {item.status}</p>
              </div>
              <button type="button" onClick={() => setStatus(item.id, item.status === 'active' ? 'inactive' : 'active')} className="rounded-lg border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                {item.status === 'active' ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
