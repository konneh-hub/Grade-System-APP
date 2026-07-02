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
    externalId: '',
    password: '',
    status: 'active',
  });
  const [statusMessage, setStatusMessage] = useState('');

  const showAcademicFields = useMemo(() => form.role !== 'admin', [form.role]);
  const showProgramme = useMemo(() => form.role === 'student', [form.role]);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    setStatusMessage(`User ${form.firstName} ${form.lastName} prepared successfully with role ${form.role}.`);
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
        <label className="text-sm">Staff ID / Student ID<input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={form.externalId} onChange={(e) => setForm((prev) => ({ ...prev, externalId: e.target.value }))} /></label>
        <label className="text-sm">Password<input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={form.password} onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))} placeholder="Leave blank to auto-generate" /></label>
        <label className="text-sm">Status<select className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={form.status} onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}><option value="active">Active</option><option value="suspended">Suspended</option></select></label>

        <div className="md:col-span-2 flex items-center gap-3">
          <button type="submit" className="rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white">Save User</button>
          <button type="button" className="rounded-lg border border-slate-300 px-4 py-2 text-sm">Reset Password</button>
          <button type="button" className="rounded-lg border border-rose-300 px-4 py-2 text-sm text-rose-700">Suspend User</button>
        </div>
        {statusMessage ? <p className="md:col-span-2 text-sm text-emerald-700">{statusMessage}</p> : null}
      </form>
    </div>
  );
}
