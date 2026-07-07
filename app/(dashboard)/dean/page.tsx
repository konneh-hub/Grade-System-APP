import React from "react";
import DeanDashboardClient from "../../../components/dean/DeanDashboardClient";
import Link from 'next/link';

export const metadata = {
  title: "Dean Dashboard - Slughub",
};

const quickActions = [
  { title: 'Review results', description: 'Open result approvals and department submissions.', href: '/dean/results', icon: 'check_circle' },
  { title: 'Graduation cases', description: 'Track graduation applications and approvals.', href: '/dean/graduation', icon: 'school' },
  { title: 'Manage appeals', description: 'Review and resolve student appeals.', href: '/dean/appeals', icon: 'gavel' },
  { title: 'Faculty reports', description: 'Review faculty report submissions and notes.', href: '/dean/reports', icon: 'article' },
];

const chartCards = [
  { title: 'Submission compliance', hint: 'Department submissions by status', icon: 'task_alt', bars: [72, 88, 60, 80, 94] },
  { title: 'Approval velocity', hint: 'Cases approved per day', icon: 'trending_up', bars: [5, 9, 7, 10, 12] },
  { title: 'Appeal volume', hint: 'Open appeals this week', icon: 'report_gmailerrorred', bars: [2, 4, 3, 5, 6] },
  { title: 'Graduation readiness', hint: 'Applications near completion', icon: 'school', bars: [68, 74, 80, 85, 90] },
];

function MiniBarChart({ values }: { values: number[] }) {
  const max = Math.max(...values, 1);
  return (
    <div className="mt-4 flex items-end gap-2 h-16">
      {values.map((value, index) => (
        <div
          key={index}
          className="h-full w-2 rounded-full bg-slate-300 transition-all duration-300"
          style={{ height: `${(value / max) * 100}%` }}
        />
      ))}
    </div>
  );
}

export default function Page() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#2563EB]">Dean dashboard</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">Academic leadership hub</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
            Monitor result reviews, graduation readiness, and appeals from one unified academic oversight dashboard.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Pending result cases</p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">18</p>
            <p className="mt-2 text-sm text-slate-600">4 high-priority items</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Graduation reviews</p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">11</p>
            <p className="mt-2 text-sm text-slate-600">3 awaiting final decision</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Open appeals</p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">9</p>
            <p className="mt-2 text-sm text-slate-600">2 escalated this week</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Faculty report tasks</p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">6</p>
            <p className="mt-2 text-sm text-slate-600">Submission due Friday</p>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Quick actions</h2>
            <p className="mt-1 text-sm text-slate-600">Jump to the most important Dean workflows.</p>
            <div className="mt-5 grid gap-3">
              {quickActions.map((item) => (
                <Link
                  key={item.title}
                  href={item.href}
                  className="group flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-900 transition hover:-translate-y-0.5 hover:border-[#1E3A8A] hover:bg-white"
                >
                  <span className="material-symbols-outlined text-2xl text-[#1E3A8A]">{item.icon}</span>
                  <div>
                    <p className="font-semibold">{item.title}</p>
                    <p className="mt-1 text-sm text-slate-600">{item.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Dean insights</h2>
                <p className="mt-1 text-sm text-slate-600">High-level chart cards for review volume and readiness.</p>
              </div>
              <span className="material-symbols-outlined text-3xl text-[#1E3A8A]">insights</span>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {chartCards.map((card) => (
                <div key={card.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-slate-500">{card.title}</p>
                      <p className="mt-2 text-sm text-slate-600">{card.hint}</p>
                    </div>
                    <span className="material-symbols-outlined text-3xl text-[#1E3A8A]">{card.icon}</span>
                  </div>
                  <MiniBarChart values={card.bars} />
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Live Dean dashboard</h2>
          <p className="mt-1 text-sm text-slate-600">Review current submission status and take action from the table below.</p>
        </section>

        <DeanDashboardClient />
      </div>
    </main>
  );
}
