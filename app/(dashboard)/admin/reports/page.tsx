'use client';

import { FormEvent, useState } from 'react';

const reports = [
  { title: 'Student summary', description: 'Track student participation and result activity.', status: 'Available' },
  { title: 'Staff activity', description: 'See recent administrative and academic engagement.', status: 'Available' },
  { title: 'Academic performance', description: 'Review grade trends and published results.', status: 'In progress' },
];

export default function Page() {
  const [message, setMessage] = useState('');
  const [filters, setFilters] = useState({ type: 'users', from: '', to: '', format: 'pdf' });

  function onGenerate(event: FormEvent) {
    event.preventDefault();
    setMessage(`Report queued: ${filters.type} (${filters.format.toUpperCase()})`);
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#2563EB]">Administration</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">Reports and insights</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
          Monitor the academic platform with a set of generated reports and operational summaries.
        </p>
      </section>

      <form onSubmit={onGenerate} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-4">
        <label className="text-sm">Report Type<select className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={filters.type} onChange={(e) => setFilters((prev) => ({ ...prev, type: e.target.value }))}><option value="users">Users</option><option value="courses">Courses</option><option value="faculty">Faculty</option><option value="activity">Activity</option></select></label>
        <label className="text-sm">From<input type="date" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={filters.from} onChange={(e) => setFilters((prev) => ({ ...prev, from: e.target.value }))} /></label>
        <label className="text-sm">To<input type="date" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={filters.to} onChange={(e) => setFilters((prev) => ({ ...prev, to: e.target.value }))} /></label>
        <label className="text-sm">Format<select className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={filters.format} onChange={(e) => setFilters((prev) => ({ ...prev, format: e.target.value }))}><option value="pdf">PDF</option><option value="excel">Excel</option><option value="csv">CSV</option></select></label>
        <button type="submit" className="md:col-span-4 rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white">Generate Report</button>
        {message ? <p className="md:col-span-4 text-sm text-emerald-700">{message}</p> : null}
      </form>

      <section className="grid gap-4 md:grid-cols-3">
        {reports.map((report) => (
          <div key={report.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">{report.title}</h2>
            <p className="mt-2 text-sm text-slate-600">{report.description}</p>
            <p className="mt-4 inline-flex rounded-full bg-[#EFF6FF] px-3 py-1 text-sm font-medium text-[#2563EB]">{report.status}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
