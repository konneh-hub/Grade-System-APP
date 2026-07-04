<<<<<<< HEAD
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

type NavItem = { href: string; label: string; icon: string };

function getMobileItems(pathname: string): NavItem[] {
	if (pathname.startsWith('/admin')) {
		return [
			{ href: '/admin', label: 'Home', icon: 'home' },
			{ href: '/admin/users', label: 'Users', icon: 'group' },
			{ href: '/admin/courses', label: 'Courses', icon: 'menu_book' },
			{ href: '/admin/reports', label: 'Reports', icon: 'bar_chart' },
			{ href: '/admin/settings', label: 'Settings', icon: 'settings' },
		];
	}

	if (pathname.startsWith('/dean')) {
		return [
			{ href: '/dean', label: 'Home', icon: 'home' },
			{ href: '/dean/results', label: 'Results', icon: 'fact_check' },
			{ href: '/dean/graduation', label: 'Grad', icon: 'workspace_premium' },
			{ href: '/dean/appeals', label: 'Appeals', icon: 'feedback' },
			{ href: '/dean/reports', label: 'Reports', icon: 'assessment' },
		];
	}

	if (pathname.startsWith('/hod')) {
		return [
			{ href: '/hod', label: 'Home', icon: '🏠' },
			{ href: '/hod/students', label: 'Students', icon: '🧑‍🎓' },
			{ href: '/hod/courses', label: 'Courses', icon: '📚' },
			{ href: '/hod/results', label: 'Results', icon: '📊' },
			{ href: '/hod/complaints', label: 'Complaints', icon: '📋' },
		];
	}

	if (pathname.startsWith('/exam-officer')) {
		return [
			{ href: '/exam-officer', label: 'Home', icon: 'home' },
			{ href: '/exam-officer/results', label: 'Results', icon: 'engineering' },
			{ href: '/exam-officer/transcripts', label: 'Scripts', icon: 'article' },
			{ href: '/exam-officer/carryover', label: 'Carryover', icon: 'inventory' },
			{ href: '/exam-officer/rectification', label: 'Fixes', icon: 'build' },
		];
	}

	if (pathname.startsWith('/lecturer')) {
		return [
			{ href: '/lecturer', label: 'Home', icon: 'home' },
			{ href: '/lecturer/courses', label: 'Courses', icon: 'menu_book' },
			{ href: '/lecturer/reports', label: 'Reports', icon: 'assessment' },
			{ href: '/lecturer/notifications', label: 'Alerts', icon: 'notifications' },
			{ href: '/lecturer', label: 'Classes', icon: 'school' },
		];
	}

	return [
		{ href: '/student', label: 'Home', icon: 'home' },
		{ href: '/student/results', label: 'Results', icon: 'grade' },
		{ href: '/student/transcripts', label: 'Scripts', icon: 'article' },
		{ href: '/student/complaints', label: 'Complaints', icon: 'forum' },
		{ href: '/student/profile', label: 'Profile', icon: 'person' },
	];
}

export default function MobileNav() {
	const pathname = usePathname();
	const items = getMobileItems(pathname);

	return (
		<nav className="fixed bottom-0 left-0 right-0 z-20 border-t border-slate-200 bg-white/95 p-2 backdrop-blur lg:hidden" aria-label="Mobile navigation">
			<div className="grid grid-cols-5 gap-1">
				{items.map((item) => {
					const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
					return (
						<Link
							key={item.href}
							href={item.href}
							className={`flex flex-col items-center rounded-lg px-1 py-2 text-[11px] font-medium ${isActive ? 'bg-[#1A3A6B] text-white' : 'text-slate-600 hover:bg-slate-100'}`}
						>
							<span className="material-symbols-outlined text-lg">{item.icon}</span>
							<span>{item.label}</span>
						</Link>
					);
				})}
			</div>
		</nav>
	);
}

=======
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

type NavItem = { href: string; label: string; icon: string };

function getMobileItems(pathname: string): NavItem[] {
  if (pathname.startsWith('/admin')) {
    return [
      { href: '/admin', label: 'Home', icon: 'home' },
      { href: '/admin/users', label: 'Users', icon: 'group' },
      { href: '/admin/courses', label: 'Courses', icon: 'menu_book' },
      { href: '/admin/reports', label: 'Reports', icon: 'bar_chart' },
      { href: '/admin/settings', label: 'Settings', icon: 'settings' },
    ];
  }

  if (pathname.startsWith('/dean')) {
    return [
      { href: '/dean', label: 'Home', icon: 'home' },
      { href: '/dean/results', label: 'Results', icon: 'fact_check' },
      { href: '/dean/graduation', label: 'Grad', icon: 'workspace_premium' },
      { href: '/dean/appeals', label: 'Appeals', icon: 'feedback' },
      { href: '/dean/reports', label: 'Reports', icon: 'assessment' },
    ];
  }

  if (pathname.startsWith('/exam-officer')) {
    return [
      { href: '/exam-officer', label: 'Home', icon: 'home' },
      { href: '/exam-officer/results', label: 'Results', icon: 'engineering' },
      { href: '/exam-officer/transcripts', label: 'Scripts', icon: 'article' },
      { href: '/exam-officer/carryover', label: 'Carryover', icon: 'inventory' },
      { href: '/exam-officer/rectification', label: 'Fixes', icon: 'build' },
    ];
  }

  if (pathname.startsWith('/lecturer')) {
    return [
      { href: '/lecturer', label: 'Home', icon: 'home' },
      { href: '/lecturer/courses', label: 'Courses', icon: 'menu_book' },
      { href: '/lecturer/reports', label: 'Reports', icon: 'assessment' },
      { href: '/lecturer/notifications', label: 'Alerts', icon: 'notifications' },
      { href: '/lecturer', label: 'Classes', icon: 'school' },
    ];
  }

  return [
    { href: '/student', label: 'Home', icon: 'home' },
    { href: '/student/results', label: 'Results', icon: 'grade' },
    { href: '/student/transcripts', label: 'Scripts', icon: 'article' },
    { href: '/student/complaints', label: 'Complaints', icon: 'forum' },
    { href: '/student/profile', label: 'Profile', icon: 'person' },
  ];
}

export default function MobileNav() {
  const pathname = usePathname();
  const items = getMobileItems(pathname);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200/80 bg-white/90 p-2 backdrop-blur-xl lg:hidden shadow-[0_-4px_20px_rgba(0,0,0,0.05)]" aria-label="Mobile navigation">
      <div className="grid grid-cols-5 gap-1">
        {items.map((item, i) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href + item.label}
              href={item.href}
              className={`flex flex-col items-center rounded-xl px-1 py-2 text-[11px] font-medium transition-all duration-300 ${
                isActive
                  ? 'bg-gradient-to-b from-[#1A3A6B] to-[#1E3A8A] text-white shadow-lg shadow-[#1E3A8A]/30 scale-105'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
              }`}
              style={{ animation: `fade-in-up 0.3s ease-out both`, animationDelay: `${i * 0.04}s` }}
            >
              <span className="material-symbols-outlined text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
>>>>>>> 282af18e596989eae4e3de4f33dfe1015e3f4af8
