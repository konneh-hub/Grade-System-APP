import Link from 'next/link';

const cards = [
  { title: 'Users', description: 'Manage staff, students, and access roles.', href: '/dashboard/admin/users' },
  { title: 'Courses', description: 'Create and maintain academic offerings.', href: '/dashboard/admin/courses' },
  { title: 'Reports', description: 'Review academic and operational reports.', href: '/dashboard/admin/reports' },
];

export default function Page() {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#2563EB]">Admin dashboard</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">Welcome to Slughub</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
          Manage the academic platform from one place with quick access to the most important administrative workflows.
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
