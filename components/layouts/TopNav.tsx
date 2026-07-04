'use client';

import { useMemo, useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function TopNav() {
  const pathname = usePathname();
  const [profileOpen, setProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

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
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/80 px-4 py-3 backdrop-blur-xl sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="animate-fade-in">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#1A3A6B]">Slughub</p>
          <h1 className="text-[22px] font-semibold text-slate-900">{roleProfile.title}</h1>
          <p className="text-xs text-slate-500">University Result Management System</p>
        </div>

        <div className="flex min-w-[240px] flex-1 items-center justify-center">
          <div className="group relative w-full max-w-xl">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-lg text-slate-400 transition-all duration-300 group-focus-within:text-[#1A3A6B]">search</span>
            <input
              type="search"
              title="Global search"
              placeholder={roleProfile.searchPlaceholder}
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-800 outline-none transition-all duration-300 ease-out placeholder:text-slate-400 hover:border-slate-300 focus:border-[#1A3A6B] focus:bg-white focus:shadow-lg focus:shadow-[#1A3A6B]/10 focus:ring-4 focus:ring-[#1A3A6B]/10"
            />
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-400 transition-all duration-300 group-focus-within:border-[#1A3A6B]/20 group-focus-within:bg-[#1A3A6B]/10 group-focus-within:text-[#1A3A6B]">
              ⌘K
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            className="group relative rounded-xl border border-slate-200 bg-white p-2.5 text-sm font-medium text-slate-700 transition-all duration-300 hover:border-slate-300 hover:bg-slate-50 hover:shadow-md"
            type="button"
            title="Notifications"
          >
            <span className="material-symbols-outlined text-xl text-slate-500 transition-all duration-300 group-hover:text-[#1A3A6B]">notifications</span>
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#C5A55A] text-[9px] font-bold text-[#1A3A6B] shadow-sm">3</span>
          </button>
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              title="Profile menu"
              aria-label="Profile menu"
              onClick={() => setProfileOpen((prev) => !prev)}
              className="group flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-all duration-300 hover:border-slate-300 hover:bg-slate-50 hover:shadow-md"
            >
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[#1A3A6B] to-[#1E3A8A] text-xs font-semibold text-white shadow-sm transition-all duration-300 group-hover:shadow-md group-hover:shadow-[#1A3A6B]/30">
                {roleProfile.user.split(' ').map((part) => part[0]).join('').slice(0, 2)}
              </span>
              <span className="hidden text-left sm:block">
                <span className="block text-xs font-semibold text-slate-900">{roleProfile.user}</span>
                <span className="block text-[11px] text-slate-500">{roleProfile.role}</span>
              </span>
              <span className={`material-symbols-outlined text-lg text-slate-400 transition-all duration-300 ${profileOpen ? 'rotate-180' : ''}`}>expand_more</span>
            </button>

            {profileOpen && (
              <div className="absolute right-0 top-12 z-30 w-56 origin-top-right rounded-xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-200/50 animate-scale-in">
                <div className="border-b border-slate-100 px-2 pb-2">
                  <p className="text-sm font-semibold text-slate-900">{roleProfile.user}</p>
                  <p className="text-xs text-slate-500">{roleProfile.role}</p>
                </div>
                <div className="mt-2 space-y-1">
                  {roleProfile.quickLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="group flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-slate-700 transition-all duration-200 hover:bg-slate-50 hover:text-[#1A3A6B]"
                      onClick={() => setProfileOpen(false)}
                    >
                      <span className="material-symbols-outlined text-lg text-slate-400 transition-all duration-200 group-hover:text-[#1A3A6B]">chevron_right</span>
                      {link.label}
                    </Link>
                  ))}
                  <div className="border-t border-slate-100 pt-1">
                    <Link
                      href="/logout"
                      className="group flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-rose-700 transition-all duration-200 hover:bg-rose-50"
                      onClick={() => setProfileOpen(false)}
                    >
                      <span className="material-symbols-outlined text-lg text-rose-400 transition-all duration-200 group-hover:text-rose-600">logout</span>
                      Logout
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
