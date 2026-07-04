"use client";

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const adminSections = [
  {
    title: 'Main',
    items: [
      { href: '/admin', label: 'Dashboard', icon: '🏠' },
      { href: '/admin/users', label: 'User Management', icon: '👥' },
      { href: '/admin/users/create', label: 'Create User', icon: '➕' },
      { href: '/admin/users/roles', label: 'User Roles', icon: '🛡️' },
    ],
  },
  {
    title: 'Academic Structure',
    items: [
      { href: '/admin/faculties', label: 'Faculties', icon: '🏛️' },
      { href: '/admin/departments', label: 'Departments', icon: '🏢' },
      { href: '/admin/programmes', label: 'Programmes', icon: '🎓' },
      { href: '/admin/academic-sessions', label: 'Academic Sessions', icon: '📆' },
      { href: '/admin/semesters', label: 'Semesters', icon: '🗓️' },
      { href: '/admin/courses', label: 'Courses', icon: '📚' },
    ],
  },
  {
    title: 'System',
    items: [
      { href: '/admin/calendar', label: 'Academic Calendar', icon: '📅' },
      { href: '/admin/notifications', label: 'Notifications', icon: '🔔' },
      { href: '/admin/reports', label: 'Reports & Analytics', icon: '📊' },
      { href: '/admin/audit', label: 'Audit Logs', icon: '📝' },
      { href: '/admin/backup', label: 'Backup & Restore', icon: '💾' },
      { href: '/admin/settings', label: 'System Settings', icon: '⚙️' },
      { href: '/admin/security', label: 'Security', icon: '🔐' },
      { href: '/admin/profile', label: 'Profile', icon: '👤' },
      { href: '/admin/help', label: 'Help & Support', icon: '❓' },
    ],
  },
];

const deanSections = [
  {
    title: 'Main',
    items: [
      { href: '/dean', label: 'Dashboard', icon: '🏠' },
      { href: '/dean/results', label: 'Results Review', icon: '📊' },
      { href: '/dean/graduation', label: 'Graduation Review', icon: '🎓' },
      { href: '/dean/appeals', label: 'Appeals', icon: '📋' },
      { href: '/dean/reports', label: 'Reports', icon: '📈' },
    ],
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
      { href: '/exam-officer', label: 'Dashboard', icon: '🏠' },
      { href: '/exam-officer/results', label: 'Results Processing', icon: '⚙️' },
      { href: '/exam-officer/carryover', label: 'Carryover', icon: '📦' },
      { href: '/exam-officer/transcripts', label: 'Transcripts', icon: '📄' },
      { href: '/exam-officer/graduation', label: 'Graduation', icon: '🎓' },
      { href: '/exam-officer/rectification', label: 'Rectification', icon: '🛠️' },
    ],
  },
];

const lecturerSections = [
  {
    title: 'Main',
    items: [
      { href: '/lecturer', label: 'Dashboard', icon: '🏠' },
      { href: '/lecturer/courses', label: 'My Courses', icon: '📚' },
      { href: '/lecturer/reports', label: 'Reports', icon: '📊' },
      { href: '/lecturer/notifications', label: 'Notifications', icon: '🔔' },
    ],
  },
];

const studentSections = [
  {
    title: 'Main',
    items: [
      { href: '/student', label: 'Dashboard', icon: '🏠' },
      { href: '/student/results', label: 'My Results', icon: '📊' },
      { href: '/student/transcripts', label: 'Transcripts', icon: '📄' },
      { href: '/student/complaints', label: 'Complaints', icon: '📋' },
      { href: '/student/profile', label: 'Profile', icon: '👤' },
    ],
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
                  <span aria-hidden="true">{item.icon}</span>
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
