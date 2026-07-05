import DataTable from '@/components/shared/DataTable';

async function getCourses() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/courses`, { cache: 'no-store' });
  return res.json();
}

export default async function Page() {
  const rows = await getCourses();

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#2563EB]">Administration</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">Module administration</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
          Review academic modules, credits, and the active module catalog.
        </p>
      </section>

      <DataTable
        title="Academic modules"
        description="All modules available in the current teaching setup."
        rows={rows}
        emptyMessage="No modules are available yet."
        columns={[
          { header: 'Code', accessor: 'code' },
          { header: 'Title', accessor: 'title' },
          { header: 'Level', accessor: 'level' },
          { header: 'Credits', accessor: 'credit_units' },
          { header: 'Status', accessor: 'is_active' },
        ]}
      />
    </div>
  );
}
