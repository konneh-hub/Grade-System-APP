import Link from 'next/link';

const metrics = [
  { label: 'Pending processing batches', value: '14', note: '3 critical batches' },
  { label: 'Carryover requests', value: '22', note: '8 pending review' },
  { label: 'Transcript queue', value: '31', note: '12 ready for issuance' },
  { label: 'Rectification items', value: '5', note: 'All within SLA' },
];

const cards = [
  { title: 'Results processing', description: 'Process, validate, and publish result batches safely.', href: '/exam-officer/results' },
  { title: 'Carryover', description: 'Manage carryover requests and approval stages.', href: '/exam-officer/carryover' },
  { title: 'Transcripts', description: 'Generate and track transcript issuance end-to-end.', href: '/exam-officer/transcripts' },
  { title: 'Rectification', description: 'Handle rectification requests and correction workflows.', href: '/exam-officer/rectification' },
];

const activities = [
  'Result publication batch EX-2026-07 moved to final verification.',
  'Transcript request TR-114 approved and queued for issuance.',
  'Carryover case CO-233 escalated to faculty board.',
];

export default function Page() {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#2563EB]">Exam officer dashboard</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">Examination operations</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
          Oversee results publication, carryover workflows, and transcript generation from a central dashboard.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <div key={metric.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{metric.label}</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{metric.value}</p>
            <p className="mt-1 text-sm text-slate-600">{metric.note}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {cards.map((card) => (
          <Link key={card.title} href={card.href} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <h2 className="text-lg font-semibold text-slate-900">{card.title}</h2>
            <p className="mt-2 text-sm text-slate-600">{card.description}</p>
          </Link>
        ))}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Operations timeline</h2>
        <div className="mt-3 space-y-2">
          {activities.map((activity) => (
            <div key={activity} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
              {activity}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
