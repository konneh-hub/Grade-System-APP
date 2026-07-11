import RoleModuleWorkspace from '@/components/shared/RoleModuleWorkspace';
import TranscriptGenerator from '@/components/exam-officer/TranscriptGenerator';

export default function Page() {
  return (
    <div className="space-y-6">
      <RoleModuleWorkspace
        title="Generate Transcripts"
        description="Initiate transcript generation jobs and track generation outcomes."
        actionLabel="Queue Transcript Job"
        summaryLabel="Generation Job"
      />

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Transcript generation</h2>
        <p className="text-sm text-slate-600">Queue transcript generation jobs for students.</p>
        <div className="mt-4">
          <TranscriptGenerator />
        </div>
      </section>
    </div>
  );
}
