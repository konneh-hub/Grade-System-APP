import Link from 'next/link';

const cards = [
  { title: 'Results processing', description: 'Process and publish results for the academic session.', href: '/exam-officer/results' },
  { title: 'Carryover', description: 'Manage carryover requests and approvals.', href: '/exam-officer/carryover' },
  { title: 'Transcripts', description: 'Generate and track student transcripts.', href: '/exam-officer/transcripts' },
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
      <section className="grid gap-4 md:grid-cols-3">
        {cards.map((card) => (
          <Link key={card.title} href={card.href} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <h2 className="text-lg font-semibold text-slate-900">{card.title}</h2>
            <p className="mt-2 text-sm text-slate-600">{card.description}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}
