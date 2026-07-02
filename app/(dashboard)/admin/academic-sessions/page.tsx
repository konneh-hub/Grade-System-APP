'use client';

import { FormEvent, useState } from 'react';

type SessionStatus = 'inactive' | 'active' | 'closed';

type SessionItem = {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  status: SessionStatus;
};

export default function Page() {
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [form, setForm] = useState({ name: '', startDate: '', endDate: '', status: 'inactive' as SessionStatus });

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSessions((prev) => {
      const next = prev.map((item) => (form.status === 'active' ? { ...item, status: item.status === 'active' ? 'inactive' : item.status } : item));
      return [{ id: Date.now(), ...form }, ...next];
    });
    setForm({ name: '', startDate: '', endDate: '', status: 'inactive' });
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Academic Session Management</h1>
        <p className="mt-2 text-sm text-slate-600">Only one session can be active. Activating a session automatically deactivates previous active session.</p>
      </section>

      <form onSubmit={onSubmit} className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-2">
        <label className="text-sm">Session Name<input required className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} placeholder="2026/2027" /></label>
        <label className="text-sm">Status<select className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={form.status} onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value as SessionStatus }))}><option value="inactive">Inactive</option><option value="active">Active</option><option value="closed">Closed</option></select></label>
        <label className="text-sm">Start Date<input required type="date" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={form.startDate} onChange={(e) => setForm((prev) => ({ ...prev, startDate: e.target.value }))} /></label>
        <label className="text-sm">End Date<input required type="date" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={form.endDate} onChange={(e) => setForm((prev) => ({ ...prev, endDate: e.target.value }))} /></label>
        <button type="submit" className="md:col-span-2 rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white">Create Session</button>
      </form>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Session list</h2>
        <div className="mt-3 space-y-2">
          {sessions.length === 0 ? <p className="text-sm text-slate-600">No sessions created.</p> : sessions.map((item) => (
            <div key={item.id} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
              {item.name} ({item.startDate} - {item.endDate}) - {item.status}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
