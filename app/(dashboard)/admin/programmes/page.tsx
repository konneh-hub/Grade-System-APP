import Link from 'next/link';

export default function ProgrammesPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Programme Management</h1>
        <p className="mt-2 text-sm text-slate-600">Manage academic programmes such as BSc Computer Science, Information Systems, and Accounting.</p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Programme fields</h2>
        <ul className="mt-3 grid gap-2 text-sm text-slate-700 md:grid-cols-2">
          <li>Programme Name</li>
          <li>Programme Code</li>
          <li>Department</li>
          <li>Degree Type</li>
          <li>Duration</li>
          <li>Status</li>
        </ul>
        <Link href="/admin/departments" className="mt-5 inline-flex rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">View Departments</Link>
      </section>
    </div>
  );
}
