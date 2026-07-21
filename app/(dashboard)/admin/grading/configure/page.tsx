'use client';

import Link from 'next/link';
import { useCallback, FormEvent, useEffect, useState } from 'react';

type DepartmentOption = { id: number; name: string; code: string };
type SessionOption = { id: number; name: string };

type GradingConfiguration = {
  id: number;
  department_name: string | null;
  session_name: string | null;
  grade_scale: string;
  pass_mark: number;
  ca_weight: number;
  exam_weight: number;
  created_at: string;
};

export default function Page() {
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [sessions, setSessions] = useState<SessionOption[]>([]);
  const [rows, setRows] = useState<GradingConfiguration[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({
    departmentId: '',
    sessionId: '',
    gradeScale: 'standard',
    passMark: '40',
    caWeight: '0.4',
    examWeight: '0.6',
  });

  const loadAll = useCallback(async () => {
    setError('');
    try {
      const [deptRes, sessionsRes, configRes] = await Promise.all([
        fetch('/api/departments', { cache: 'no-store' }),
        fetch('/api/academic-sessions', { cache: 'no-store' }),
        fetch('/api/grading/configure', { cache: 'no-store' }),
      ]);

      const departmentsPayload = (await deptRes.json()) as DepartmentOption[] | { error?: string };
      const sessionsPayload = (await sessionsRes.json()) as { data?: SessionOption[]; error?: string };
      const configsPayload = (await configRes.json()) as GradingConfiguration[] | { error?: string };

      if (!deptRes.ok) throw new Error((departmentsPayload as { error?: string }).error || 'Failed to load departments');
      if (!sessionsRes.ok) throw new Error(sessionsPayload.error || 'Failed to load academic sessions');
      if (!configRes.ok) throw new Error((configsPayload as { error?: string }).error || 'Failed to load grading configurations');

      setDepartments(departmentsPayload as DepartmentOption[]);
      setSessions(sessionsPayload.data || []);
      setRows(configsPayload as GradingConfiguration[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load grading configuration data');
    }
  }, []);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/grading/configure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          department_id: Number(form.departmentId),
          academic_session_id: Number(form.sessionId),
          grade_scale: form.gradeScale,
          pass_mark: Number(form.passMark),
          ca_weight: Number(form.caWeight),
          exam_weight: Number(form.examWeight),
        }),
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error || 'Failed to save configuration');

      setSuccess('Grading configuration saved successfully.');
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save grading configuration');
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="space-y-6 p-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Configure grading rules</h1>
            <p className="mt-2 text-sm text-slate-600">Create grading configurations tied to department and academic session.</p>
          </div>
          <Link href="/admin/grading" className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700">Back to grading</Link>
        </div>
      </section>

      <form onSubmit={onSubmit} className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-2">
        <label className="text-sm">Department<select required className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={form.departmentId} onChange={(event) => setForm((prev) => ({ ...prev, departmentId: event.target.value }))}><option value="">Select department</option>{departments.map((department) => <option key={department.id} value={department.id}>{department.name} ({department.code})</option>)}</select></label>
        <label className="text-sm">Academic session<select required className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={form.sessionId} onChange={(event) => setForm((prev) => ({ ...prev, sessionId: event.target.value }))}><option value="">Select session</option>{sessions.map((session) => <option key={session.id} value={session.id}>{session.name}</option>)}</select></label>
        <label className="text-sm">Grade scale<input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={form.gradeScale} onChange={(event) => setForm((prev) => ({ ...prev, gradeScale: event.target.value }))} /></label>
        <label className="text-sm">Pass mark<input required type="number" min="0" max="100" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={form.passMark} onChange={(event) => setForm((prev) => ({ ...prev, passMark: event.target.value }))} /></label>
        <label className="text-sm">CA weight<input required type="number" step="0.01" min="0" max="1" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={form.caWeight} onChange={(event) => setForm((prev) => ({ ...prev, caWeight: event.target.value }))} /></label>
        <label className="text-sm">Exam weight<input required type="number" step="0.01" min="0" max="1" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={form.examWeight} onChange={(event) => setForm((prev) => ({ ...prev, examWeight: event.target.value }))} /></label>

        <div className="md:col-span-2 flex items-center gap-3">
          <button disabled={saving} type="submit" className="rounded-lg bg-[#1A3A6B] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{saving ? 'Saving...' : 'Save configuration'}</button>
          {success ? <p className="text-sm text-emerald-700">{success}</p> : null}
          {error ? <p className="text-sm text-rose-700">{error}</p> : null}
        </div>
      </form>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Saved configurations</h2>
        <div className="mt-3 space-y-2">
          {rows.length === 0 ? (
            <p className="text-sm text-slate-600">No grading configurations saved yet.</p>
          ) : (
            rows.map((row) => (
              <div key={row.id} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                {row.department_name || 'All departments'} | {row.session_name || 'No session'} | Scale: {row.grade_scale} | Pass: {row.pass_mark} | CA/Exam: {row.ca_weight}/{row.exam_weight}
              </div>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
