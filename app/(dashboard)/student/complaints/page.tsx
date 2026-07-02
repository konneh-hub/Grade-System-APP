import DataTable from '@/components/shared/DataTable';

async function getComplaints() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/complaints`, { cache: 'no-store' });
  return res.json();
}

export default async function Page() {
  const rows = await getComplaints();

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#2563EB]">Student</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">Complaints</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
          Submit and track complaints for academic or administrative issues.
        </p>
      </section>

      <DataTable
        title="My complaints"
        description="A record of complaints you have submitted."
        rows={rows}
        emptyMessage="You have not submitted any complaints yet."
        columns={[
          { header: 'Title', accessor: 'title' },
          { header: 'Category', accessor: 'category' },
          { header: 'Status', accessor: 'status' },
          { header: 'Priority', accessor: 'priority' },
        ]}
      />
    </div>
  );
}
