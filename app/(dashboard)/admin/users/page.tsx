import DataTable from '@/components/shared/DataTable';
import UsersPageClient from '@/components/admin/UsersPageClient';

async function getUsers() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/users`, { cache: 'no-store' });
  return res.json();
}

export default async function Page() {
  const rows = await getUsers();

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#1E3A8A]">Administration</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">User administration</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Review registered accounts, manage active status, and track the people in the platform.
            </p>
          </div>
          <UsersPageClient />
        </div>
      </section>

      <DataTable
        title="Platform users"
        description="A list of all registered user accounts."
        rows={rows}
        emptyMessage="No users have been created yet."
        columns={[
          { header: 'Name', accessor: 'first_name' },
          { header: 'Email', accessor: 'email' },
          { header: 'Phone', accessor: 'phone' },
          { header: 'Status', accessor: 'status' },
        ]}
      />
    </div>
  );
}
