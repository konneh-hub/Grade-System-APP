"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import DataTable from '@/components/shared/DataTable';

type ComplaintRow = {
  id: number;
  title: string;
  category: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
};

export default function Page() {
  const [complaints, setComplaints] = useState<ComplaintRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
    let mounted = true;

    async function loadComplaints() {
      try {
        const res = await fetch('/api/complaints', { cache: 'no-store' });
        if (!res.ok) {
          const body = await res.json();
          throw new Error(body.error ?? 'Failed to load complaints');
        }
        const rows = (await res.json()) as ComplaintRow[];
        if (mounted) setComplaints(rows);
      } catch (err) {
        console.error(err);
        if (mounted) setError(err instanceof Error ? err.message : 'Unable to load complaints.');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadComplaints();
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
              <h1 className="mt-2 text-3xl font-semibold text-slate-900">Complaints</h1>
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
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">Complaints</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">Submit and track formal complaints about published results or academic issues.</p>
          </div>
          <Link href="/student/complaints/submit" className="mt-4 inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 md:mt-0">
            Submit new complaint
          </Link>
        </div>
      </section>

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">Loading complaints…</div>
      ) : error ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm text-sm text-rose-600">{error}</div>
      ) : (
        <DataTable
          title="My complaints"
          description="A record of complaints you have submitted."
          rows={complaints}
          emptyMessage="You have not submitted any complaints yet."
          columns={[
            { header: 'Title', accessor: 'title' },
            { header: 'Category', accessor: 'category' },
            { header: 'Status', accessor: 'status' },
            { header: 'Priority', accessor: 'priority' },
          ]}
          hrefBuilder={(row) => `/student/complaints/${row.id}`}
        />
      )}
    </div>
  );
}
