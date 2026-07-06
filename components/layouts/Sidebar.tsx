"use client";

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

type NavItem = { href: string; label: string; icon: string };

const adminSections = [
  {
    title: 'Main',
    items: [
      { href: '/admin', label: 'Dashboard', icon: 'dashboard' },
      { href: '/admin/users', label: 'User Management', icon: 'group' },
      { href: '/admin/users', label: 'Create User', icon: 'person_add' },
      { href: '/admin/roles', label: 'Roles & Permissions', icon: 'admin_panel_settings' },
    ] as NavItem[],
  },
  {
    title: 'Academic Structure',
    items: [
      { href: '/admin/faculties', label: 'Faculties', icon: 'account_balance' },
      { href: '/admin/departments', label: 'Departments', icon: 'business' },
      { href: '/admin/programmes', label: 'Programmes', icon: 'school' },
      { href: '/admin/academic-sessions', label: 'Academic Sessions', icon: 'calendar_month' },
      { href: '/admin/semesters', label: 'Semesters', icon: 'calendar_view_month' },
      { href: '/admin/courses', label: 'Modules', icon: 'menu_book' },
    ] as NavItem[],
  },
  {
    title: 'System',
    items: [
      { href: '/admin/calendar', label: 'Academic Calendar', icon: 'calendar_today' },
      { href: '/admin/notifications', label: 'Notifications', icon: 'notifications' },
      { href: '/admin/reports', label: 'Reports & Analytics', icon: 'bar_chart' },
      { href: '/admin/audit', label: 'Audit Logs', icon: 'description' },
      { href: '/admin/backup', label: 'Backup & Restore', icon: 'backup' },
      { href: '/admin/settings', label: 'System Settings', icon: 'settings' },
      { href: '/admin/security', label: 'Security', icon: 'security' },
      { href: '/admin/profile', label: 'Profile', icon: 'person' },
      { href: '/admin/help', label: 'Help & Support', icon: 'help' },
    ] as NavItem[],
  },
];

const deanSections = [
  {
    title: 'Main',
    items: [
      { href: '/dean', label: 'Dashboard', icon: 'dashboard' },
      { href: '/dean/results', label: 'Results Review', icon: 'fact_check' },
      { href: '/dean/graduation', label: 'Graduation Review', icon: 'workspace_premium' },
      { href: '/dean/appeals', label: 'Appeals', icon: 'feedback' },
      { href: '/dean/reports', label: 'Reports', icon: 'assessment' },
    ] as NavItem[],
  },
];

const hodSections = [
  {
    title: 'Main',
    items: [
      { href: '/hod', label: 'Dashboard', icon: 'home' },
      { href: '/hod/students', label: 'Student Management', icon: 'group' },
      { href: '/hod/courses', label: 'Module Assignments', icon: 'menu_book' },
      { href: '/hod/results', label: 'Department Results', icon: 'bar_chart' },
      { href: '/hod/complaints', label: 'Complaints', icon: 'forum' },
      { href: '/hod/reports', label: 'Reports', icon: 'assessment' },
    ] as NavItem[],
  },
];

const examOfficerSections = [
  {
    title: 'Main',
    items: [
      { href: '/exam-officer', label: 'Dashboard', icon: 'dashboard' },
      { href: '/exam-officer/results', label: 'Results Processing', icon: 'engineering' },
      { href: '/exam-officer/carryover', label: 'Carryover', icon: 'inventory' },
      { href: '/exam-officer/transcripts', label: 'Transcripts', icon: 'article' },
      { href: '/exam-officer/graduation', label: 'Graduation', icon: 'school' },
      { href: '/exam-officer/rectification', label: 'Rectification', icon: 'build' },
    ] as NavItem[],
  },
];

const lecturerSections = [
  {
    title: 'Main',
    items: [
      { href: '/lecturer', label: 'Dashboard', icon: 'dashboard' },
      { href: '/lecturer/courses', label: 'My Modules', icon: 'menu_book' },
      { href: '/lecturer/reports', label: 'Reports', icon: 'assessment' },
      { href: '/lecturer/notifications', label: 'Notifications', icon: 'notifications' },
    ] as NavItem[],
  },
];

const studentSections = [
  {
    title: 'Main',
    items: [
      { href: '/student', label: 'Dashboard', icon: 'dashboard' },
      { href: '/student/results', label: 'My Results', icon: 'grade' },
      { href: '/student/transcripts', label: 'Transcripts', icon: 'article' },
      { href: '/student/complaints', label: 'Complaints', icon: 'forum' },
      { href: '/student/profile', label: 'Profile', icon: 'person' },
    ] as NavItem[],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const profile = useMemo(() => (pathname.startsWith('/admin')
    ? { title: 'Admin console', subtitle: 'University administration and operations.', sections: adminSections }
    : pathname.startsWith('/dean')
      ? { title: 'Dean workspace', subtitle: 'Faculty-level academic leadership.', sections: deanSections }
      : pathname.startsWith('/hod')
        ? { title: 'HOD workspace', subtitle: 'Department oversight and coordination.', sections: hodSections }
        : pathname.startsWith('/exam-officer')
          ? { title: 'Exam operations', subtitle: 'Result publication and transcript workflows.', sections: examOfficerSections }
          : pathname.startsWith('/lecturer')
            ? { title: 'Lecturer workspace', subtitle: 'Teaching, scoring, and reporting.', sections: lecturerSections }
            : { title: 'Student portal', subtitle: 'Personal academic tools and records.', sections: studentSections }), [pathname]);

  return (
    <aside className={`relative hidden shrink-0 border-r border-[#1E3A8A]/20 bg-gradient-to-b from-[#0F1F3D] via-[#1A3A6B] to-[#1E3A8A] p-4 text-slate-100 shadow-xl shadow-[#1E3A8A]/10 transition-all duration-500 ease-out lg:block ${collapsed ? 'w-[72px]' : 'w-[280px]'}`}>
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMiI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
      <div className="absolute -right-20 -top-20 h-32 w-32 rounded-full bg-blue-400/10 blur-3xl" />
      <div className="absolute -bottom-20 -left-20 h-32 w-32 rounded-full bg-indigo-400/10 blur-3xl" />

      <div className="relative z-10 mb-6 flex items-center justify-between gap-2">
        {!collapsed ? (
          <div className="animate-fade-in">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#C5A55A]">Slughub</p>
            <h2 className="mt-1 text-base font-semibold text-white">{profile.title}</h2>
            <p className="mt-1 text-xs text-slate-300">{profile.subtitle}</p>
          </div>
        ) : (
          <div className="mx-auto rounded-xl bg-[#1E3A8A]/50 px-2 py-1 text-sm font-semibold text-[#C5A55A] backdrop-blur-sm">S</div>
        )}
        <button
          type="button"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          onClick={() => setCollapsed((prev) => !prev)}
          className="shrink-0 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/60 backdrop-blur-sm transition-all duration-300 hover:bg-white/20 hover:text-white"
        >
          {collapsed ? '»' : '«'}
        </button>
      </div>

      <nav className="relative z-10 space-y-6">
        {profile.sections.map((section) => (
          <div key={section.title} className="animate-fade-in-up">
            {!collapsed ? <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">{section.title}</p> : null}
            <div className="space-y-1">
              {section.items.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href + item.label}
                    href={item.href}
                    className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-300 ease-out ${
                      isActive
                        ? 'bg-[#C5A55A] text-[#0F1F3D] shadow-lg shadow-[#C5A55A]/30'
                        : 'text-slate-300 hover:bg-white/10 hover:text-white hover:shadow-lg hover:shadow-black/5'
                    }`}>
                    {isActive && (
                      <div className="absolute -left-3 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-[#C5A55A] shadow-sm shadow-[#C5A55A]/50" />
                    )}
                    <span className={`material-symbols-outlined text-lg transition-all duration-300 ${isActive ? '' : 'group-hover:scale-110'}`}>{item.icon}</span>
                    {!collapsed ? <span>{item.label}</span> : null}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
// End of file — duplicate/conflict section removed
