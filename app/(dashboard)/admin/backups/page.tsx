'use client';

import { FormEvent, useState } from 'react';

export default function Page() {
  const [history, setHistory] = useState<Array<{ id: number; type: string; includeLogs: boolean; status: string }>>([]);

  function onBackup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const type = String(formData.get('type') ?? 'full');
    const includeLogs = formData.get('includeLogs') === 'on';
    setHistory((prev) => [{ id: Date.now(), type, includeLogs, status: 'Completed' }, ...prev]);
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Backup & Restore</h1>
        <p className="mt-2 text-sm text-slate-600">Create backups, restore selected backups, and track backup history.</p>
      </section>

      <form onSubmit={onBackup} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-3">
        <label className="text-sm">Backup Type<select name="type" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"><option value="full">Full</option><option value="partial">Partial</option></select></label>
        <label className="text-sm flex items-end gap-2"><input name="includeLogs" type="checkbox" className="h-4 w-4" /> Include Logs</label>
        <button type="submit" className="rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white">Create Backup</button>
      </form>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Restore Backup</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <input className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Select backup file" />
          <label className="text-sm flex items-center gap-2"><input type="checkbox" className="h-4 w-4" /> I understand restore overwrites current DB</label>
          <button className="rounded-lg border border-rose-300 px-4 py-2 text-sm text-rose-700">Restore Backup</button>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Backup History</h2>
        <div className="mt-3 space-y-2">
          {history.length === 0 ? <p className="text-sm text-slate-600">No backups created in this session.</p> : history.map((item) => (
            <div key={item.id} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
              {item.type.toUpperCase()} backup - Include Logs: {item.includeLogs ? 'Yes' : 'No'} - {item.status}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
