import ResultPublicationManager from '@/components/exam-officer/ResultPublicationManager';

export default function Page() {
  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Exam Officer Module</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">Result Publication</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Prepare and approve publication batches with full publication notes and scheduling.
        </p>
      </section>

      <ResultPublicationManager />
    </div>
  );
}
