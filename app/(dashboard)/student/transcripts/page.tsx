"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import DataTable from '@/components/shared/DataTable';

type TranscriptRequest = {
  id: number;
  status: string;
  requested_at: string;
  completed_at: string | null;
  purpose: string | null;
};

export default function Page() {
  const [transcripts, setTranscripts] = useState<TranscriptRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
    let mounted = true;

    async function loadTranscripts() {
      try {
        const res = await fetch('/api/transcripts', { cache: 'no-store' });
        if (!res.ok) {
          const body = await res.json();
          throw new Error(body.error ?? 'Failed to load transcripts');
        }
        const rows = (await res.json()) as TranscriptRequest[];
        if (mounted) setTranscripts(rows);
      } catch (err) {
        console.error(err);
        if (mounted) setError(err instanceof Error ? err.message : 'Unable to load transcripts.');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadTranscripts();
    return () => {
      mounted = false;
    };
  }, []);

  if (!hydrated) {
    return (
      <div className="space-y-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="md:flex md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#2563EB]">Student</p>
              <h1 className="mt-2 text-3xl font-semibold text-slate-900">Transcripts</h1>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="md:flex md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#2563EB]">Student</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">Transcripts</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">Request and track your academic transcripts.</p>
          </div>
          <Link href="/student/transcripts/request" className="mt-4 inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 md:mt-0">
            Request new transcript
          </Link>
        </div>
      </section>

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">Loading transcripts…</div>
      ) : error ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm text-sm text-rose-600">{error}</div>
      ) : (
        <DataTable
          title="My transcript requests"
          description="Status and download links for your requests."
          rows={transcripts}
          emptyMessage="You have not requested any transcripts yet."
          columns={[
            { header: 'Status', accessor: 'status' },
            { header: 'Purpose', accessor: 'purpose' },
            { header: 'Requested', accessor: 'requested_at', render: (val) => val ? new Date(String(val)).toLocaleDateString() : 'N/A' },
            { header: 'Completed', accessor: 'completed_at', render: (val) => val ? new Date(String(val)).toLocaleDateString() : 'Pending' },
          ]}
          hrefBuilder={(row) => `/student/transcripts/${row.id}`}
        />
      )}
    </div>
  );
}
