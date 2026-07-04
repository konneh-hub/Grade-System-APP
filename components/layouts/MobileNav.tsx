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

