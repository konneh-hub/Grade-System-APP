'use client';

import { FormEvent, useMemo, useState } from 'react';

const mockLogs = [
  { user: 'John Doe', role: 'Admin', module: 'Faculty', action: 'Created Faculty', date: '2026-07-02', time: '10:43 AM' },
  { user: 'Mariam K.', role: 'Exam Officer', module: 'Results', action: 'Published Results', date: '2026-07-02', time: '09:20 AM' },
  { user: 'System', role: 'Security', module: 'Auth', action: 'Failed Login Attempt', date: '2026-07-02', time: '07:12 AM' },
];

export default function Page() {
  const [filters, setFilters] = useState({ user: '', role: '', module: '', action: '', from: '', to: '' });
  const [submitted, setSubmitted] = useState(false);

  function onFilter(event: FormEvent) {
    event.preventDefault();
    setSubmitted(true);
  }

  const filtered = useMemo(() => {
    return mockLogs.filter((log) => {
      if (filters.user && !log.user.toLowerCase().includes(filters.user.toLowerCase())) return false;
      if (filters.role && !log.role.toLowerCase().includes(filters.role.toLowerCase())) return false;
      if (filters.module && !log.module.toLowerCase().includes(filters.module.toLowerCase())) return false;
      if (filters.action && !log.action.toLowerCase().includes(filters.action.toLowerCase())) return false;
      return true;
    });
  }, [filters]);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Audit Logs</h1>
        <p className="mt-2 text-sm text-slate-600">Read-only investigation timeline with live append behavior.</p>
      </section>

      <form onSubmit={onFilter} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-3">
        <input className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="User" value={filters.user} onChange={(e) => setFilters((prev) => ({ ...prev, user: e.target.value }))} />
        <input className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Role" value={filters.role} onChange={(e) => setFilters((prev) => ({ ...prev, role: e.target.value }))} />
        <input className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Module" value={filters.module} onChange={(e) => setFilters((prev) => ({ ...prev, module: e.target.value }))} />
        <input className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Action Type" value={filters.action} onChange={(e) => setFilters((prev) => ({ ...prev, action: e.target.value }))} />
        <input type="date" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" value={filters.from} onChange={(e) => setFilters((prev) => ({ ...prev, from: e.target.value }))} />
        <input type="date" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" value={filters.to} onChange={(e) => setFilters((prev) => ({ ...prev, to: e.target.value }))} />
        <button type="submit" className="md:col-span-3 rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white">Apply Filters</button>
      </form>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Timeline</h2>
        {submitted ? <p className="mt-2 text-sm text-slate-600">Filters applied.</p> : null}
        <div className="mt-3 space-y-2">
          {filtered.map((log, index) => (
            <div key={`${log.user}-${log.time}-${index}`} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
              {log.user} | {log.role} | {log.action} | {log.module} | {log.date} {log.time}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
