import type { ReactNode } from 'react';
import Sidebar from '@/components/layouts/Sidebar';
import TopNav from '@/components/layouts/TopNav';
import MobileNav from '@/components/layouts/MobileNav';

export default function DashboardLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="relative flex min-h-screen bg-gradient-to-br from-[#F8FAFC] via-white to-[#F1F5F9]">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-[#1E3A8A]/[0.03] blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-80 w-80 rounded-full bg-[#1E3A8A]/[0.03] blur-3xl" />
      </div>
      <Sidebar />
      <div className="relative flex min-w-0 flex-1 flex-col">
        <TopNav />
        <main className="flex-1 p-4 pb-24 sm:p-6 sm:pb-24 lg:pb-6 animate-fade-in">{children}</main>
        <MobileNav />
      </div>
    </div>
  );
}
