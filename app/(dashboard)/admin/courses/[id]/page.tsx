'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

type DepartmentOption = { id: number; name: string; code: string };

type CoursePayload = {
  id: number;
  code: string;
  title: string;
  credit_units: number;
  level: string;
  semester: string;
  department_id: number | null;
  department_name?: string;
};

function normalizeLevelValue(value: string | number | null | undefined): string {
  const raw = String(value ?? 'year1').trim().toLowerCase();
  const mapping: Record<string, string> = {
    year1: 'year1',
    year2: 'year2',
    year3: 'year3',
    year4: 'year4',
    year5: 'year5',
    '100': 'year1',
    '200': 'year2',
    '300': 'year3',
    '400': 'year4',
    '500': 'year5',
    '1': 'year1',
    '2': 'year2',
    '3': 'year3',
    '4': 'year4',
    '5': 'year5',
  };

  return mapping[raw] ?? 'year1';
}

export default function Page() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const courseId = params?.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [form, setForm] = useState({
    code: '',
    title: '',
    creditUnits: '3',
    level: 'year1',
    semester: 'first',
    departmentId: '',
  });

  useEffect(() => {
    void loadData();
  }, [courseId]);

  async function loadData() {
    if (!courseId) return;
    setLoading(true);
    setError('');

    try {
      const [courseRes, deptRes] = await Promise.all([
        fetch(`/api/courses/${courseId}`, { cache: 'no-store' }),
        fetch('/api/departments', { cache: 'no-store' }),
      ]);

      const coursePayload = (await courseRes.json()) as CoursePayload | { error?: string };
      const departmentsPayload = (await deptRes.json()) as DepartmentOption[] | { error?: string };

      if (!courseRes.ok) throw new Error((coursePayload as { error?: string }).error || 'Failed to load course');
      if (!deptRes.ok) throw new Error((departmentsPayload as { error?: string }).error || 'Failed to load departments');

      const course = coursePayload as CoursePayload;
      const allDepartments = departmentsPayload as DepartmentOption[];

      setDepartments(allDepartments);
      setForm({
        code: course.code || '',
        title: course.title || '',
        creditUnits: String(course.credit_units ?? 3),
        level: normalizeLevelValue(course.level),
        semester: String(course.semester ?? 'first'),
        departmentId: course.department_id != null ? String(course.department_id) : '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load course');
    } finally {
      setLoading(false);
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!courseId) return;

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`/api/courses/${courseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: form.code,
          title: form.title,
          unit: Number(form.creditUnits),
          level: form.level,
          semester: form.semester,
          department_id: form.departmentId ? Number(form.departmentId) : null,
        }),
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error || 'Failed to update course');

      setSuccess('Course updated successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update course');
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!courseId) return;
    if (!window.confirm('Delete this course? This action cannot be undone.')) return;

    setDeleting(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`/api/courses/${courseId}`, { method: 'DELETE' });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error || 'Failed to delete course');

      router.push('/admin/courses');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete course');
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return <main className="p-6 text-sm text-slate-600">Loading course details...</main>;
  }

  return (
    <main className="space-y-6 p-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Course detail</h1>
            <p className="mt-2 text-sm text-slate-600">Update course catalog metadata and assignment context.</p>
          </div>
          <Link href="/admin/courses" className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700">
            Back to courses
          </Link>
        </div>
      </section>

      <form onSubmit={onSubmit} className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-2">
        <label className="text-sm">Course code<input required className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={form.code} onChange={(event) => setForm((prev) => ({ ...prev, code: event.target.value }))} /></label>
        <label className="text-sm">Course title<input required className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={form.title} onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))} /></label>
        <label className="text-sm">Credit units<input required type="number" min="1" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={form.creditUnits} onChange={(event) => setForm((prev) => ({ ...prev, creditUnits: event.target.value }))} /></label>
        <label className="text-sm">Academic level<select className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={form.level} onChange={(event) => setForm((prev) => ({ ...prev, level: event.target.value }))}><option value="year1">Year 1</option><option value="year2">Year 2</option><option value="year3">Year 3</option><option value="year4">Year 4</option><option value="year5">Year 5</option></select></label>
        <label className="text-sm">Semester<select className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={form.semester} onChange={(event) => setForm((prev) => ({ ...prev, semester: event.target.value }))}><option value="first">First</option><option value="second">Second</option><option value="third">Third</option></select></label>
        <label className="text-sm">Department<select className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={form.departmentId} onChange={(event) => setForm((prev) => ({ ...prev, departmentId: event.target.value }))}><option value="">Unassigned</option>{departments.map((department) => <option key={department.id} value={department.id}>{department.name} ({department.code})</option>)}</select></label>

        <div className="md:col-span-2 flex flex-wrap items-center gap-3">
          <button disabled={saving} type="submit" className="rounded-lg bg-[#1A3A6B] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{saving ? 'Saving...' : 'Save changes'}</button>
          <button disabled={deleting} type="button" onClick={onDelete} className="rounded-lg border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 disabled:opacity-60">{deleting ? 'Deleting...' : 'Delete course'}</button>
          {success ? <p className="text-sm text-emerald-700">{success}</p> : null}
          {error ? <p className="text-sm text-rose-700">{error}</p> : null}
        </div>
      </form>
    </main>
  );
}
