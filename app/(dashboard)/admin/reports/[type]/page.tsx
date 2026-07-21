'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';

type GeneratedReport = {
  id: number;
  format: string;
  status: string;
  generated_at: string | null;
  created_at: string;
  template_name: string;
  category: string;
};

type ReportTypePayload = {
  type: string;
  template: { id: number; name: string; description?: string; category: string } | null;
  generated: GeneratedReport[];
  schedules?: Array<{ id: number; report_type: string; format: string; schedule_cron: string | null; next_run_at: string | null; status: string }>;
};

export default function Page() {
  const params = useParams<{ type: string }>();
  const type = String(params?.type ?? '').toLowerCase();

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [scheduleCron, setScheduleCron] = useState('0 0 * * *');
  const [nextRunAt, setNextRunAt] = useState('');
  const [format, setFormat] = useState('pdf');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [data, setData] = useState<ReportTypePayload | null>(null);

  const loadReports = useCallback(async () => {
    if (!type) return;
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/reports/${type}`, { cache: 'no-store' });
      const payload = (await response.json()) as ReportTypePayload | { error?: string };
      if (!response.ok) throw new Error((payload as { error?: string }).error || 'Failed to load report type');
      setData(payload as ReportTypePayload);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load report type');
    } finally {
      setLoading(false);
    }
  }, [type]);

  useEffect(() => {
    void loadReports();
  }, [loadReports]);

  async function onGenerate() {
    if (!type) return;
    setGenerating(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch(`/api/reports/${type}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error || 'Failed to generate report');

      setMessage(`${type.toUpperCase()} report generated successfully.`);
      await loadReports();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate report');
    } finally {
      setGenerating(false);
    }
  }

  async function onSchedule() {
    if (!type) return;
    setGenerating(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          format,
          scheduled: true,
          schedule_cron: scheduleCron,
          next_run_at: nextRunAt || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error || 'Failed to schedule report');
      setMessage(`${type.toUpperCase()} report scheduled.`);
      await loadReports();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to schedule report');
    } finally {
      setGenerating(false);
    }
  }

  async function deleteGenerated(id: number) {
    const response = await fetch(`/api/reports/${type}?generated_id=${id}`, { method: 'DELETE' });
    if (response.ok) await loadReports();
  }

  async function deleteSchedule(id: number) {
    const response = await fetch(`/api/reports/${type}?schedule_id=${id}`, { method: 'DELETE' });
    if (response.ok) await loadReports();
  }

  const title = useMemo(() => `${type.toUpperCase()} Reports`, [type]);

  if (loading) {
    return <main className="p-6 text-sm text-slate-600">Loading report type...</main>;
  }

  return (
    <main className="space-y-6 p-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
            <p className="mt-2 text-sm text-slate-600">Inspect generated reports and trigger new report generation for this category.</p>
          </div>
          <Link href="/admin/reports" className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700">
            Back to reports
          </Link>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Generate</h2>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <label className="text-sm">Format<select className="mt-1 w-40 rounded-lg border border-slate-300 px-3 py-2" value={format} onChange={(event) => setFormat(event.target.value)}><option value="pdf">PDF</option><option value="csv">CSV</option><option value="xlsx">XLSX</option></select></label>
          <button disabled={generating} type="button" onClick={onGenerate} className="self-end rounded-lg bg-[#1A3A6B] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{generating ? 'Generating...' : 'Generate report'}</button>
          <a href={`/api/reports/export?type=${type}&format=csv`} className="self-end rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Export CSV</a>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <input className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Cron (default daily)" value={scheduleCron} onChange={(event) => setScheduleCron(event.target.value)} />
          <input type="datetime-local" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" value={nextRunAt} onChange={(event) => setNextRunAt(event.target.value)} />
          <button disabled={generating} type="button" onClick={onSchedule} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-60">{generating ? 'Working...' : 'Schedule Report'}</button>
        </div>
        {message ? <p className="mt-3 text-sm text-emerald-700">{message}</p> : null}
        {error ? <p className="mt-3 text-sm text-rose-700">{error}</p> : null}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Generated history</h2>
        <div className="mt-3 space-y-2">
          {!data || data.generated.length === 0 ? (
            <p className="text-sm text-slate-600">No generated reports for this category yet.</p>
          ) : (
            data.generated.map((row) => (
              <div key={row.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                #{row.id} | {row.template_name || type.toUpperCase()} | {row.format.toUpperCase()} | {row.status} | {new Date(row.created_at).toLocaleString()}
                <button type="button" onClick={() => deleteGenerated(row.id)} className="rounded-lg border border-rose-300 bg-white px-2 py-1 text-xs text-rose-700">Delete</button>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Schedules</h2>
        <div className="mt-3 space-y-2">
          {!data?.schedules || data.schedules.length === 0 ? (
            <p className="text-sm text-slate-600">No schedules configured.</p>
          ) : (
            data.schedules.map((row) => (
              <div key={row.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                #{row.id} | {row.report_type} | {row.format.toUpperCase()} | {row.schedule_cron || '-'} | next: {row.next_run_at || '-'} | {row.status}
                <button type="button" onClick={() => deleteSchedule(row.id)} className="rounded-lg border border-rose-300 bg-white px-2 py-1 text-xs text-rose-700">Delete</button>
              </div>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
