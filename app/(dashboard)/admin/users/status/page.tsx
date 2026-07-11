'use client';

import { useEffect, useMemo, useState } from 'react';

type UserRow = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  status: string;
  roles: string[];
};

export default function AdminUserStatusPage() {
  const [rows, setRows] = useState<UserRow[]>([]);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [error, setError] = useState('');

  useEffect(() => {
    void loadUsers();
  }, []);

  async function loadUsers() {
    try {
      const response = await fetch('/api/users', { cache: 'no-store' });
      const payload = (await response.json()) as UserRow[] | { error?: string };
      if (!response.ok) throw new Error((payload as { error?: string }).error || 'Failed to load users');
      setRows(payload as UserRow[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    }
  }

  const filtered = useMemo(() => {
    return rows.filter((row) => {
      if (statusFilter !== 'all' && row.status !== statusFilter) return false;
      if (!query) return true;
      const term = query.toLowerCase();
      return (`${row.first_name} ${row.last_name}`.toLowerCase().includes(term) || row.email.toLowerCase().includes(term));
    });
  }, [rows, query, statusFilter]);

  async function setStatus(userId: number, status: 'active' | 'suspended') {
    setError('');
    try {
      const response = await fetch(`/api/users/${userId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error || 'Failed to update status');
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">User Status Management</h1>
        <p className="mt-2 text-sm text-slate-600">Suspend or activate accounts while preserving user records.</p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <label className="sr-only" htmlFor="user-status-search">Search users</label>
          <input id="user-status-search" type="search" className="h-10 w-full max-w-sm rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Search users" value={query} onChange={(event) => setQuery(event.target.value)} />
          <label className="sr-only" htmlFor="user-status-filter">Filter status</label>
          <select id="user-status-filter" className="h-10 rounded-lg border border-slate-300 px-3 py-2 text-sm" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
        {error ? <p className="mt-3 text-sm text-rose-700">{error}</p> : null}

        <div className="mt-4 space-y-2">
          {filtered.length === 0 ? <p className="text-sm text-slate-600">No users found.</p> : filtered.map((row) => (
            <div key={row.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
              <div>
                <p className="font-semibold text-slate-900">{row.first_name} {row.last_name}</p>
                <p className="text-xs text-slate-600">{row.email} | {row.roles.join(', ') || 'no role'} | {row.status}</p>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setStatus(row.id, 'active')} className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs">Activate</button>
                <button type="button" onClick={() => setStatus(row.id, 'suspended')} className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs">Suspend</button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

