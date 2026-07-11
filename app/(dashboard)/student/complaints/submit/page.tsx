"use client";

import { FormEvent, useState } from 'react';

const categories = ['Missing Result', 'Incorrect Score', 'Wrong Grade', 'Grade Not Computed', 'Other'];
const priorities = ['Low', 'Medium', 'High'];

export default function Page() {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(categories[0]);
  const [priority, setPriority] = useState(priorities[1]);
  const [description, setDescription] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setMessage(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, category, priority, description }),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? 'Failed to submit complaint');
      }

      setMessage('Complaint submitted successfully.');
      setTitle('');
      setCategory(categories[0]);
      setPriority(priorities[1]);
      setDescription('');
    } catch (err) {
      console.error(err);
      setMessage(err instanceof Error ? err.message : 'Unable to submit complaint.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#2563EB]">Submit Complaint</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">Result review and complaints</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">Create a formal complaint for missing or incorrect academic information. Your request will be routed through the review workflow.</p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <form onSubmit={onSubmit} className="grid gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700">Complaint title</label>
            <input
              required
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="mt-2 h-12 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
              placeholder="e.g. Incorrect grade for CSC302"
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700">
              Category
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="mt-2 h-12 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
              >
                {categories.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Priority
              <select
                value={priority}
                onChange={(event) => setPriority(event.target.value)}
                className="mt-2 h-12 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
              >
                {priorities.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Detailed explanation</label>
            <textarea
              required
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={6}
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm"
              placeholder="Provide course details, session, and what needs correction."
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex h-12 items-center justify-center rounded-xl bg-[#1A3A6B] px-5 text-sm font-semibold text-white transition hover:bg-[#16335d] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? 'Submitting…' : 'Submit Complaint'}
          </button>

          {message ? <p className="text-sm text-slate-700">{message}</p> : null}
        </form>
      </section>
    </div>
  );
}
