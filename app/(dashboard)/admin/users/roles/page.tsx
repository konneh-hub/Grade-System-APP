'use client';

import { FormEvent, useEffect, useState } from 'react';

type UserRow = { id: number; first_name: string; last_name: string; email: string; roles: string[] };
type Role = { id: number; name: string };

export default function AdminUserRolesPage() {
  const [rows, setRows] = useState<UserRow[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [userId, setUserId] = useState('');
  const [role, setRole] = useState('lecturer');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    void loadData();
  }, []);

  async function loadData() {
    try {
      const [usersRes, rolesRes] = await Promise.all([
        fetch('/api/users', { cache: 'no-store' }),
        fetch('/api/users/1/roles', { cache: 'no-store' }),
      ]);

      const usersPayload = (await usersRes.json()) as UserRow[] | { error?: string };
      const rolesPayload = (await rolesRes.json()) as Role[] | { error?: string };

      if (!usersRes.ok) throw new Error((usersPayload as { error?: string }).error || 'Failed to load users');
      if (!rolesRes.ok) throw new Error((rolesPayload as { error?: string }).error || 'Failed to load roles');

      setRows(usersPayload as UserRow[]);
      setRoles((rolesPayload as Role[]).length > 0 ? (rolesPayload as Role[]) : [
        { id: 1, name: 'admin' },
        { id: 2, name: 'hod' },
        { id: 3, name: 'lecturer' },
        { id: 4, name: 'dean' },
        { id: 5, name: 'exam_officer' },
        { id: 6, name: 'student' },
      ]);
    } catch {
      setRoles([
        { id: 1, name: 'admin' },
        { id: 2, name: 'hod' },
        { id: 3, name: 'lecturer' },
        { id: 4, name: 'dean' },
        { id: 5, name: 'exam_officer' },
        { id: 6, name: 'student' },
      ]);
    }
  }

  async function onAssign(event: FormEvent) {
    event.preventDefault();
    if (!userId) return;

    setError('');
    setMessage('');
    try {
      const response = await fetch(`/api/users/${userId}/roles`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roles: [role] }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error || 'Failed to assign role');
      setMessage('Role assigned successfully.');
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign role');
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">User Roles</h1>
        <p className="mt-2 text-sm text-slate-600">Assign and review user role memberships.</p>
      </section>

      <form onSubmit={onAssign} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-3">
        <label className="block">
          <span className="sr-only">Select user</span>
          <select className="rounded-lg border border-slate-300 px-3 py-2 text-sm" value={userId} onChange={(event) => setUserId(event.target.value)} aria-label="Select user">
            <option value="">Select user</option>
            {rows.map((item) => (
              <option key={item.id} value={item.id}>{item.first_name} {item.last_name} ({item.email})</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="sr-only">Role</span>
          <select className="rounded-lg border border-slate-300 px-3 py-2 text-sm" value={role} onChange={(e) => setRole(e.target.value)} aria-label="Role">
            {roles.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}
          </select>
        </label>
        <button type="submit" className="rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white">Assign Role</button>
        {error ? <p className="md:col-span-3 text-sm text-rose-700">{error}</p> : null}
        {message ? <p className="md:col-span-3 text-sm text-emerald-700">{message}</p> : null}
      </form>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Current assignments</h2>
        <div className="mt-3 space-y-2">
          {rows.length === 0 ? <p className="text-sm text-slate-600">No assignments available.</p> : rows.map((item) => (
            <div key={item.id} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
              {item.first_name} {item.last_name} ({item.email}) - {(item.roles || []).join(', ') || 'none'}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

