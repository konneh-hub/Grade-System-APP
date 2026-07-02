import Link from 'next/link';

const cards = [
  { title: 'My results', description: 'View your academic results and grades.', href: '/student/results' },
  { title: 'Transcripts', description: 'Request and track your transcript history.', href: '/student/transcripts' },
  { title: 'Complaints', description: 'Submit and track complaints to the institution.', href: '/student/complaints' },
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
