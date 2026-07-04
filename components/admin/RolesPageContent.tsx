"use client";
import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, AreaChart, Area,
} from "recharts";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface Role {
  id: number;
  name: string;
  description: string | null;
  created_at: string | null;
  user_count: number;
  permissions: string[];
}

type SortField = "name" | "user_count" | "description" | "permissions";
type SortDir = "asc" | "desc";

const ROLE_COLORS: Record<string, string> = {
  admin: "#1E3A8A",
  dean: "#7C3AED",
  hod: "#0891B2",
  lecturer: "#059669",
  exam_officer: "#D97706",
  student: "#DC2626",
};

const PERMISSION_COLORS = ["#1E3A8A", "#7C3AED", "#0891B2", "#059669", "#D97706", "#DC2626", "#EA580C", "#0284C7"];

function getSortValue(role: Role, field: SortField): string | number {
  if (field === "permissions") return (role.permissions || []).join(", ");
  if (field === "user_count") return role.user_count;
  return String(role[field] ?? "");
}

export default function RolesPageContent() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  /* ── assign role state ── */
  const [assignUserId, setAssignUserId] = useState<number | "">("");
  const [assignRole, setAssignRole] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [assignMsg, setAssignMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [users, setUsers] = useState<{ id: number; email: string; first_name: string; last_name: string }[]>([]);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch("/api/roles").then((r) => r.json()),
      fetch("/api/users").then((r) => r.json()),
    ])
      .then(([rolesData, usersData]) => {
        setRoles(rolesData as Role[]);
        setUsers(usersData as { id: number; email: string; first_name: string; last_name: string }[]);
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleAssignRole() {
    if (!assignUserId || !assignRole) return;
    setAssigning(true);
    setAssignMsg(null);
    const found = users.find((u) => u.id === assignUserId);
    try {
      const res = await fetch(`/api/users/${assignUserId}/roles`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roles: [assignRole] }),
      });
      const payload = await res.json() as { error?: string };
      if (!res.ok) throw new Error(payload.error || "Failed to assign role");
      setAssignMsg({
        type: "success",
        text: `Role "${assignRole}" assigned to ${found?.first_name ?? ""} ${found?.last_name ?? ""} (${found?.email ?? ""}).`,
      });
      setAssignUserId("");
      setAssignRole("");
      const updated = await fetch("/api/roles").then((r) => r.json());
      setRoles(updated as Role[]);
    } catch (err) {
      setAssignMsg({ type: "error", text: err instanceof Error ? err.message : "Failed to assign role." });
    } finally {
      setAssigning(false);
    }
  }

  const filteredRoles = useMemo(() => {
    if (!searchQuery.trim()) return roles;
    const q = searchQuery.toLowerCase();
    return roles.filter((r) => {
      const name = r.name.toLowerCase();
      const desc = (r.description || "").toLowerCase();
      const perms = (r.permissions || []).join(" ").toLowerCase();
      return name.includes(q) || desc.includes(q) || perms.includes(q);
    });
  }, [roles, searchQuery]);

  const sortedRoles = useMemo(() => {
    const copy = [...filteredRoles];
    copy.sort((a, b) => {
      const av = getSortValue(a, sortField);
      const bv = getSortValue(b, sortField);
      const cmp = typeof av === "number" && typeof bv === "number" ? av - bv : String(av).localeCompare(String(bv));
      return sortDir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [filteredRoles, sortField, sortDir]);

  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("asc"); }
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return <span className="ml-1 text-slate-300">&#8597;</span>;
    return <span className="ml-1 text-[#1E3A8A]">{sortDir === "asc" ? "↑" : "↓"}</span>;
  }

  function toggleSelect(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === sortedRoles.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(sortedRoles.map((r) => r.id)));
  }

  /* ── stat computations ── */
  const totalRoles = roles.length;
  const allPermissions = new Set<string>();
  for (const r of roles) for (const p of r.permissions) allPermissions.add(p);
  const totalPermissions = allPermissions.size;
  const mostAssigned = roles.reduce((max, r) => (r.user_count > (max?.user_count ?? -1) ? r : max), roles[0]);
  const leastAssigned = roles.reduce((min, r) => (!min || r.user_count < min.user_count ? r : min), roles[0]);

  /* ── chart data ── */
  const userCountData = useMemo(
    () => [...roles].sort((a, b) => b.user_count - a.user_count).map((r) => ({ name: r.name, users: r.user_count })),
    [roles]
  );

  const permCountData = useMemo(
    () => [...roles].sort((a, b) => b.permissions.length - a.permissions.length).map((r) => ({ name: r.name, permissions: r.permissions.length })),
    [roles]
  );

  const permissionDistData = useMemo(() => {
    const map: Record<string, number> = {};
    for (const r of roles) for (const p of r.permissions) map[p] = (map[p] || 0) + 1;
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [roles]);

  /* ── exports ── */
  function exportExcel(data: Role[], filename = "roles.xlsx") {
    const rows = data.map((r) => ({
      Name: r.name,
      Description: r.description || "",
      "User Count": r.user_count,
      Permissions: (r.permissions || []).join(", "),
      "Created At": r.created_at || "",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Roles");
    XLSX.writeFile(wb, filename);
  }

  function exportSingleExcel(role: Role) {
    exportExcel([role], `role-${role.name}.xlsx`);
  }

  function exportPDF(data: Role[], filename = "roles.pdf") {
    const doc = new jsPDF("landscape");
    doc.setFontSize(16);
    doc.text("Roles & Permissions", 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);
    autoTable(doc, {
      startY: 34,
      head: [["Role", "Description", "Users", "Permissions"]],
      body: data.map((r) => [
        r.name,
        r.description || "-",
        String(r.user_count),
        (r.permissions || []).join(", "),
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [30, 58, 138] },
    });
    doc.save(filename);
  }

  function exportSinglePDF(role: Role) {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Role Profile", 14, 22);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
    autoTable(doc, {
      startY: 38,
      body: [
        ["Role", role.name],
        ["Description", role.description || "-"],
        ["Users Assigned", String(role.user_count)],
        ["Permissions", (role.permissions || []).join(", ")],
        ["Created At", role.created_at ? new Date(role.created_at).toLocaleString() : "-"],
      ],
      theme: "plain",
      styles: { fontSize: 10, cellPadding: 4 },
      columnStyles: { 0: { fontStyle: "bold", cellWidth: 40 }, 1: { cellWidth: 120 } },
    });
    doc.save(`role-${role.name}.pdf`);
  }

  function exportAllPermissionsPDF() {
    const doc = new jsPDF("landscape");
    doc.setFontSize(16);
    doc.text("Complete Permission Matrix", 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);
    const sorted = [...roles].sort((a, b) => a.name.localeCompare(b.name));
    const permSet = Array.from(allPermissions).sort();
    const head = ["Role", ...permSet];
    const body = sorted.map((r) => [
      r.name,
      ...permSet.map((p) => (r.permissions.includes(p) ? "✓" : "")),
    ]);
    autoTable(doc, {
      startY: 34,
      head: [head],
      body,
      styles: { fontSize: 7, halign: "center" },
      headStyles: { fillColor: [30, 58, 138], halign: "center" },
      columnStyles: { 0: { halign: "left", fontStyle: "bold", cellWidth: 30 } },
    });
    doc.save("permission-matrix.pdf");
  }

  /* ── render ── */
  const containerClass =
    "rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-all duration-300 focus:border-[#1E3A8A] focus:ring-4 focus:ring-[#1E3A8A]/10";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="flex flex-col items-center gap-3">
          <svg className="h-8 w-8 animate-spin text-[#1E3A8A]" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-sm text-slate-500">Loading roles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#1E3A8A]">Administration</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">Roles & Permissions</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Manage system roles, review permission assignments, and analyse role distribution across the platform.
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              type="button"
              onClick={exportAllPermissionsPDF}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition-all duration-300 hover:bg-slate-50"
            >
              <span className="material-symbols-outlined text-lg">grid_view</span>
              Matrix
            </button>
          </div>
        </div>
      </section>

      {/* Assign Role Card */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm animate-fade-in-up">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500 mb-1 block">Select User</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-lg text-slate-400">person</span>
              <select
                className={`${containerClass} w-full pl-10`}
                value={assignUserId}
                onChange={(e) => setAssignUserId(e.target.value ? Number(e.target.value) : "")}
              >
                <option value="">Choose a user...</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.first_name} {u.last_name} ({u.email})</option>
                ))}
              </select>
            </div>
          </div>
          <div className="min-w-[160px]">
            <label className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500 mb-1 block">Role</label>
            <select
              className={`${containerClass} w-full`}
              value={assignRole}
              onChange={(e) => setAssignRole(e.target.value)}
            >
              <option value="">Select role</option>
              {roles.map((r) => (
                <option key={r.id} value={r.name}>{r.name.replace("_", " ")}</option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={handleAssignRole}
            disabled={!assignUserId || !assignRole || assigning}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#1E3A8A] px-5 text-sm font-semibold text-white shadow-lg shadow-[#1E3A8A]/25 transition-all duration-300 hover:bg-[#152C6B] hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-not-allowed disabled:bg-slate-400 disabled:shadow-none disabled:translate-y-0"
          >
            {assigning ? (
              <>
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Assigning...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-lg">admin_panel_settings</span>
                Assign Role
              </>
            )}
          </button>
        </div>
        {assignMsg && (
          <div
            className={`mt-4 rounded-lg px-4 py-3 text-sm animate-fade-in-up ${
              assignMsg.type === "success"
                ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200"
                : "bg-red-50 text-red-800 ring-1 ring-red-200"
            }`}
          >
            <span className="material-symbols-outlined align-middle text-base mr-1">
              {assignMsg.type === "success" ? "check_circle" : "error"}
            </span>
            {assignMsg.text}
          </div>
        )}
      </section>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 animate-fade-in-up">
        {[
          { label: "Total Roles", value: totalRoles, icon: "admin_panel_settings", color: "#1E3A8A", bg: "bg-blue-50" },
          { label: "Permissions", value: totalPermissions, icon: "lock", color: "#7C3AED", bg: "bg-purple-50" },
          { label: "Most Assigned", value: mostAssigned?.name ?? "-", icon: "trending_up", color: "#059669", bg: "bg-emerald-50", sub: `${mostAssigned?.user_count ?? 0} users` },
          { label: "Least Assigned", value: leastAssigned?.name ?? "-", icon: "trending_down", color: "#D97706", bg: "bg-amber-50", sub: `${leastAssigned?.user_count ?? 0} users` },
        ].map((card) => (
          <div key={card.label} className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-md">
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">{card.label}</p>
                <p className="mt-1 text-2xl font-bold text-slate-900 truncate">{card.value}</p>
                {"sub" in card && card.sub ? <p className="text-xs text-slate-500 mt-0.5">{card.sub}</p> : null}
              </div>
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${card.bg}`}>
                <span className="material-symbols-outlined text-xl" style={{ color: card.color }}>{card.icon}</span>
              </div>
            </div>
            <div className="mt-3 h-8">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={userCountData.slice(0, 6)} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id={`stat-grad-${card.label}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={card.color} stopOpacity={0.25} />
                      <stop offset="100%" stopColor={card.color} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="users" stroke={card.color} strokeWidth={1.5} fill={`url(#stat-grad-${card.label})`} dot={false} isAnimationActive />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-3 animate-fade-in-up">
        {/* Users per Role */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-1 text-sm font-semibold text-slate-900">Users per Role</h3>
          <p className="mb-4 text-xs text-slate-500">How many users are assigned to each role</p>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={userCountData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748B" }} />
                <YAxis tick={{ fontSize: 11, fill: "#64748B" }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="users" radius={[6, 6, 0, 0]}>
                  {userCountData.map((entry) => (
                    <Cell key={entry.name} fill={ROLE_COLORS[entry.name] || "#94A3B8"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Permissions per Role */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-1 text-sm font-semibold text-slate-900">Permissions per Role</h3>
          <p className="mb-4 text-xs text-slate-500">Number of permissions assigned to each role</p>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={permCountData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis type="number" tick={{ fontSize: 11, fill: "#64748B" }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#64748B" }} width={80} />
                <Tooltip />
                <Bar dataKey="permissions" radius={[0, 6, 6, 0]}>
                  {permCountData.map((entry) => (
                    <Cell key={entry.name} fill={ROLE_COLORS[entry.name] || "#94A3B8"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Permission Distribution */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-1 text-sm font-semibold text-slate-900">Permission Distribution</h3>
          <p className="mb-4 text-xs text-slate-500">How often each permission is used across roles</p>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={permissionDistData}
                  cx="50%" cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {permissionDistData.map((entry, i) => (
                    <Cell key={entry.name} fill={PERMISSION_COLORS[i % PERMISSION_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  iconSize={8}
                  formatter={(value: string) => <span className="text-xs text-slate-700">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px] flex-1">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-lg text-slate-400">search</span>
            <input
              type="text"
              placeholder="Search roles by name, description, permissions..."
              className={`${containerClass} w-full pl-10`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2 ml-auto">
            <button
              type="button"
              onClick={() => {
                const data = selectedIds.size > 0 ? sortedRoles.filter((r) => selectedIds.has(r.id)) : sortedRoles;
                exportExcel(data);
              }}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition-all duration-300 hover:bg-slate-50"
            >
              <span className="material-symbols-outlined text-base">table</span>
              Excel{selectedIds.size > 0 ? ` (${selectedIds.size})` : ""}
            </button>
            <button
              type="button"
              onClick={() => {
                const data = selectedIds.size > 0 ? sortedRoles.filter((r) => selectedIds.has(r.id)) : sortedRoles;
                exportPDF(data);
              }}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition-all duration-300 hover:bg-slate-50"
            >
              <span className="material-symbols-outlined text-base">picture_as_pdf</span>
              PDF{selectedIds.size > 0 ? ` (${selectedIds.size})` : ""}
            </button>
          </div>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          {filteredRoles.length} role{filteredRoles.length !== 1 ? "s" : ""}
          {filteredRoles.length !== roles.length ? ` out of ${roles.length}` : ""}
          {selectedIds.size > 0 ? ` \u00B7 ${selectedIds.size} selected` : ""}
        </p>
      </section>

      {/* Table */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {sortedRoles.length === 0 ? (
          <div className="flex flex-col items-center py-16">
            <span className="material-symbols-outlined text-5xl text-slate-300">admin_panel_settings</span>
            <p className="mt-4 text-sm font-medium text-slate-600">No roles match your criteria.</p>
            <p className="text-xs text-slate-400">Try adjusting your search.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="w-10 px-3 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === sortedRoles.length && sortedRoles.length > 0}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 rounded border-slate-300 text-[#1E3A8A] focus:ring-[#1E3A8A]"
                    />
                  </th>
                  <Th onClick={() => toggleSort("name")} active={sortField === "name"} sortDir={sortDir}>
                    Role <SortIcon field="name" />
                  </Th>
                  <Th onClick={() => toggleSort("description")} active={sortField === "description"} sortDir={sortDir}>
                    Description <SortIcon field="description" />
                  </Th>
                  <Th onClick={() => toggleSort("user_count")} active={sortField === "user_count"} sortDir={sortDir}>
                    Users <SortIcon field="user_count" />
                  </Th>
                  <Th onClick={() => toggleSort("permissions")} active={sortField === "permissions"} sortDir={sortDir}>
                    Permissions <SortIcon field="permissions" />
                  </Th>
                  <Th>Actions</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedRoles.map((role) => (
                  <tr
                    key={role.id}
                    className={`transition-all duration-200 hover:bg-slate-50 ${selectedIds.has(role.id) ? "bg-blue-50/40" : ""}`}
                  >
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(role.id)}
                        onChange={() => toggleSelect(role.id)}
                        className="h-4 w-4 rounded border-slate-300 text-[#1E3A8A] focus:ring-[#1E3A8A]"
                      />
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold text-white"
                          style={{ backgroundColor: ROLE_COLORS[role.name] || "#94A3B8" }}
                        >
                          {role.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-semibold text-slate-900 capitalize">{role.name.replace("_", " ")}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-slate-600 max-w-[200px] truncate">{role.description || "-"}</td>
                    <td className="whitespace-nowrap px-3 py-3">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                        <span className="material-symbols-outlined text-sm">people</span>
                        {role.user_count}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(role.permissions || []).map((p) => (
                          <span
                            key={p}
                            className="inline-block rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-800"
                          >
                            {p}
                          </span>
                        ))}
                        {(!role.permissions || role.permissions.length === 0) && (
                          <span className="text-xs text-slate-400">None</span>
                        )}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => exportSingleExcel(role)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-all duration-200 hover:bg-emerald-50 hover:text-emerald-600"
                          title="Export to Excel"
                        >
                          <span className="material-symbols-outlined text-base">table</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => exportSinglePDF(role)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-all duration-200 hover:bg-red-50 hover:text-red-600"
                          title="Export to PDF"
                        >
                          <span className="material-symbols-outlined text-base">picture_as_pdf</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function Th({
  children,
  onClick,
  active,
  sortDir,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
  sortDir?: SortDir;
}) {
  return (
    <th
      onClick={onClick}
      className={`px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
        onClick ? "cursor-pointer select-none hover:text-[#1E3A8A]" : ""
      } ${active ? "text-[#1E3A8A]" : "text-slate-600"}`}
    >
      {children}
    </th>
  );
}
