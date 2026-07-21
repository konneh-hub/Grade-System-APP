"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import UserStatsCharts from "@/components/admin/UserStatsCharts";
import UserImportModal from "@/components/admin/UserImportModal";
import CreateUserModal from "@/components/admin/CreateUserModal";

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  status: string;
  registered_at: string | null;
  last_login_at: string | null;
  roles: string[];
}

type SortField = "first_name" | "email" | "phone" | "status" | "roles" | "registered_at";
type SortDir = "asc" | "desc";

function wideSearch(user: User, query: string): boolean {
  if (!query.trim()) return true;
  const q = query.toLowerCase();
  const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();
  const email = user.email.toLowerCase();
  const phone = (user.phone || "").toLowerCase();
  const roleStr = (user.roles || []).join(" ").toLowerCase();
  const status = user.status.toLowerCase();
  return fullName.includes(q) || email.includes(q) || phone.includes(q) || roleStr.includes(q) || status.includes(q);
}

function getSortValue(user: User, field: SortField): string | number {
  if (field === "roles") return (user.roles || []).join(", ");
  if (field === "registered_at") return user.registered_at || "";
  return String(user[field] ?? "");
}

export default function UsersPageContent() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortField, setSortField] = useState<SortField>("first_name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const [importOpen, setImportOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/users");
      const data = (await res.json()) as User[];
      setUsers(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const uniqueRoles = useMemo(() => {
    const set = new Set<string>();
    for (const u of users) {
      for (const r of u.roles || []) set.add(r);
    }
    return Array.from(set).sort();
  }, [users]);

  const filteredUsers = useMemo(() => {
    let result = users;
    if (searchQuery.trim()) result = result.filter((u) => wideSearch(u, searchQuery));
    if (roleFilter) result = result.filter((u) => (u.roles || []).includes(roleFilter));
    if (statusFilter) result = result.filter((u) => u.status === statusFilter);
    return result;
  }, [users, searchQuery, roleFilter, statusFilter]);

  const sortedUsers = useMemo(() => {
    const copy = [...filteredUsers];
    copy.sort((a, b) => {
      const av = getSortValue(a, sortField);
      const bv = getSortValue(b, sortField);
      const cmp = typeof av === "number" && typeof bv === "number" ? av - bv : String(av).localeCompare(String(bv));
      return sortDir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [filteredUsers, sortField, sortDir]);

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
    if (selectedIds.size === sortedUsers.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sortedUsers.map((u) => u.id)));
    }
  }

  /* ── exports ── */
  function exportExcel(data: User[], filename = "users.xlsx") {
    const rows = data.map((u) => ({
      "First Name": u.first_name,
      "Last Name": u.last_name,
      Email: u.email,
      Phone: u.phone,
      Status: u.status,
      Roles: (u.roles || []).join(", "),
      "Registered At": u.registered_at || "",
      "Last Login": u.last_login_at || "",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Users");
    XLSX.writeFile(wb, filename);
  }

  function exportSingleExcel(user: User) {
    exportExcel([user], `user-${user.id}.xlsx`);
  }

  function exportPDF(data: User[], filename = "users.pdf") {
    const doc = new jsPDF("landscape");
    doc.setFontSize(16);
    doc.text("Platform Users", 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);
    autoTable(doc, {
      startY: 34,
      head: [["Name", "Email", "Phone", "Status", "Roles", "Registered"]],
      body: data.map((u) => [
        `${u.first_name} ${u.last_name}`,
        u.email,
        u.phone || "-",
        u.status,
        (u.roles || []).join(", "),
        u.registered_at ? new Date(u.registered_at).toLocaleDateString() : "-",
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [30, 58, 138] },
    });
    doc.save(filename);
  }

  function exportSinglePDF(user: User) {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("User Profile", 14, 22);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);

    const lines = [
      ["Name", `${user.first_name} ${user.last_name}`],
      ["Email", user.email],
      ["Phone", user.phone || "-"],
      ["Status", user.status],
      ["Roles", (user.roles || []).join(", ")],
      ["Registered At", user.registered_at ? new Date(user.registered_at).toLocaleString() : "-"],
      ["Last Login", user.last_login_at ? new Date(user.last_login_at).toLocaleString() : "-"],
    ];

    autoTable(doc, {
      startY: 38,
      body: lines.map(([k, v]) => [k, v]),
      theme: "plain",
      styles: { fontSize: 10, cellPadding: 4 },
      columnStyles: { 0: { fontStyle: "bold", cellWidth: 40 }, 1: { cellWidth: 120 } },
    });

    doc.save(`user-${user.id}.pdf`);
  }

  function handleImportDone() {
    setImportOpen(false);
    fetchUsers();
  }

  function handleCreateDone() {
    setCreateOpen(false);
    fetchUsers();
  }

  /* ── render ── */
  const containerClass = "rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-all duration-300 focus:border-[#1E3A8A] focus:ring-4 focus:ring-[#1E3A8A]/10";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="flex flex-col items-center gap-3">
          <svg className="h-8 w-8 animate-spin text-[#1E3A8A]" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-sm text-slate-500">Loading users...</p>
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
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">User administration</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Review registered accounts, manage active status, and track the people in the platform.
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setImportOpen(true)}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition-all duration-300 hover:bg-slate-50"
            >
              <span className="material-symbols-outlined text-lg">upload</span>
              Import
            </button>
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#1E3A8A] px-5 text-sm font-semibold text-white shadow-lg shadow-[#1E3A8A]/25 transition-all duration-300 hover:bg-[#152C6B] hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
            >
              <span className="material-symbols-outlined text-lg">add</span>
              Add User
            </button>
          </div>
        </div>
      </section>

      {/* Stats + Charts */}
      <UserStatsCharts users={users} />

      {/* Toolbar */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative min-w-[220px] flex-1">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-lg text-slate-400">search</span>
            <input
              type="text"
              placeholder="Wide search (name, email, phone, role, status...)"
              className={`${containerClass} w-full pl-10`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Role filter */}
          <select
            className={`${containerClass} min-w-[140px]`}
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="">All roles</option>
            {uniqueRoles.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>

          {/* Status filter */}
          <select
            className={`${containerClass} min-w-[130px]`}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="pending">Pending</option>
          </select>

          {/* Export buttons */}
          <div className="flex gap-2 ml-auto">
            <button
              type="button"
              onClick={() => {
                const data = selectedIds.size > 0
                  ? sortedUsers.filter((u) => selectedIds.has(u.id))
                  : sortedUsers;
                exportExcel(data);
              }}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition-all duration-300 hover:bg-slate-50"
              title="Export to Excel"
            >
              <span className="material-symbols-outlined text-base">table</span>
              Excel{selectedIds.size > 0 ? ` (${selectedIds.size})` : ""}
            </button>
            <button
              type="button"
              onClick={() => {
                const data = selectedIds.size > 0
                  ? sortedUsers.filter((u) => selectedIds.has(u.id))
                  : sortedUsers;
                exportPDF(data);
              }}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition-all duration-300 hover:bg-slate-50"
              title="Export to PDF"
            >
              <span className="material-symbols-outlined text-base">picture_as_pdf</span>
              PDF{selectedIds.size > 0 ? ` (${selectedIds.size})` : ""}
            </button>
          </div>
        </div>

        {/* Results count */}
        <p className="mt-3 text-xs text-slate-500">
          {filteredUsers.length} user{filteredUsers.length !== 1 ? "s" : ""}
          {filteredUsers.length !== users.length ? ` out of ${users.length}` : ""}
          {selectedIds.size > 0 ? ` · ${selectedIds.size} selected` : ""}
        </p>
      </section>

      {/* Table */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {sortedUsers.length === 0 ? (
          <div className="flex flex-col items-center py-16">
            <span className="material-symbols-outlined text-5xl text-slate-300">people_outline</span>
            <p className="mt-4 text-sm font-medium text-slate-600">No users match your criteria.</p>
            <p className="text-xs text-slate-400">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="w-10 px-3 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === sortedUsers.length && sortedUsers.length > 0}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 rounded border-slate-300 text-[#1E3A8A] focus:ring-[#1E3A8A]"
                    />
                  </th>
                  <Th onClick={() => toggleSort("first_name")} active={sortField === "first_name"} sortDir={sortDir}>
                    Name <SortIcon field="first_name" />
                  </Th>
                  <Th onClick={() => toggleSort("email")} active={sortField === "email"} sortDir={sortDir}>
                    Email <SortIcon field="email" />
                  </Th>
                  <Th onClick={() => toggleSort("phone")} active={sortField === "phone"} sortDir={sortDir}>
                    Phone <SortIcon field="phone" />
                  </Th>
                  <Th onClick={() => toggleSort("roles")} active={sortField === "roles"} sortDir={sortDir}>
                    Roles <SortIcon field="roles" />
                  </Th>
                  <Th onClick={() => toggleSort("status")} active={sortField === "status"} sortDir={sortDir}>
                    Status <SortIcon field="status" />
                  </Th>
                  <Th>Actions</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedUsers.map((user) => (
                  <tr key={user.id} className={`transition-all duration-200 hover:bg-slate-50 ${selectedIds.has(user.id) ? "bg-blue-50/40" : ""}`}>
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(user.id)}
                        onChange={() => toggleSelect(user.id)}
                        className="h-4 w-4 rounded border-slate-300 text-[#1E3A8A] focus:ring-[#1E3A8A]"
                      />
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 font-medium text-slate-900">
                      {user.first_name} {user.last_name}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-slate-600">{user.email}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-slate-600">{user.phone || "-"}</td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(user.roles || []).map((r) => (
                          <span
                            key={r}
                            className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                              r === "admin"
                                ? "bg-blue-100 text-blue-800"
                                : r === "student"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : r === "lecturer"
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {r}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                          user.status === "active"
                            ? "bg-emerald-100 text-emerald-800"
                            : user.status === "suspended"
                              ? "bg-red-100 text-red-800"
                              : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            user.status === "active"
                              ? "bg-emerald-500"
                              : user.status === "suspended"
                                ? "bg-red-500"
                                : "bg-amber-500"
                          }`}
                        />
                        {user.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => exportSingleExcel(user)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-all duration-200 hover:bg-emerald-50 hover:text-emerald-600"
                          title="Export to Excel"
                        >
                          <span className="material-symbols-outlined text-base">table</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => exportSinglePDF(user)}
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

      {/* Modals */}
      <UserImportModal open={importOpen} onClose={handleImportDone} />
      <CreateUserModal open={createOpen} onClose={handleCreateDone} />
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
