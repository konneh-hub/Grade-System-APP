"use client";

import { FormEvent, useState } from 'react';
import Link from 'next/link';

const purposes = [
  'Tertiary Admission',
  'Employment',
  'Scholarship',
  'Professional Registration',
  'Personal Records',
  'Other',
];

export default function Page() {
  const [purpose, setPurpose] = useState(purposes[0]);
  const [copies, setCopies] = useState(1);
  const [notes, setNotes] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setMessage(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/transcripts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ purpose, copies: Math.max(1, copies), notes }),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? 'Failed to submit request');
      }

      setMessage('Transcript request submitted successfully.');
      setPurpose(purposes[0]);
      setCopies(1);
      setNotes('');
    } catch (err) {
      console.error(err);
      setMessage(err instanceof Error ? err.message : 'Unable to submit request.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#2563EB]">Transcripts</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">Request transcript</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">Submit a formal request for official academic transcripts. The registrar will process your request and notify you when ready for collection or delivery.</p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <form onSubmit={onSubmit} className="grid gap-6">
          <div className="grid gap-6 md:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700">
              Purpose
              <select
                value={purpose}
                onChange={(event) => setPurpose(event.target.value)}
                className="mt-2 h-12 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
              >
                {purposes.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Number of copies
              <input
                type="number"
                min="1"
                max="10"
                value={copies}
                onChange={(event) => setCopies(Math.max(1, parseInt(event.target.value) || 1))}
                className="mt-2 h-12 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
              />
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Additional notes</label>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={4}
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm"
              placeholder="e.g. destination address, special delivery instructions"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex h-12 items-center justify-center rounded-xl bg-[#1A3A6B] px-5 text-sm font-semibold text-white transition hover:bg-[#16335d] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? 'Submitting…' : 'Submit Request'}
            </button>
            <Link href="/student/transcripts" className="inline-flex h-12 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Cancel
            </Link>
          </div>

          {message ? <p className="text-sm text-slate-700">{message}</p> : null}
        </form>
      </section>
    </div>
  );
}
