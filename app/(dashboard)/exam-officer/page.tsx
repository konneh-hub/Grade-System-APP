import AcademicStructureBrowser from '@/components/exam-officer/AcademicStructureBrowser';
import GpaCgpaManager from '@/components/exam-officer/GpaCgpaManager';

const summaryCards = [
  { label: 'Dean Approved Results', value: '48', note: 'Ready for exam review' },
  { label: 'Results Awaiting Processing', value: '14', note: 'Pending exam officer action' },
  { label: 'Results Ready for Publication', value: '37', note: 'Final verification complete' },
  { label: 'Published Results', value: '112', note: 'Live in student portal' },
  { label: 'Pending Transcript Requests', value: '27', note: 'Awaiting issuance' },
  { label: 'Pending Rectifications', value: '9', note: 'Require review' },
  { label: 'Graduation Candidates', value: '120', note: 'Eligible for verification' },
];

export default function Page() {
  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Exam officer dashboard</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">Exam operations command center</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Navigate academic folders, review publication workflows, and manage transcripts with a modern exam officer workspace.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <div key={card.label} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{card.label}</p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">{card.value}</p>
            <p className="mt-2 text-sm text-slate-600">{card.note}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Recent activities</h2>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              <li>Published semester results for BSc Computer Science Year 3.</li>
              <li>Verified 18 graduation candidate CGPAs for final approval.</li>
              <li>Scheduled transcript generation for 12 outgoing students.</li>
            </ul>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Notifications</h2>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              <li className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                <span>New transcript request from Student 1123</span>
                <span className="rounded-full bg-[#EFF6FF] px-2 py-1 text-xs font-semibold text-[#1D4ED8]">Unread</span>
              </li>
              <li className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                <span>Results batch EX-2026-07 ready for publication</span>
                <span className="rounded-full bg-[#ECFDF5] px-2 py-1 text-xs font-semibold text-[#15803D]">New</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Publication calendar</h2>
            <div className="mt-4 grid gap-3">
              {[
                { label: 'Summer publication window', date: '2026-07-20' },
                { label: 'Final transcript release', date: '2026-08-15' },
                { label: 'Graduation verification deadline', date: '2026-09-01' },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                  <p className="mt-1 text-sm text-slate-600">{item.date}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Processing progress</h2>
            <p className="mt-4 text-sm text-slate-600">Overall processing status for active exam workflows.</p>
            <div className="mt-6 space-y-4">
              {[
                { label: 'Results batches completed', value: '74%' },
                { label: 'Publication queue', value: '42%' },
                { label: 'Transcript approvals', value: '61%' },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between text-sm text-slate-700">
                    <span>{item.label}</span>
                    <span className="font-semibold text-slate-900">{item.value}</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-[#2563EB]" style={{ width: item.value }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">GPA statistics</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {[
                { label: 'Average GPA', value: '3.42' },
                { label: 'Average CGPA', value: '3.44' },
                { label: 'Distinction rate', value: '29%' },
                { label: 'At-risk cohort', value: '11%' },
              ].map((stat) => (
                <div key={stat.label} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">{stat.label}</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">{stat.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <AcademicStructureBrowser />

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">GPA & CGPA Management</h2>
        <p className="mt-2 text-sm text-slate-600">Review computed GPA and CGPA values across programmes.</p>
        <div className="mt-4">
          <GpaCgpaManager />
        </div>
      </section>
    </div>
  );
}
