import Link from 'next/link';

const cards = [
  { title: 'Student management', description: 'Monitor student activity and department records.', href: '/hod/students' },
  { title: 'Course assignments', description: 'Coordinate lecturer assignments and department courses.', href: '/hod/courses' },
  { title: 'Complaints', description: 'Review departmental complaints and resolutions.', href: '/hod/complaints' },
];

export default function Page() {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#2563EB]">HOD dashboard</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">Department administration</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
          Coordinate department workflows, review challenges, and keep staff aligned with academic processes.
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
