import ResultsProcessingClient from '@/components/exam-officer/ResultsProcessingClient';
import PublicationManager from '@/components/exam-officer/PublicationManager';

export default function Page() {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#1A3A6B]">Exam officer</p>
        <h1 className="mt-2 text-[28px] font-bold text-[#2D3748]">Results processing</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">Review submitted results and ensure they are ready for publishing.</p>
      </section>

      <ResultsProcessingClient />
        <section>
          <h2 className="text-lg font-semibold text-slate-900">Publication</h2>
          <p className="text-sm text-slate-600">Publish, unpublish and lock result batches.</p>
          <div className="mt-4">
            <PublicationManager />
          </div>
        </section>
    </div>
  );
}
