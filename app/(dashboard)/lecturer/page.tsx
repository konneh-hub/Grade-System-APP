import Link from 'next/link';

const metrics = [
  { label: 'Assigned courses', value: '5', note: '2 with pending submissions' },
  { label: 'Score sheets due', value: '7', note: 'Before Sunday midnight' },
  { label: 'Unseen notifications', value: '4', note: 'Department + exam office' },
  { label: 'Report drafts', value: '3', note: '1 ready for submission' },
];

const cards = [
  { title: 'My courses', description: 'Manage assigned courses and session teaching tasks.', href: '/lecturer/courses' },
  { title: 'Score entry', description: 'Capture CA and exam scores with review checkpoints.', href: '/lecturer/courses' },
  { title: 'Reports', description: 'Prepare class and assessment reports for your department.', href: '/lecturer/reports' },
  { title: 'Notifications', description: 'Send and monitor course-level announcements.', href: '/lecturer/notifications' },
];

const activities = [
  'CSC 302 score entry opened for review.',
  'Two students submitted complaint references for grade clarification.',
  'Department reminder: submit mid-term teaching report by Friday.',
];

export default function Page() {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#2563EB]">Lecturer dashboard</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">Teaching overview</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
          Keep track of your assigned courses, submit results, and stay on top of department reporting requirements.
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
        <h2 className="text-lg font-semibold text-slate-900">Recent teaching activity</h2>
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
