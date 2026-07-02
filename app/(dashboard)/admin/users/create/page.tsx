'use client';

import { FormEvent, useMemo, useState } from 'react';

type Role = 'admin' | 'lecturer' | 'hod' | 'dean' | 'exam_officer' | 'student';

export default function Page() {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    gender: 'male',
    role: 'student' as Role,
    faculty: '',
    department: '',
    programme: '',
    academicLevel: 'year1',
    externalId: '',
    password: '',
    status: 'active',
    generateRegistrationToken: true,
  });
  const [statusMessage, setStatusMessage] = useState('');
  const [createdUserId, setCreatedUserId] = useState<number | null>(null);
  const [registrationInfo, setRegistrationInfo] = useState<{ email: string; token: string; expiresAt?: string | null } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRegeneratingToken, setIsRegeneratingToken] = useState(false);

  const showAcademicFields = useMemo(() => form.role !== 'admin', [form.role]);
  const showProgramme = useMemo(() => form.role === 'student', [form.role]);
  const isStaffTokenRole = useMemo(() => ['lecturer', 'hod', 'dean', 'exam_officer'].includes(form.role), [form.role]);

  async function copyToken() {
    if (!registrationInfo?.token) return;
    await navigator.clipboard.writeText(registrationInfo.token);
    setStatusMessage('Registration token copied to clipboard.');
  }

  async function regenerateToken() {
    if (!createdUserId) return;
    setIsRegeneratingToken(true);
    try {
      const response = await fetch(`/api/users/${createdUserId}/registration-token`, { method: 'POST' });
      const payload = (await response.json()) as { error?: string; registration_token?: string; registration_expires_at?: string | null };
      if (!response.ok || !payload.registration_token) {
        setStatusMessage(payload.error ?? 'Unable to regenerate token.');
        return;
      }
      setRegistrationInfo((prev) =>
        prev
          ? { ...prev, token: payload.registration_token as string, expiresAt: payload.registration_expires_at ?? null }
          : null
      );
      setStatusMessage('Registration token regenerated successfully.');
    } finally {
      setIsRegeneratingToken(false);
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    setStatusMessage('');

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          first_name: form.firstName,
          last_name: form.lastName,
          phone: form.phone,
          role: form.role,
          status: form.status,
          password: form.password,
          generate_registration_token: isStaffTokenRole,
          student_id: form.role === 'student' ? form.externalId : undefined,
          faculty: form.role === 'student' ? form.faculty : undefined,
          department: form.role === 'student' ? form.department : undefined,
          academic_level: form.role === 'student' ? form.academicLevel : undefined,
        }),
      });

      const payload = (await response.json()) as {
        error?: string;
        id?: number;
        generated_password?: string | null;
        registration_token?: string | null;
        registration_expires_at?: string | null;
      };
      if (!response.ok) {
        setStatusMessage(payload.error ?? 'Unable to create user.');
        return;
      }

      const generatedInfo = payload.generated_password ? ` Generated password: ${payload.generated_password}` : '';
      setStatusMessage(`User ${form.firstName} ${form.lastName} created successfully.${generatedInfo}`);
      setCreatedUserId(typeof payload.id === 'number' ? payload.id : null);
      setRegistrationInfo(
        payload.registration_token
          ? { email: form.email, token: payload.registration_token, expiresAt: payload.registration_expires_at ?? null }
          : null
      );
      setForm({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        gender: 'male',
        role: 'student',
        faculty: '',
        department: '',
        programme: '',
        academicLevel: 'year1',
        externalId: '',
        password: '',
        status: 'active',
        generateRegistrationToken: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Create or Edit User</h1>
        <p className="mt-2 text-sm text-slate-600">Role-aware form with reset and suspension controls.</p>
      </section>

      <form onSubmit={onSubmit} className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-2">
        <label className="text-sm">First Name<input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={form.firstName} onChange={(e) => setForm((prev) => ({ ...prev, firstName: e.target.value }))} required /></label>
        <label className="text-sm">Last Name<input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={form.lastName} onChange={(e) => setForm((prev) => ({ ...prev, lastName: e.target.value }))} required /></label>
        <label className="text-sm">Email<input type="email" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={form.email} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} required /></label>
        <label className="text-sm">Phone Number<input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={form.phone} onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))} /></label>
        <label className="text-sm">Gender<select className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={form.gender} onChange={(e) => setForm((prev) => ({ ...prev, gender: e.target.value }))}><option value="male">Male</option><option value="female">Female</option></select></label>
        <label className="text-sm">Role<select className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={form.role} onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value as Role }))}><option value="admin">Admin</option><option value="lecturer">Lecturer</option><option value="hod">HoD</option><option value="dean">Dean</option><option value="exam_officer">Exam Officer</option><option value="student">Student</option></select></label>
        {showAcademicFields ? <label className="text-sm">Faculty<input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={form.faculty} onChange={(e) => setForm((prev) => ({ ...prev, faculty: e.target.value }))} /></label> : null}
        {showAcademicFields ? <label className="text-sm">Department<input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={form.department} onChange={(e) => setForm((prev) => ({ ...prev, department: e.target.value }))} /></label> : null}
        {showProgramme ? <label className="text-sm">Programme<input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={form.programme} onChange={(e) => setForm((prev) => ({ ...prev, programme: e.target.value }))} /></label> : null}
        {showProgramme ? <label className="text-sm">Academic Level<select className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={form.academicLevel} onChange={(e) => setForm((prev) => ({ ...prev, academicLevel: e.target.value }))}><option value="year1">Year 1</option><option value="year2">Year 2</option><option value="year3">Year 3</option><option value="year4">Year 4</option><option value="year5">Year 5</option></select></label> : null}
        <label className="text-sm">Staff ID / Student ID<input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={form.externalId} onChange={(e) => setForm((prev) => ({ ...prev, externalId: e.target.value }))} /></label>
        <label className="text-sm">Password<input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={form.password} onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))} placeholder="Leave blank to auto-generate" /></label>
        <label className="text-sm">Status<select className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={form.status} onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}><option value="active">Active</option><option value="suspended">Suspended</option></select></label>
        <label className="md:col-span-2 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={isStaffTokenRole}
            onChange={(e) => setForm((prev) => ({ ...prev, generateRegistrationToken: e.target.checked }))}
            disabled
            className="h-4 w-4 rounded border-slate-300"
          />
          Registration token is automatically enforced for HoD, Dean, Exam Officer, and Lecturer.
        </label>
        {form.role === 'student' ? <p className="md:col-span-2 text-xs text-slate-600">Students register without token using Student ID, Email, Full Name, Faculty, Department, and Academic Level.</p> : null}

        <div className="md:col-span-2 flex items-center gap-3">
          <button type="submit" disabled={isSubmitting} className="rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{isSubmitting ? 'Saving...' : 'Save User'}</button>
          <button type="button" className="rounded-lg border border-slate-300 px-4 py-2 text-sm">Reset Password</button>
          <button type="button" className="rounded-lg border border-rose-300 px-4 py-2 text-sm text-rose-700">Suspend User</button>
        </div>
        {statusMessage ? <p className="md:col-span-2 text-sm text-slate-800">{statusMessage}</p> : null}
        {registrationInfo ? (
          <div className="md:col-span-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
            <p className="font-semibold">Registration token generated successfully</p>
            <p className="mt-1">Share these details with the user to complete registration:</p>
            <p className="mt-2"><span className="font-medium">Email:</span> {registrationInfo.email}</p>
            <p><span className="font-medium">Token:</span> {registrationInfo.token}</p>
            {registrationInfo.expiresAt ? <p><span className="font-medium">Expires:</span> {new Date(registrationInfo.expiresAt).toLocaleString()}</p> : null}
            <div className="mt-3 flex items-center gap-2">
              <button type="button" onClick={copyToken} className="rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700">Copy token</button>
              <button type="button" onClick={regenerateToken} disabled={isRegeneratingToken || !createdUserId} className="rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 disabled:cursor-not-allowed disabled:opacity-60">{isRegeneratingToken ? 'Regenerating...' : 'Regenerate token'}</button>
            </div>
          </div>
        ) : null}
      </form>
    </div>
  );
}
