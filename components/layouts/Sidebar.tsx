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
      { href: '/admin/users/create', label: 'Create User', icon: 'person_add' },
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
      { href: '/admin/courses', label: 'Courses', icon: 'menu_book' },
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
      { href: '/hod', label: 'Dashboard', icon: '🏠' },
      { href: '/hod/students', label: 'Student Management', icon: '🧑‍🎓' },
      { href: '/hod/courses', label: 'Course Assignments', icon: '📚' },
      { href: '/hod/results', label: 'Department Results', icon: '📊' },
      { href: '/hod/complaints', label: 'Complaints', icon: '📋' },
      { href: '/hod/reports', label: 'Reports', icon: '📈' },
    ],
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
      { href: '/lecturer/courses', label: 'My Courses', icon: 'menu_book' },
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
    <aside className={`hidden shrink-0 border-r border-slate-200 bg-[#1A3A6B] p-4 text-slate-100 transition-all duration-300 lg:block ${collapsed ? 'w-[72px]' : 'w-[280px]'}`}>
      <div className="mb-6 flex items-center justify-between gap-2">
        {!collapsed ? (
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#C5A55A]">Slughub</p>
            <h2 className="mt-1 text-base font-semibold text-white">{profile.title}</h2>
            <p className="mt-1 text-xs text-slate-300">{profile.subtitle}</p>
          </div>
        ) : (
          <div className="mx-auto rounded-xl bg-[#274d85] px-2 py-1 text-sm font-semibold text-[#C5A55A]">S</div>
        )}
        <button
          type="button"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          onClick={() => setCollapsed((prev) => !prev)}
          className="rounded-lg border border-[#3b5f90] bg-[#274d85] px-2 py-1 text-xs text-white"
        >
          {collapsed ? '»' : '«'}
        </button>
      </div>

      <nav className="space-y-6">
        {profile.sections.map((section) => (
          <div key={section.title}>
            {!collapsed ? <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-slate-300">{section.title}</p> : null}
            <div className="space-y-1">
              {section.items.map((item) => (
                <Link
                  key={item.href + item.label}
                  href={item.href}
                  className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition ${pathname === item.href || pathname.startsWith(`${item.href}/`) ? 'bg-[#C5A55A] text-[#1A3A6B]' : 'text-slate-100 hover:bg-[#274d85] hover:text-white'}`}
                >
                  <span className="material-symbols-outlined text-lg">{item.icon}</span>
                  {!collapsed ? <span>{item.label}</span> : null}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
