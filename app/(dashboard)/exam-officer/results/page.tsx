import DataTable from '@/components/shared/DataTable';

async function getResults() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/results`, { cache: 'no-store' });
  return res.json();
}

export default async function Page() {
  const rows = await getResults();

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#2563EB]">Exam officer</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">Results processing</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
          Review submitted results and ensure they are ready for publishing.
        </p>
      </section>

      <DataTable
        title="Submitted results"
        description="A list of results captured throughout the academic session."
        rows={rows}
        emptyMessage="No results have been submitted yet."
        columns={[
          { header: 'Student', accessor: 'student_id' },
          { header: 'Course', accessor: 'course_id' },
          { header: 'CA', accessor: 'ca_score' },
          { header: 'Exam', accessor: 'exam_score' },
          { header: 'Total', accessor: 'total_score' },
          { header: 'Grade', accessor: 'grade' },
          { header: 'Status', accessor: 'status' },
        ]}
      />
    </div>
  );
}
