'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

type Role = 'admin' | 'lecturer' | 'hod' | 'dean' | 'exam_officer' | 'student';

type UserPayload = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  status: string;
  roles: string[];
};

export default function Page() {
  const params = useParams<{ id: string }>();
  const userId = params?.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tokenFeedback, setTokenFeedback] = useState<{ token: string; expiresAt: string | null } | null>(null);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    status: 'active',
    role: 'student' as Role,
    reopenRegistration: false,
    studentId: '',
    faculty: '',
    department: '',
    academicLevel: 'year1',
  });

  const isStudent = useMemo(() => form.role === 'student', [form.role]);
  const isStaffTokenRole = useMemo(() => ['lecturer', 'hod', 'dean', 'exam_officer'].includes(form.role), [form.role]);

  useEffect(() => {
    if (!userId) return;
    void loadUser();
  }, [userId]);

  async function loadUser() {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/users/${userId}`, { cache: 'no-store' });
      const payload = (await response.json()) as UserPayload | { error?: string };
      if (!response.ok) throw new Error((payload as { error?: string }).error || 'Failed to load user');
      const user = payload as UserPayload;
      const primaryRole = (user.roles?.[0] || 'student') as Role;
      setForm((prev) => ({
        ...prev,
        firstName: user.first_name || '',
        lastName: user.last_name || '',
        phone: user.phone || '',
        status: user.status || 'active',
        role: primaryRole,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load user');
    } finally {
      setLoading(false);
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    setTokenFeedback(null);

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: form.firstName,
          last_name: form.lastName,
          phone: form.phone,
          status: form.status,
          role: form.role,
          reopen_registration: form.reopenRegistration,
          student_id: isStudent ? form.studentId : undefined,
          faculty: isStudent ? form.faculty : undefined,
          department: isStudent ? form.department : undefined,
          academic_level: isStudent ? form.academicLevel : undefined,
        }),
      });

      const payload = (await response.json()) as {
        ok?: boolean;
        error?: string;
        registration_token?: string | null;
        registration_expires_at?: string | null;
      };

      if (!response.ok) throw new Error(payload.error || 'Failed to update user');
      setSuccess('User updated successfully.');

      if (payload.registration_token) {
        setTokenFeedback({
          token: payload.registration_token,
          expiresAt: payload.registration_expires_at ?? null,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user');
    } finally {
      setSaving(false);
    }
  }

  async function copyToken() {
    if (!tokenFeedback?.token) return;
    await navigator.clipboard.writeText(tokenFeedback.token);
    setSuccess('Token copied to clipboard.');
  }

  if (loading) {
    return (
      <main className="p-6">
        <p className="text-sm text-slate-600">Loading user profile...</p>
      </main>
    );
  }

  return (
    <main className="space-y-6 p-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Edit User</h1>
            <p className="mt-2 text-sm text-slate-600">Update user information and optionally reopen registration from admin panel.</p>
          </div>
          <Link href="/admin/users" className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700">
            Back to users
          </Link>
        </div>
      </section>

      <form onSubmit={onSubmit} className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-2">
        <label className="text-sm">First Name<input required className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={form.firstName} onChange={(e) => setForm((prev) => ({ ...prev, firstName: e.target.value }))} /></label>
        <label className="text-sm">Last Name<input required className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={form.lastName} onChange={(e) => setForm((prev) => ({ ...prev, lastName: e.target.value }))} /></label>
        <label className="text-sm">Phone Number<input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={form.phone} onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))} /></label>
        <label className="text-sm">Status<select className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={form.status} onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}><option value="active">Active</option><option value="suspended">Suspended</option><option value="pending">Pending</option></select></label>
        <label className="text-sm">Role<select className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={form.role} onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value as Role }))}><option value="admin">Admin</option><option value="lecturer">Lecturer</option><option value="hod">HoD</option><option value="dean">Dean</option><option value="exam_officer">Exam Officer</option><option value="student">Student</option></select></label>

        {isStudent ? <label className="text-sm">Student ID<input required={form.reopenRegistration} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={form.studentId} onChange={(e) => setForm((prev) => ({ ...prev, studentId: e.target.value }))} /></label> : null}
        {isStudent ? <label className="text-sm">Faculty<input required={form.reopenRegistration} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={form.faculty} onChange={(e) => setForm((prev) => ({ ...prev, faculty: e.target.value }))} /></label> : null}
        {isStudent ? <label className="text-sm">Department<input required={form.reopenRegistration} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={form.department} onChange={(e) => setForm((prev) => ({ ...prev, department: e.target.value }))} /></label> : null}
        {isStudent ? <label className="text-sm">Academic Level<select className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={form.academicLevel} onChange={(e) => setForm((prev) => ({ ...prev, academicLevel: e.target.value }))}><option value="year1">Year 1</option><option value="year2">Year 2</option><option value="year3">Year 3</option><option value="year4">Year 4</option><option value="year5">Year 5</option></select></label> : null}

        <label className="md:col-span-2 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={form.reopenRegistration}
            onChange={(e) => setForm((prev) => ({ ...prev, reopenRegistration: e.target.checked }))}
            className="h-4 w-4 rounded border-slate-300"
          />
          Re-enable registration after this update.
        </label>
        {isStaffTokenRole && form.reopenRegistration ? <p className="md:col-span-2 text-xs text-slate-600">A new registration token will be generated after save.</p> : null}
        {isStudent && form.reopenRegistration ? <p className="md:col-span-2 text-xs text-slate-600">Student registration will require Student ID, full name, faculty, department, and academic level to match.</p> : null}

        <div className="md:col-span-2 flex items-center gap-3">
          <button type="submit" disabled={saving} className="rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{saving ? 'Saving...' : 'Save Changes'}</button>
          {success ? <p className="text-sm text-emerald-700">{success}</p> : null}
          {error ? <p className="text-sm text-rose-700">{error}</p> : null}
        </div>

        {tokenFeedback ? (
          <div className="md:col-span-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
            <p className="font-semibold">New registration token generated</p>
            <p className="mt-1"><span className="font-medium">Token:</span> {tokenFeedback.token}</p>
            {tokenFeedback.expiresAt ? <p><span className="font-medium">Expires:</span> {new Date(tokenFeedback.expiresAt).toLocaleString()}</p> : null}
            <button type="button" onClick={copyToken} className="mt-3 rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700">Copy token</button>
          </div>
        ) : null}
      </form>
    </main>
  );
}
