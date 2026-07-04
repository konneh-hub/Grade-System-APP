'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

type FacultyOption = { id: number; name: string; code: string };

type DepartmentPayload = {
  id: number;
  name: string;
  code: string;
  description?: string;
  faculty_id: number;
};

export default function Page() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const departmentId = params?.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [faculties, setFaculties] = useState<FacultyOption[]>([]);
  const [form, setForm] = useState({ name: '', code: '', description: '', facultyId: '' });

  useEffect(() => {
    void loadData();
  }, [departmentId]);

  async function loadData() {
    if (!departmentId) return;
    setLoading(true);
    setError('');

    try {
      const [departmentRes, facultiesRes] = await Promise.all([
        fetch(`/api/departments/${departmentId}`, { cache: 'no-store' }),
        fetch('/api/faculties', { cache: 'no-store' }),
      ]);

      const departmentPayload = (await departmentRes.json()) as DepartmentPayload | { error?: string };
      const facultiesPayload = (await facultiesRes.json()) as FacultyOption[] | { error?: string };

      if (!departmentRes.ok) throw new Error((departmentPayload as { error?: string }).error || 'Failed to load department');
      if (!facultiesRes.ok) throw new Error((facultiesPayload as { error?: string }).error || 'Failed to load faculties');

      const department = departmentPayload as DepartmentPayload;
      setFaculties(facultiesPayload as FacultyOption[]);
      setForm({
        name: department.name || '',
        code: department.code || '',
        description: department.description || '',
        facultyId: String(department.faculty_id || ''),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load department');
    } finally {
      setLoading(false);
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!departmentId) return;

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`/api/departments/${departmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          code: form.code,
          description: form.description,
          faculty_id: Number(form.facultyId),
        }),
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error || 'Failed to update department');
      setSuccess('Department updated successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update department');
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!departmentId) return;
    if (!window.confirm('Delete this department? This action cannot be undone.')) return;

    setDeleting(true);
    setError('');

    try {
      const response = await fetch(`/api/departments/${departmentId}`, { method: 'DELETE' });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error || 'Failed to delete department');

      router.push('/admin/departments');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete department');
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return <main className="p-6 text-sm text-slate-600">Loading department details...</main>;
  }

  return (
    <main className="space-y-6 p-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Department detail</h1>
            <p className="mt-2 text-sm text-slate-600">Edit department metadata and faculty linkage.</p>
          </div>
          <Link href="/admin/departments" className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700">
            Back to departments
          </Link>
        </div>
      </section>

      <form onSubmit={onSubmit} className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-2">
        <label className="text-sm">Department name<input required className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} /></label>
        <label className="text-sm">Department code<input required className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={form.code} onChange={(event) => setForm((prev) => ({ ...prev, code: event.target.value }))} /></label>
        <label className="text-sm">Faculty<select required className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={form.facultyId} onChange={(event) => setForm((prev) => ({ ...prev, facultyId: event.target.value }))}><option value="">Select faculty</option>{faculties.map((faculty) => <option key={faculty.id} value={faculty.id}>{faculty.name} ({faculty.code})</option>)}</select></label>
        <label className="text-sm md:col-span-2">Description<textarea rows={3} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={form.description} onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))} /></label>

        <div className="md:col-span-2 flex flex-wrap items-center gap-3">
          <button disabled={saving} type="submit" className="rounded-lg bg-[#1A3A6B] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{saving ? 'Saving...' : 'Save changes'}</button>
          <button disabled={deleting} type="button" onClick={onDelete} className="rounded-lg border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 disabled:opacity-60">{deleting ? 'Deleting...' : 'Delete department'}</button>
          {success ? <p className="text-sm text-emerald-700">{success}</p> : null}
          {error ? <p className="text-sm text-rose-700">{error}</p> : null}
        </div>
      </form>
    </main>
  );
}
