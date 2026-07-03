'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

type NavItem = { href: string; label: string; icon: string };

function getMobileItems(pathname: string): NavItem[] {
	if (pathname.startsWith('/admin')) {
		return [
			{ href: '/admin', label: 'Home', icon: '🏠' },
			{ href: '/admin/users', label: 'Users', icon: '👥' },
			{ href: '/admin/courses', label: 'Courses', icon: '📚' },
			{ href: '/admin/reports', label: 'Reports', icon: '📊' },
			{ href: '/admin/settings', label: 'Settings', icon: '⚙️' },
		];
	}

	if (pathname.startsWith('/dean')) {
		return [
			{ href: '/dean', label: 'Home', icon: '🏠' },
			{ href: '/dean/results', label: 'Results', icon: '📊' },
			{ href: '/dean/graduation', label: 'Grad', icon: '🎓' },
			{ href: '/dean/appeals', label: 'Appeals', icon: '📋' },
			{ href: '/dean/reports', label: 'Reports', icon: '📈' },
		];
	}

	if (pathname.startsWith('/exam-officer')) {
		return [
			{ href: '/exam-officer', label: 'Home', icon: '🏠' },
			{ href: '/exam-officer/results', label: 'Results', icon: '⚙️' },
			{ href: '/exam-officer/transcripts', label: 'Scripts', icon: '📄' },
			{ href: '/exam-officer/carryover', label: 'Carryover', icon: '📦' },
			{ href: '/exam-officer/rectification', label: 'Fixes', icon: '🛠️' },
		];
	}

	if (pathname.startsWith('/lecturer')) {
		return [
			{ href: '/lecturer', label: 'Home', icon: '🏠' },
			{ href: '/lecturer/courses', label: 'Courses', icon: '📚' },
			{ href: '/lecturer/reports', label: 'Reports', icon: '📊' },
			{ href: '/lecturer/notifications', label: 'Alerts', icon: '🔔' },
			{ href: '/lecturer/courses', label: 'Classes', icon: '🧑‍🏫' },
		];
	}

	return [
		{ href: '/student', label: 'Home', icon: '🏠' },
		{ href: '/student/results', label: 'Results', icon: '📊' },
		{ href: '/student/transcripts', label: 'Scripts', icon: '📄' },
		{ href: '/student/complaints', label: 'Complaints', icon: '📋' },
		{ href: '/student/profile', label: 'Profile', icon: '👤' },
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
							<span aria-hidden="true" className="text-sm">{item.icon}</span>
							<span>{item.label}</span>
						</Link>
					);
				})}
			</div>
		</nav>
	);
}

