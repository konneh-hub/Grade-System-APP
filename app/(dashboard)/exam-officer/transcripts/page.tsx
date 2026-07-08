import RoleModuleWorkspace from '@/components/shared/RoleModuleWorkspace';
import TranscriptManager from '@/components/exam-officer/TranscriptManager';

export default function Page() {
  return (
    <div className="space-y-6">
      <RoleModuleWorkspace
        title="Transcript Operations"
        description="Manage transcript lifecycle from request verification to issuance."
        actionLabel="Save Transcript Update"
        summaryLabel="Transcript Request"
      />

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Transcript Requests</h2>
        <p className="text-sm text-slate-600">Manage pending transcript requests and finalize issuance.</p>
        <div className="mt-4">
          <TranscriptManager />
        </div>
      </section>
    </div>
  );
}
