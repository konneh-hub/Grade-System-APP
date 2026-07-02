'use client';

import { FormEvent, useState } from 'react';

type Department = {
  id: number;
  name: string;
  code: string;
  faculty: string;
  hod: string;
  status: 'active' | 'inactive';
};

export default function Page() {
  const [rows, setRows] = useState<Department[]>([]);
  const [form, setForm] = useState({ name: '', code: '', faculty: '', hod: '', status: 'active' as 'active' | 'inactive' });
  const [error, setError] = useState('');

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!form.faculty) {
      setError('Faculty is required before department creation.');
      return;
    }
    setError('');
    setRows((prev) => [{ id: Date.now(), ...form }, ...prev]);
    setForm({ name: '', code: '', faculty: '', hod: '', status: 'active' });
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Department Management</h1>
        <p className="mt-2 text-sm text-slate-600">Faculty is mandatory and HoD must be a valid HoD role user.</p>
      </section>

      <form onSubmit={onSubmit} className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-2">
        <label className="text-sm">Department Name<input required className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} /></label>
        <label className="text-sm">Department Code<input required className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={form.code} onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value }))} /></label>
        <label className="text-sm">Faculty<input required className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={form.faculty} onChange={(e) => setForm((prev) => ({ ...prev, faculty: e.target.value }))} /></label>
        <label className="text-sm">Head of Department<input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={form.hod} onChange={(e) => setForm((prev) => ({ ...prev, hod: e.target.value }))} /></label>
        <label className="text-sm">Status<select className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={form.status} onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value as 'active' | 'inactive' }))}><option value="active">Active</option><option value="inactive">Inactive</option></select></label>
        <button type="submit" className="rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white">Save Department</button>
        {error ? <p className="md:col-span-2 text-sm text-rose-700">{error}</p> : null}
      </form>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Departments</h2>
        <div className="mt-3 space-y-2">
          {rows.length === 0 ? <p className="text-sm text-slate-600">No departments yet.</p> : rows.map((row) => (
            <div key={row.id} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
              {row.name} ({row.code}) - {row.faculty} - HoD: {row.hod || 'Unassigned'}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
