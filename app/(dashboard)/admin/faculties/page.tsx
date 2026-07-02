'use client';

import { FormEvent, useState } from 'react';

type Faculty = {
  id: number;
  name: string;
  code: string;
  dean: string;
  status: 'active' | 'inactive';
};

export default function Page() {
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [form, setForm] = useState({ name: '', code: '', dean: '', description: '', status: 'active' as 'active' | 'inactive' });

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    setFaculties((prev) => [
      { id: Date.now(), name: form.name, code: form.code, dean: form.dean || 'Unassigned', status: form.status },
      ...prev,
    ]);
    setForm({ name: '', code: '', dean: '', description: '', status: 'active' });
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Faculty Management</h1>
        <p className="mt-2 text-sm text-slate-600">Create, edit, and monitor faculties. Deans must be valid users with Dean role.</p>
      </section>

      <form onSubmit={onSubmit} className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-2">
        <label className="text-sm">Faculty Name<input required className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} /></label>
        <label className="text-sm">Faculty Code<input required className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={form.code} onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value }))} /></label>
        <label className="text-sm">Dean<select className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={form.dean} onChange={(e) => setForm((prev) => ({ ...prev, dean: e.target.value }))}><option value="">Select Dean</option><option value="Dr. Kamara">Dr. Kamara</option><option value="Prof. Sesay">Prof. Sesay</option></select></label>
        <label className="text-sm">Status<select className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={form.status} onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value as 'active' | 'inactive' }))}><option value="active">Active</option><option value="inactive">Inactive</option></select></label>
        <label className="md:col-span-2 text-sm">Description<textarea className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" rows={3} value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} /></label>
        <button type="submit" className="md:col-span-2 rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white">Save Faculty</button>
      </form>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Faculty records</h2>
        <div className="mt-3 space-y-2">
          {faculties.length === 0 ? <p className="text-sm text-slate-600">No faculties created yet.</p> : faculties.map((faculty) => (
            <div key={faculty.id} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
              {faculty.name} ({faculty.code}) - Dean: {faculty.dean} - {faculty.status}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
