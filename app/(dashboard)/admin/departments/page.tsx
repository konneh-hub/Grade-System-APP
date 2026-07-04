'use client';

import { FormEvent, useEffect, useState } from 'react';

type Department = {
  id: number;
  name: string;
  code: string;
  faculty_name: string;
  description?: string;
};

type FacultyOption = { id: number; name: string; code: string };

export default function Page() {
  const [rows, setRows] = useState<Department[]>([]);
  const [faculties, setFaculties] = useState<FacultyOption[]>([]);
  const [form, setForm] = useState({ name: '', code: '', faculty_id: '', description: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void fetchAll();
  }, []);

  async function fetchAll() {
    try {
      const [deptRes, facRes] = await Promise.all([
        fetch('/api/departments', { cache: 'no-store' }),
        fetch('/api/faculties', { cache: 'no-store' }),
      ]);
      const deptPayload = (await deptRes.json()) as Department[] | { error?: string };
      const facPayload = (await facRes.json()) as FacultyOption[] | { error?: string };
      if (!deptRes.ok) throw new Error((deptPayload as { error?: string }).error || 'Failed to load departments');
      if (!facRes.ok) throw new Error((facPayload as { error?: string }).error || 'Failed to load faculties');

      setRows(deptPayload as Department[]);
      setFaculties(facPayload as FacultyOption[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load department data');
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setSuccess('');
    if (!form.faculty_id) {
      setError('Faculty is required before department creation.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          code: form.code,
          faculty_id: Number(form.faculty_id),
          description: form.description,
        }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error || 'Failed to create department');

      setSuccess('Department created successfully.');
      setForm({ name: '', code: '', faculty_id: '', description: '' });
      await fetchAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create department');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Department Management</h1>
        <p className="mt-2 text-sm text-slate-600">Faculty is mandatory and departments are persisted through API endpoints.</p>
      </section>

      <form onSubmit={onSubmit} className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-2">
        <label className="text-sm">Department Name<input required className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} /></label>
        <label className="text-sm">Department Code<input required className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={form.code} onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value }))} /></label>
        <label className="text-sm">Faculty<select required className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={form.faculty_id} onChange={(e) => setForm((prev) => ({ ...prev, faculty_id: e.target.value }))}><option value="">Select faculty</option>{faculties.map((faculty) => <option key={faculty.id} value={faculty.id}>{faculty.name} ({faculty.code})</option>)}</select></label>
        <label className="md:col-span-2 text-sm">Description<textarea className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" rows={3} value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} /></label>
        <button disabled={loading} type="submit" className="rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70">{loading ? 'Saving...' : 'Save Department'}</button>
        {error ? <p className="md:col-span-2 text-sm text-rose-700">{error}</p> : null}
        {success ? <p className="md:col-span-2 text-sm text-emerald-700">{success}</p> : null}
      </form>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Departments</h2>
        <div className="mt-3 space-y-2">
          {rows.length === 0 ? <p className="text-sm text-slate-600">No departments yet.</p> : rows.map((row) => (
            <div key={row.id} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
              {row.name} ({row.code}) - {row.faculty_name}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
