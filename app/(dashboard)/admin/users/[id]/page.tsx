'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

type UserDetail = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  status: string;
  roles: string[];
  registered_at: string | null;
  last_login_at: string | null;
};

export default function Page() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const userId = params?.id;

  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState<UserDetail | null>(null);

  useEffect(() => {
    void loadUser();
  }, [userId]);

  async function loadUser() {
    if (!userId) return;
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/users/${userId}`, { cache: 'no-store' });
      const payload = (await response.json()) as UserDetail | { error?: string };
      if (!response.ok) throw new Error((payload as { error?: string }).error || 'Failed to load user');
      setUser(payload as UserDetail);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load user');
    } finally {
      setLoading(false);
    }
  }

  async function onDelete() {
    if (!userId) return;
    if (!window.confirm('Delete this user account? This action cannot be undone.')) return;

    setDeleting(true);
    setError('');

    try {
      const response = await fetch(`/api/users/${userId}`, { method: 'DELETE' });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error || 'Failed to delete user');

      router.push('/admin/users');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user');
    } finally {
      setDeleting(false);
    }
  }

  const fullName = useMemo(() => {
    if (!user) return '';
    return `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Unnamed user';
  }, [user]);

  if (loading) {
    return <main className="p-6 text-sm text-slate-600">Loading user profile...</main>;
  }

  if (!user) {
    return <main className="p-6 text-sm text-rose-700">{error || 'User not found.'}</main>;
  }

  return (
    <main className="space-y-6 p-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">{fullName}</h1>
            <p className="mt-1 text-sm text-slate-600">{user.email}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/users" className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700">Back</Link>
            <Link href={`/admin/users/${user.id}/edit`} className="rounded-lg bg-[#1A3A6B] px-3 py-2 text-sm font-semibold text-white">Edit user</Link>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Account summary</h2>
        <div className="mt-4 grid gap-3 text-sm text-slate-700 md:grid-cols-2">
          <p><span className="font-semibold">Phone:</span> {user.phone || '-'}</p>
          <p><span className="font-semibold">Status:</span> {user.status}</p>
          <p><span className="font-semibold">Roles:</span> {user.roles.length > 0 ? user.roles.join(', ') : 'none'}</p>
          <p><span className="font-semibold">Registered:</span> {user.registered_at ? new Date(user.registered_at).toLocaleString() : 'pending'}</p>
          <p><span className="font-semibold">Last login:</span> {user.last_login_at ? new Date(user.last_login_at).toLocaleString() : 'never'}</p>
        </div>
      </section>

      <section className="rounded-2xl border border-rose-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-rose-700">Danger zone</h2>
        <p className="mt-2 text-sm text-slate-600">Deleting a user permanently removes this account.</p>
        <div className="mt-4 flex items-center gap-3">
          <button disabled={deleting} type="button" onClick={onDelete} className="rounded-lg border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 disabled:opacity-60">{deleting ? 'Deleting...' : 'Delete user'}</button>
          {error ? <p className="text-sm text-rose-700">{error}</p> : null}
        </div>
      </section>
    </main>
  );
}
