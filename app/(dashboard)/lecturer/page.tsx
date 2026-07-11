'use client';

import Link from 'next/link';

const summaryCards = [
  { label: 'Assigned Courses', value: '6', note: '4 active this semester' },
  { label: 'Registered Students', value: '214', note: 'Across all course groups' },
  { label: 'Pending Result Entries', value: '3', note: 'Waiting for score input' },
  { label: 'Submitted Results', value: '8', note: 'Sent to HoD for review' },
  { label: 'Returned for Correction', value: '2', note: 'Need updated scores' },
  { label: 'Upcoming Deadlines', value: '5 days', note: 'Before final submission' },
];

const quickLinks = [
  { title: 'Assigned courses', description: 'Manage your current teaching workload.', href: '/lecturer/courses' },
  { title: 'Score entry', description: 'Enter CA and exam scores for your class.', href: '/lecturer/courses' },
  { title: 'Reports', description: 'Generate academic and performance reports.', href: '/lecturer/reports' },
  { title: 'Notifications', description: 'Review messages and requests from the department.', href: '/lecturer/notifications' },
];

const notifications = [
  'Course CSC 402 score sheet returned for correction.',
  'Reminder: upload semester assessment summary by Friday.',
  'New notification from HOD regarding moderation panel.',
];

export default function Page() {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#2563EB]">Lecturer dashboard</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">Teaching overview</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
          Review your assigned courses, work in progress, and upcoming deadlines from one central place.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {summaryCards.map((card) => (
          <div key={card.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{card.label}</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{card.value}</p>
            <p className="mt-1 text-sm text-slate-600">{card.note}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Submission progress</h2>
          <div className="mt-4 space-y-3">
            <div>
              <p className="text-sm font-medium text-slate-700">Result sheets completed</p>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-2 w-3/4 rounded-full bg-[#2563EB]" />
              </div>
              <p className="mt-2 text-sm text-slate-500">75% complete</p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700">Pending corrections</p>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-2 w-1/4 rounded-full bg-[#F97316]" />
              </div>
              <p className="mt-2 text-sm text-slate-500">2 courses need updates</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Academic calendar</h2>
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="font-semibold text-slate-900">May 10</p>
              <p>Final result submission deadline.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="font-semibold text-slate-900">May 14</p>
              <p>Moderation panel review.</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Recent activity</h2>
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            {notifications.map((note) => (
              <div key={note} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                {note}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {quickLinks.map((link) => (
          <Link
            key={link.title}
            href={link.href}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <h2 className="text-lg font-semibold text-slate-900">{link.title}</h2>
            <p className="mt-2 text-sm text-slate-600">{link.description}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}
