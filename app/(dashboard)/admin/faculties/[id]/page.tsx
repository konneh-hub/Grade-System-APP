'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

type FacultyPayload = {
  id: number;
  name: string;
  code: string;
  description?: string;
  departments_count?: number;
};

export default function Page() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const facultyId = params?.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [departmentsCount, setDepartmentsCount] = useState(0);
  const [form, setForm] = useState({ name: '', code: '', description: '' });

  useEffect(() => {
    void loadFaculty();
  }, [facultyId]);

  async function loadFaculty() {
    if (!facultyId) return;
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/faculties/${facultyId}`, { cache: 'no-store' });
      const payload = (await response.json()) as FacultyPayload | { error?: string };
      if (!response.ok) throw new Error((payload as { error?: string }).error || 'Failed to load faculty');

      const faculty = payload as FacultyPayload;
      setForm({
        name: faculty.name || '',
        code: faculty.code || '',
        description: faculty.description || '',
      });
      setDepartmentsCount(Number(faculty.departments_count ?? 0));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load faculty');
    } finally {
      setLoading(false);
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!facultyId) return;

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`/api/faculties/${facultyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error || 'Failed to update faculty');
      setSuccess('Faculty updated successfully.');
      await loadFaculty();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update faculty');
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!facultyId) return;
    if (!window.confirm('Delete this faculty? This action cannot be undone.')) return;

    setDeleting(true);
    setError('');

    try {
      const response = await fetch(`/api/faculties/${facultyId}`, { method: 'DELETE' });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error || 'Failed to delete faculty');

      router.push('/admin/faculties');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete faculty');
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return <main className="p-6 text-sm text-slate-600">Loading faculty details...</main>;
  }

  return (
    <main className="space-y-6 p-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Faculty detail</h1>
            <p className="mt-2 text-sm text-slate-600">Update faculty records and monitor linked departments.</p>
          </div>
          <Link href="/admin/faculties" className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700">
            Back to faculties
          </Link>
        </div>
        <p className="mt-3 text-xs text-slate-500">Linked departments: {departmentsCount}</p>
      </section>

      <form onSubmit={onSubmit} className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-2">
        <label className="text-sm">Faculty name<input required className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} /></label>
        <label className="text-sm">Faculty code<input required className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={form.code} onChange={(event) => setForm((prev) => ({ ...prev, code: event.target.value }))} /></label>
        <label className="text-sm md:col-span-2">Description<textarea rows={3} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={form.description} onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))} /></label>

        <div className="md:col-span-2 flex flex-wrap items-center gap-3">
          <button disabled={saving} type="submit" className="rounded-lg bg-[#1A3A6B] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{saving ? 'Saving...' : 'Save changes'}</button>
          <button disabled={deleting} type="button" onClick={onDelete} className="rounded-lg border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 disabled:opacity-60">{deleting ? 'Deleting...' : 'Delete faculty'}</button>
          {success ? <p className="text-sm text-emerald-700">{success}</p> : null}
          {error ? <p className="text-sm text-rose-700">{error}</p> : null}
        </div>
      </form>
    </main>
  );
}
