'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';

type Programme = {
  id: number;
  name: string;
  code: string;
  duration_years: number;
  degree_type: string;
  status: string;
  department_id: number;
  department_name?: string;
  faculty_name?: string;
};

type Department = { id: number; name: string; code: string };

export default function ProgrammesPage() {
  const [rows, setRows] = useState<Programme[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({
    name: '',
    code: '',
    departmentId: '',
    degreeType: 'bsc',
    durationYears: '4',
    status: 'active',
  });

  useEffect(() => {
    void loadData();
  }, []);

  async function loadData() {
    try {
      const [programmesRes, departmentsRes] = await Promise.all([
        fetch('/api/programmes', { cache: 'no-store' }),
        fetch('/api/departments', { cache: 'no-store' }),
      ]);

      const programmesPayload = (await programmesRes.json()) as Programme[] | { error?: string };
      const departmentsPayload = (await departmentsRes.json()) as Department[] | { error?: string };

      if (!programmesRes.ok) throw new Error((programmesPayload as { error?: string }).error || 'Failed to load programmes');
      if (!departmentsRes.ok) throw new Error((departmentsPayload as { error?: string }).error || 'Failed to load departments');

      setRows(programmesPayload as Programme[]);
      setDepartments(departmentsPayload as Department[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load programmes');
    }
  }

  const filtered = useMemo(() => {
    return rows.filter((row) => {
      if (statusFilter !== 'all' && row.status !== statusFilter) return false;
      if (!query) return true;
      const term = query.toLowerCase();
      return (
        row.name.toLowerCase().includes(term) ||
        row.code.toLowerCase().includes(term) ||
        String(row.department_name ?? '').toLowerCase().includes(term) ||
        String(row.faculty_name ?? '').toLowerCase().includes(term)
      );
    });
  }, [rows, query, statusFilter]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/programmes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          code: form.code,
          department_id: Number(form.departmentId),
          degree_type: form.degreeType,
          duration_years: Number(form.durationYears),
          status: form.status,
        }),
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error || 'Failed to create programme');

      setForm({ name: '', code: '', departmentId: '', degreeType: 'bsc', durationYears: '4', status: 'active' });
      setSuccess('Programme created successfully.');
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create programme');
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(programmeId: number, nextStatus: 'active' | 'archived') {
    setError('');
    try {
      const response = await fetch(`/api/programmes/${programmeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error || 'Failed to update programme status');
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update programme status');
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Programme Management</h1>
        <p className="mt-2 text-sm text-slate-600">Create, search, and archive academic programmes by department.</p>
      </section>

      <form onSubmit={onSubmit} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-3">
        <input required className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Programme Name" value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} />
        <input required className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Programme Code" value={form.code} onChange={(event) => setForm((prev) => ({ ...prev, code: event.target.value }))} />
        <select required className="rounded-lg border border-slate-300 px-3 py-2 text-sm" value={form.departmentId} onChange={(event) => setForm((prev) => ({ ...prev, departmentId: event.target.value }))}>
          <option value="">Select Department</option>
          {departments.map((department) => (
            <option key={department.id} value={department.id}>{department.name} ({department.code})</option>
          ))}
        </select>
        <select className="rounded-lg border border-slate-300 px-3 py-2 text-sm" value={form.degreeType} onChange={(event) => setForm((prev) => ({ ...prev, degreeType: event.target.value }))}>
          <option value="bsc">BSc</option>
          <option value="ba">BA</option>
          <option value="hnd">HND</option>
          <option value="nd">ND</option>
          <option value="pgd">PGD</option>
          <option value="msc">MSc</option>
        </select>
        <input type="number" min="1" max="8" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Duration (Years)" value={form.durationYears} onChange={(event) => setForm((prev) => ({ ...prev, durationYears: event.target.value }))} />
        <select className="rounded-lg border border-slate-300 px-3 py-2 text-sm" value={form.status} onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value }))}>
          <option value="active">Active</option>
          <option value="archived">Archived</option>
        </select>
        <button disabled={loading} type="submit" className="md:col-span-3 rounded-lg bg-[#1A3A6B] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{loading ? 'Saving...' : 'Create Programme'}</button>
        {error ? <p className="md:col-span-3 text-sm text-rose-700">{error}</p> : null}
        {success ? <p className="md:col-span-3 text-sm text-emerald-700">{success}</p> : null}
      </form>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <input type="search" placeholder="Search programmes" className="h-10 w-full max-w-sm rounded-lg border border-slate-300 px-3 py-2 text-sm" value={query} onChange={(event) => setQuery(event.target.value)} />
          <select className="h-10 rounded-lg border border-slate-300 px-3 py-2 text-sm" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="all">All status</option>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        <div className="mt-4 space-y-2">
          {filtered.length === 0 ? <p className="text-sm text-slate-600">No programmes found.</p> : filtered.map((row) => (
            <div key={row.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
              <div>
                <p className="font-semibold text-slate-900">{row.name} ({row.code})</p>
                <p className="text-xs text-slate-600">{row.degree_type?.toUpperCase()} | {row.duration_years} years | {row.department_name || 'No department'} | {row.faculty_name || 'No faculty'} | {row.status}</p>
              </div>
              <button type="button" onClick={() => updateStatus(row.id, row.status === 'active' ? 'archived' : 'active')} className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700">
                {row.status === 'active' ? 'Archive' : 'Activate'}
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
