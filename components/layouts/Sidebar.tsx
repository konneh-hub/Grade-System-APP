import Link from 'next/link';

const items = [
  { href: '/dashboard/admin', label: 'Dashboard' },
  { href: '/dashboard/admin/users', label: 'Users' },
  { href: '/dashboard/admin/courses', label: 'Courses' },
  { href: '/dashboard/admin/reports', label: 'Reports' },
];

export default function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-slate-50 p-6 lg:block">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#2563EB]">Slughub</p>
        <h2 className="mt-2 text-lg font-semibold text-slate-900">Academic portal</h2>
      </div>
      <nav className="space-y-2">
        {items.map((item) => (
          <Link key={item.href} href={item.href} className="block rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-white hover:text-[#2563EB]">
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
