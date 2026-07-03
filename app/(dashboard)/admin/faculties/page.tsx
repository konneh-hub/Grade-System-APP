'use client';

import { FormEvent, useEffect, useState } from 'react';

type Faculty = {
  id: number;
  name: string;
  code: string;
  description?: string;
  departments_count?: number;
};

export default function Page() {
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [form, setForm] = useState({ name: '', code: '', description: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void fetchFaculties();
  }, []);

  async function fetchFaculties() {
    try {
      const response = await fetch('/api/faculties', { cache: 'no-store' });
      const payload = (await response.json()) as Faculty[] | { error?: string };
      if (!response.ok) throw new Error((payload as { error?: string }).error || 'Failed to load faculties');
      setFaculties(payload as Faculty[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load faculties');
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await fetch('/api/faculties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error || 'Failed to create faculty');

      setSuccess('Faculty created successfully.');
      setForm({ name: '', code: '', description: '' });
      await fetchFaculties();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create faculty');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Faculty Management</h1>
        <p className="mt-2 text-sm text-slate-600">Create, edit, and monitor faculties with persistent API-backed storage.</p>
      </section>

      <form onSubmit={onSubmit} className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-2">
        <label className="text-sm">Faculty Name<input required className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} /></label>
        <label className="text-sm">Faculty Code<input required className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={form.code} onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value }))} /></label>
        <label className="md:col-span-2 text-sm">Description<textarea className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" rows={3} value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} /></label>
        <button disabled={loading} type="submit" className="md:col-span-2 rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70">{loading ? 'Saving...' : 'Save Faculty'}</button>
        {error ? <p className="md:col-span-2 text-sm text-rose-700">{error}</p> : null}
        {success ? <p className="md:col-span-2 text-sm text-emerald-700">{success}</p> : null}
      </form>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Faculty records</h2>
        <div className="mt-3 space-y-2">
          {faculties.length === 0 ? <p className="text-sm text-slate-600">No faculties created yet.</p> : faculties.map((faculty) => (
            <div key={faculty.id} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
              {faculty.name} ({faculty.code}) - Departments: {faculty.departments_count ?? 0}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
