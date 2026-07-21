'use client';

import { useCallback, FormEvent, useEffect, useState } from 'react';

type UserRow = { id: number; first_name: string; last_name: string; email: string; roles: string[] };
type Role = { id: number; name: string };

export default function AdminUserRolesPage() {
  const [rows, setRows] = useState<UserRow[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [userId, setUserId] = useState('');
  const [role, setRole] = useState('lecturer');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function onAssign(event: FormEvent) {
    event.preventDefault();
    setError('');
    setMessage('');

    try {
      const response = await fetch(`/api/users/${userId}/roles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      const payload = (await response.json()) as { error?: string; message?: string };
      if (!response.ok) throw new Error(payload.error || 'Failed to assign role');
      setMessage(payload.message || 'Role assigned successfully.');
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign role');
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">User Roles</h1>
        <p className="mt-2 text-sm text-slate-600">Assign and manage user roles.</p>
      </section>

      <form onSubmit={onAssign} className="flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <label className="block text-xs font-medium text-slate-700">User ID</label>
          <input
            type="number"
            className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm w-28"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="e.g. 1"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700">Role</label>
          <select
            className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            {roles.map((r) => (
              <option key={r.id} value={r.name}>{r.name}</option>
            ))}
          </select>
        </div>
        <button type="submit" className="rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white">Assign</button>
      </form>

      {error ? <p className="text-sm text-rose-700">{error}</p> : null}
      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Users &amp; Roles</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b text-xs font-medium text-slate-500 uppercase">
                <th className="py-2 pr-4">ID</th>
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">Email</th>
                <th className="py-2 pr-4">Roles</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b last:border-b-0">
                  <td className="py-2 pr-4 text-slate-700">{row.id}</td>
                  <td className="py-2 pr-4 text-slate-700">{row.first_name} {row.last_name}</td>
                  <td className="py-2 pr-4 text-slate-700">{row.email}</td>
                  <td className="py-2 pr-4 text-slate-700">{(row.roles || []).join(', ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}


