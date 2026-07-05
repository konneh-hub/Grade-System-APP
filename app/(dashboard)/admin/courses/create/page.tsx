'use client';

import { FormEvent, useState } from 'react';

export default function Page() {
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    code: '',
    title: '',
    credit: '3',
    level: 'year1',
    department: '',
    programme: '',
    semester: 'first',
    status: 'active',
  });

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSaved(true);
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Create Course</h1>
        <p className="mt-2 text-sm text-slate-600">Admin creates courses. HoD assigns lecturers separately.</p>
      </section>

      <form onSubmit={onSubmit} className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-2">
        <label className="text-sm">Course Code<input required className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={form.code} onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value }))} /></label>
        <label className="text-sm">Course Title<input required className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={form.title} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} /></label>
        <label className="text-sm">Credit Unit<input required type="number" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={form.credit} onChange={(e) => setForm((prev) => ({ ...prev, credit: e.target.value }))} /></label>
        <label className="text-sm">Academic level<select className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={form.level} onChange={(e) => setForm((prev) => ({ ...prev, level: e.target.value }))}><option value="year1">Year 1</option><option value="year2">Year 2</option><option value="year3">Year 3</option><option value="year4">Year 4</option><option value="year5">Year 5</option></select></label>
        <label className="text-sm">Department<input required className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={form.department} onChange={(e) => setForm((prev) => ({ ...prev, department: e.target.value }))} /></label>
        <label className="text-sm">Programme<input required className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={form.programme} onChange={(e) => setForm((prev) => ({ ...prev, programme: e.target.value }))} /></label>
        <label className="text-sm">Semester<select className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={form.semester} onChange={(e) => setForm((prev) => ({ ...prev, semester: e.target.value }))}><option value="first">First</option><option value="second">Second</option><option value="summer">Summer</option></select></label>
        <label className="text-sm">Status<select className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={form.status} onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}><option value="active">Active</option><option value="inactive">Inactive</option></select></label>
        <button type="submit" className="md:col-span-2 rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white">Save Course</button>
        {saved ? <p className="md:col-span-2 text-sm text-emerald-700">Course saved. Delete action remains restricted if enrolled students exist.</p> : null}
      </form>
    </div>
  );
}
