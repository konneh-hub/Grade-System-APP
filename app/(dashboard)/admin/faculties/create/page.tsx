'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Page() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({ name: '', code: '', description: '' });

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/faculties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const payload = (await response.json()) as { error?: string; id?: number };
      if (!response.ok) throw new Error(payload.error || 'Failed to create faculty');

      setSuccess('Faculty created successfully. Redirecting...');
      setForm({ name: '', code: '', description: '' });
      setTimeout(() => {
        router.push('/admin/faculties');
        router.refresh();
      }, 600);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create faculty');
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="space-y-6 p-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Create faculty</h1>
            <p className="mt-2 text-sm text-slate-600">Add a new faculty to the institutional structure.</p>
          </div>
          <Link href="/admin/faculties" className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700">
            Back to faculties
          </Link>
        </div>
      </section>

      <form onSubmit={onSubmit} className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-2">
        <label className="text-sm">Faculty name<input required className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} /></label>
        <label className="text-sm">Faculty code<input required className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={form.code} onChange={(event) => setForm((prev) => ({ ...prev, code: event.target.value }))} /></label>
        <label className="text-sm md:col-span-2">Description<textarea rows={3} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={form.description} onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))} /></label>

        <div className="md:col-span-2 flex items-center gap-3">
          <button disabled={saving} type="submit" className="rounded-lg bg-[#1A3A6B] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{saving ? 'Saving...' : 'Create faculty'}</button>
          {success ? <p className="text-sm text-emerald-700">{success}</p> : null}
          {error ? <p className="text-sm text-rose-700">{error}</p> : null}
        </div>
      </form>
    </main>
  );
}
