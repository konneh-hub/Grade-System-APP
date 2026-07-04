'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function TopNav() {
  const pathname = usePathname();
  const [profileOpen, setProfileOpen] = useState(false);

  const roleProfile = useMemo(() => {
    if (pathname.startsWith('/admin')) {
      return {
        role: 'System Administrator',
        user: 'Admin User',
        title: 'Admin Control Room',
        searchPlaceholder: 'Search users, structure, reports, audit logs',
        quickLinks: [
          { label: 'My Dashboard', href: '/admin' },
          { label: 'System Settings', href: '/admin/settings' },
          { label: 'Notifications', href: '/admin/notifications' },
        ],
      };
    }

    if (pathname.startsWith('/dean')) {
      return {
        role: 'Dean',
        user: 'Dean User',
        title: 'Dean Academic Command',
        searchPlaceholder: 'Search result reviews, graduation, appeals',
        quickLinks: [
          { label: 'My Dashboard', href: '/dean' },
          { label: 'Results Review', href: '/dean/results' },
          { label: 'Faculty Reports', href: '/dean/reports' },
        ],
      };
    }

    if (pathname.startsWith('/hod')) {
      return {
        role: 'HOD',
        user: 'HOD User',
        title: 'HOD Department Desk',
        searchPlaceholder: 'Search students, courses, complaints, reports',
        quickLinks: [
          { label: 'My Dashboard', href: '/hod' },
          { label: 'Student Management', href: '/hod/students' },
          { label: 'Course Assignments', href: '/hod/courses' },
        ],
      };
    }

    if (pathname.startsWith('/exam-officer')) {
      return {
        role: 'Exam Officer',
        user: 'Exam Officer User',
        title: 'Exam Operations Center',
        searchPlaceholder: 'Search processing queue, transcripts, carryover',
        quickLinks: [
          { label: 'My Dashboard', href: '/exam-officer' },
          { label: 'Results Processing', href: '/exam-officer/results' },
          { label: 'Transcript Operations', href: '/exam-officer/transcripts' },
        ],
      };
    }

    if (pathname.startsWith('/lecturer')) {
      return {
        role: 'Lecturer',
        user: 'Lecturer User',
        title: 'Lecturer Teaching Desk',
        searchPlaceholder: 'Search courses, score sheets, reports',
        quickLinks: [
          { label: 'My Dashboard', href: '/lecturer' },
          { label: 'My Courses', href: '/lecturer/courses' },
          { label: 'Teaching Reports', href: '/lecturer/reports' },
        ],
      };
    }

    return {
      role: 'Student',
      user: 'Student User',
      title: 'Student Academic Desk',
      searchPlaceholder: 'Search results, transcript requests, complaints',
      quickLinks: [
        { label: 'My Dashboard', href: '/student' },
        { label: 'My Results', href: '/student/results' },
        { label: 'My Profile', href: '/student/profile' },
      ],
    };
  }, [pathname]);

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#1A3A6B]">Slughub</p>
          <h1 className="text-[22px] font-semibold text-slate-900">{roleProfile.title}</h1>
          <p className="text-xs text-slate-500">University Result Management System</p>
        </div>

        <div className="flex min-w-[240px] flex-1 items-center justify-center">
          <div className="relative w-full max-w-xl">
            <input
              type="search"
              title="Global search"
              placeholder={roleProfile.searchPlaceholder}
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-800 outline-none transition focus:border-[#1A3A6B] focus:bg-white"
            />
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-medium uppercase tracking-wide text-slate-500">Search</div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50" type="button" title="Notifications">
            <span className="inline-flex items-center gap-1">🔔 <span className="rounded-full bg-[#C5A55A] px-1.5 py-0.5 text-[10px] font-semibold text-[#1A3A6B]">3</span></span>
          </button>
          <div className="relative">
            <button
              type="button"
              title="Profile menu"
              aria-label="Profile menu"
              onClick={() => setProfileOpen((prev) => !prev)}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#1A3A6B] text-xs font-semibold text-white">
                {roleProfile.user.split(' ').map((part) => part[0]).join('').slice(0, 2)}
              </span>
              <span className="hidden text-left sm:block">
                <span className="block text-xs font-semibold text-slate-900">{roleProfile.user}</span>
                <span className="block text-[11px] text-slate-500">{roleProfile.role}</span>
              </span>
              <span aria-hidden="true">▾</span>
            </button>

            {profileOpen ? (
              <div className="absolute right-0 top-12 z-30 w-56 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
                <div className="border-b border-slate-100 px-2 pb-2">
                  <p className="text-sm font-semibold text-slate-900">{roleProfile.user}</p>
                  <p className="text-xs text-slate-500">{roleProfile.role}</p>
                </div>
                <div className="mt-2 space-y-1">
                  {roleProfile.quickLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="block rounded-lg px-2 py-1.5 text-sm text-slate-700 transition hover:bg-slate-50"
                      onClick={() => setProfileOpen(false)}
                    >
                      {link.label}
                    </Link>
                  ))}
                  <Link
                    href="/logout"
                    className="block rounded-lg px-2 py-1.5 text-sm font-medium text-rose-700 transition hover:bg-rose-50"
                    onClick={() => setProfileOpen(false)}
                  >
                    Logout
                  </Link>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
