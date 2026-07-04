import type { ReactNode } from 'react';
import Sidebar from '@/components/layouts/Sidebar';
import TopNav from '@/components/layouts/TopNav';
import MobileNav from '@/components/layouts/MobileNav';

export default function DashboardLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="flex min-h-screen bg-[#F7FAFC]">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopNav />
        <main className="flex-1 p-4 pb-24 sm:p-6 sm:pb-24 lg:pb-6">{children}</main>
        <MobileNav />
      </div>
    </div>
  );
}
