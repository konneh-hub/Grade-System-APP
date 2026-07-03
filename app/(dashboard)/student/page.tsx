import Link from 'next/link';

const metrics = [
  { label: 'Current GPA', value: '3.68', note: 'Up from last semester' },
  { label: 'Pending complaints', value: '2', note: '1 under review' },
  { label: 'Transcript requests', value: '1', note: 'Awaiting processing' },
  { label: 'Published results', value: '8', note: 'All courses visible' },
];

const cards = [
  { title: 'My results', description: 'View detailed grades and performance summaries.', href: '/student/results' },
  { title: 'Transcripts', description: 'Request and track transcript processing status.', href: '/student/transcripts' },
  { title: 'Complaints', description: 'Submit and monitor complaints with status updates.', href: '/student/complaints' },
  { title: 'Profile', description: 'Keep your profile and student details current.', href: '/student/profile' },
];

const activities = [
  'Result for CSC 302 published successfully.',
  'Complaint CMP-2026-09 moved to in-review status.',
  'Transcript request TRQ-109 acknowledged by exam office.',
];

export default function Page() {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#2563EB]">Student dashboard</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">Your academic workspace</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
          Follow your academic progress, access your results, and manage transcript or complaint requests without leaving the portal.
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
        <h2 className="text-lg font-semibold text-slate-900">Recent activity</h2>
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
