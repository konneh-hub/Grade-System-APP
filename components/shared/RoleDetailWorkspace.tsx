'use client';

import { FormEvent, useState } from 'react';

type RoleDetailWorkspaceProps = {
  title: string;
  description: string;
  primaryActionLabel: string;
};

export default function RoleDetailWorkspace({
  title,
  description,
  primaryActionLabel,
}: RoleDetailWorkspaceProps) {
  const [notes, setNotes] = useState('');
  const [decision, setDecision] = useState('in-review');
  const [message, setMessage] = useState('');

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    setMessage(`${primaryActionLabel} completed successfully.`);
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#1A3A6B]">Case workspace</p>
        <h1 className="mt-2 text-[28px] font-bold text-[#2D3748]">{title}</h1>
        <p className="mt-2 text-sm text-slate-600">{description}</p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-[22px] font-semibold text-[#2D3748]">Case decision panel</h2>
        <form onSubmit={onSubmit} className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="text-sm font-medium text-slate-700">
            Decision
            <select
              className="mt-1 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              value={decision}
              onChange={(event) => setDecision(event.target.value)}
            >
              <option value="in-review">In Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="escalated">Escalated</option>
            </select>
          </label>

          <label className="text-sm font-medium text-slate-700 md:col-span-2">
            Notes
            <textarea
              rows={5}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Write your decision notes and rationale"
            />
          </label>

          <button type="submit" className="h-11 rounded-lg bg-[#1A3A6B] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#16335d]">
            {primaryActionLabel}
          </button>
          {message ? <p className="self-center text-sm text-[#28A745]">{message}</p> : null}
        </form>
      </section>
    </div>
  );
}
