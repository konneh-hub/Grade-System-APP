export default function SemestersPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Semester Management</h1>
        <p className="mt-2 text-sm text-slate-600">Create, activate, and close semesters tied to academic sessions.</p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {['Create Semester', 'Activate Semester', 'Close Semester'].map((action) => (
          <div key={action} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h2 className="font-semibold text-slate-900">{action}</h2>
            <p className="mt-2 text-sm text-slate-600">Operational controls will be available here.</p>
          </div>
        ))}
      </section>
    </div>
  );
}
