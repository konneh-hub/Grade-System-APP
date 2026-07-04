import DashboardLayout from '@/components/layouts/DashboardLayout';

export default function DashboardRouteLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <DashboardLayout>{children}</DashboardLayout>;
}

