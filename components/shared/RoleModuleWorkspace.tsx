'use client';

import { FormEvent, useMemo, useState } from 'react';

type WorkspaceItem = {
  id: number;
  summary: string;
  details: string;
  status: 'open' | 'in-review' | 'completed';
};

type RoleModuleWorkspaceProps = {
  title: string;
  description: string;
  actionLabel: string;
  summaryLabel: string;
};

export default function RoleModuleWorkspace({
  title,
  description,
  actionLabel,
  summaryLabel,
}: RoleModuleWorkspaceProps) {
  const [form, setForm] = useState({ summary: '', details: '', status: 'open' as WorkspaceItem['status'] });
  const [items, setItems] = useState<WorkspaceItem[]>([]);
  const [query, setQuery] = useState('');
  const [message, setMessage] = useState('');

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!form.summary.trim()) return;

    setItems((prev) => [
      {
        id: Date.now(),
        summary: form.summary.trim(),
        details: form.details.trim(),
        status: form.status,
      },
      ...prev,
    ]);

    setForm({ summary: '', details: '', status: 'open' });
    setMessage(`${actionLabel} saved successfully.`);
  }

  const filteredItems = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return items;

    return items.filter((item) => {
      return (
        item.summary.toLowerCase().includes(term) ||
        item.details.toLowerCase().includes(term) ||
        item.status.toLowerCase().includes(term)
      );
    });
  }, [items, query]);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#1A3A6B]">Role workspace</p>
        <h1 className="mt-2 text-[28px] font-bold text-[#2D3748]">{title}</h1>
        <p className="mt-2 text-sm text-slate-600">{description}</p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-[22px] font-semibold text-[#2D3748]">Create or update {summaryLabel.toLowerCase()}</h2>
        <form onSubmit={onSubmit} className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="text-sm font-medium text-slate-700">
            {summaryLabel}
            <input
              required
              className="mt-1 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              value={form.summary}
              onChange={(event) => setForm((prev) => ({ ...prev, summary: event.target.value }))}
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Status
            <select
              className="mt-1 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              value={form.status}
              onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value as WorkspaceItem['status'] }))}
            >
              <option value="open">Open</option>
              <option value="in-review">In Review</option>
              <option value="completed">Completed</option>
            </select>
          </label>
          <label className="text-sm font-medium text-slate-700 md:col-span-2">
            Details
            <textarea
              rows={4}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              value={form.details}
              onChange={(event) => setForm((prev) => ({ ...prev, details: event.target.value }))}
            />
          </label>
          <button type="submit" className="h-11 rounded-lg bg-[#1A3A6B] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#16335d]">
            {actionLabel}
          </button>
          {message ? <p className="self-center text-sm text-[#28A745]">{message}</p> : null}
        </form>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-[22px] font-semibold text-[#2D3748]">{summaryLabel} tracker</h2>
          <input
            type="search"
            placeholder={`Search ${summaryLabel.toLowerCase()}`}
            className="h-11 w-full max-w-sm rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>

        <div className="mt-4 space-y-2">
          {filteredItems.length === 0 ? (
            <p className="text-sm text-slate-600">No {summaryLabel.toLowerCase()} records yet.</p>
          ) : (
            filteredItems.map((item) => (
              <div key={item.id} className="rounded-lg border border-slate-200 bg-[#F7FAFC] px-4 py-3">
                <p className="text-sm font-semibold text-slate-900">{item.summary}</p>
                <p className="mt-1 text-sm text-slate-600">{item.details || 'No details provided.'}</p>
                <p className="mt-1 inline-flex rounded-full bg-[#EFF3FA] px-2 py-0.5 text-xs font-medium uppercase tracking-wide text-[#1A3A6B]">{item.status}</p>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
