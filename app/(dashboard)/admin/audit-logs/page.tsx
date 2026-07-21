'use client';

import { FormEvent, useEffect, useState } from 'react';

type AuditLog = {
  id: number;
  user: string;
  role: string;
  module: string;
  action: string;
  details: string | null;
  date: string;
  time: string;
  timestamp: string;
};

export default function Page() {
  const [filters, setFilters] = useState({ user: '', role: '', module: '', action: '', from: '', to: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [logs, setLogs] = useState<AuditLog[]>([]);

  async function fetchLogs(activeFilters = filters) {
    setLoading(true);
    setError('');
    try {
      const searchParams = new URLSearchParams();
      searchParams.set('limit', '200');
      if (activeFilters.user) searchParams.set('user', activeFilters.user);
      if (activeFilters.role) searchParams.set('role', activeFilters.role);
      if (activeFilters.module) searchParams.set('module', activeFilters.module);
      if (activeFilters.action) searchParams.set('action', activeFilters.action);
      if (activeFilters.from) searchParams.set('from', activeFilters.from);
      if (activeFilters.to) searchParams.set('to', activeFilters.to);

      const response = await fetch(`/api/audit?${searchParams.toString()}`, { cache: 'no-store' });
      const payload = (await response.json()) as AuditLog[] | { error?: string };
      if (!response.ok) throw new Error((payload as { error?: string }).error || 'Failed to load audit logs');
      setLogs(payload as AuditLog[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load audit logs');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchLogs();
  }, []);

  function onFilter(event: FormEvent) {
    event.preventDefault();
    setSubmitted(true);
    void fetchLogs(filters);
  }

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
        <input type="date" title="From date" aria-label="From date" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" value={filters.from} onChange={(e) => setFilters((prev) => ({ ...prev, from: e.target.value }))} />
        <input type="date" title="To date" aria-label="To date" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" value={filters.to} onChange={(e) => setFilters((prev) => ({ ...prev, to: e.target.value }))} />
        <button type="submit" className="md:col-span-3 rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white">Apply Filters</button>
      </form>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Timeline</h2>
        {submitted ? <p className="mt-2 text-sm text-slate-600">Filters applied.</p> : null}
        {error ? <p className="mt-2 text-sm text-rose-700">{error}</p> : null}
        <div className="mt-3 space-y-2">
          {loading ? <p className="text-sm text-slate-600">Loading audit logs...</p> : null}
          {!loading && logs.length === 0 ? <p className="text-sm text-slate-600">No audit logs found for the selected filters.</p> : null}
          {!loading && logs.map((log) => (
            <div key={log.id} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
              {log.user} | {log.role} | {log.action} | {log.module} | {log.date} {log.time}
              {log.details ? <p className="mt-1 text-xs text-slate-500">{log.details}</p> : null}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
