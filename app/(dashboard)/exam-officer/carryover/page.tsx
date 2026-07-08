import CarryoverProcessor from '@/components/exam-officer/CarryoverProcessor';

export default function Page() {
  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Exam Officer Module</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">Carryover Processing</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Manage carryover requests, outcomes, and follow-up timelines for affected students.
        </p>
      </section>

      <CarryoverProcessor />
    </div>
  );
}
