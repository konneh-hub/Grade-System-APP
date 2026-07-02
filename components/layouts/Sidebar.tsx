import Link from 'next/link';

const sections = [
  {
    title: 'Main',
    items: [
      { href: '/admin', label: 'Dashboard' },
      { href: '/admin/users', label: 'User Management' },
      { href: '/admin/users/create', label: 'Create User' },
      { href: '/admin/users/roles', label: 'User Roles' },
    ],
  },
  {
    title: 'Academic Structure',
    items: [
      { href: '/admin/faculties', label: 'Faculties' },
      { href: '/admin/departments', label: 'Departments' },
      { href: '/admin/programmes', label: 'Programmes' },
      { href: '/admin/academic-sessions', label: 'Academic Sessions' },
      { href: '/admin/semesters', label: 'Semesters' },
      { href: '/admin/courses', label: 'Courses' },
    ],
  },
  {
    title: 'System',
    items: [
      { href: '/admin/calendar', label: 'Academic Calendar' },
      { href: '/admin/notifications', label: 'Notifications' },
      { href: '/admin/reports', label: 'Reports & Analytics' },
      { href: '/admin/audit', label: 'Audit Logs' },
      { href: '/admin/backup', label: 'Backup & Restore' },
      { href: '/admin/settings', label: 'System Settings' },
      { href: '/admin/security', label: 'Security' },
      { href: '/admin/profile', label: 'Profile' },
      { href: '/admin/help', label: 'Help & Support' },
    ],
  },
];

export default function Sidebar() {
  return (
    <aside className="hidden w-72 shrink-0 border-r border-slate-200 bg-slate-950 p-6 text-slate-200 lg:block">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#60A5FA]">Slughub</p>
        <h2 className="mt-2 text-xl font-semibold text-white">Admin console</h2>
        <p className="mt-2 text-sm text-slate-400">University administration and operations.</p>
      </div>

      <nav className="space-y-6">
        {sections.map((section) => (
          <div key={section.title}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">{section.title}</p>
            <div className="space-y-1">
              {section.items.map((item) => (
                <Link
                  key={item.href + item.label}
                  href={item.href}
                  className="block rounded-xl px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
