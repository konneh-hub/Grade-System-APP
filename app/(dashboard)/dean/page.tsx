import Link from 'next/link';

const metrics = [
  { label: 'Pending result cases', value: '18', note: '4 high-priority items' },
  { label: 'Graduation reviews', value: '11', note: '3 awaiting final decision' },
  { label: 'Open appeals', value: '9', note: '2 escalated this week' },
  { label: 'Faculty report tasks', value: '6', note: 'Submission due Friday' },
];

const cards = [
  { title: 'Results review', description: 'Review and approve academic results with decision notes.', href: '/dean/results' },
  { title: 'Graduation', description: 'Track graduation applications and completion readiness.', href: '/dean/graduation' },
  { title: 'Appeals', description: 'Handle appeal lifecycles and finalize outcomes.', href: '/dean/appeals' },
  { title: 'Faculty reports', description: 'Prepare and sign-off periodic faculty reports.', href: '/dean/reports' },
];

const activities = [
  'Result Review Board meeting scheduled for Thursday 10:00 AM.',
  'Two graduation applications moved to final approval stage.',
  'Appeal case AP-2026-114 updated with additional evidence.',
];

export default function Page() {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#2563EB]">Dean dashboard</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">Academic leadership overview</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
          Review results, graduation cases, and appeals from one place so decisions can be made quickly and consistently.
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
        <h2 className="text-lg font-semibold text-slate-900">Recent leadership activity</h2>
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
