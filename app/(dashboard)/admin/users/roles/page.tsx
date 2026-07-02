'use client';

import { FormEvent, useState } from 'react';

type RoleAssignment = { id: number; user: string; role: string };

export default function AdminUserRolesPage() {
  const [rows, setRows] = useState<RoleAssignment[]>([]);
  const [user, setUser] = useState('');
  const [role, setRole] = useState('lecturer');

  function onAssign(event: FormEvent) {
    event.preventDefault();
    if (!user.trim()) return;
    setRows((prev) => [{ id: Date.now(), user: user.trim(), role }, ...prev]);
    setUser('');
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">User Roles</h1>
        <p className="mt-2 text-sm text-slate-600">Assign and review user role memberships.</p>
      </section>

      <form onSubmit={onAssign} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-3">
        <input className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="User (email or name)" value={user} onChange={(e) => setUser(e.target.value)} />
        <select className="rounded-lg border border-slate-300 px-3 py-2 text-sm" value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="admin">Administrator</option>
          <option value="hod">Head of Department</option>
          <option value="lecturer">Lecturer</option>
          <option value="dean">Dean</option>
          <option value="exam_officer">Exam Officer</option>
          <option value="student">Student</option>
        </select>
        <button type="submit" className="rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white">Assign Role</button>
      </form>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Current assignments</h2>
        <div className="mt-3 space-y-2">
          {rows.length === 0 ? <p className="text-sm text-slate-600">No assignments made in this session.</p> : rows.map((item) => (
            <div key={item.id} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
              {item.user} - {item.role}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

