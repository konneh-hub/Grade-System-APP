"use client";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, AreaChart, Area,
} from "recharts";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Modal from "@/components/ui/Modal";

interface Faculty {
  id: number;
  name: string;
  code: string;
  description: string | null;
  created_at: string | null;
  departments_count: number;
}

type SortField = "name" | "code" | "departments_count" | "description";
type SortDir = "asc" | "desc";

const COLORS = ["#1E3A8A", "#7C3AED", "#0891B2", "#059669", "#D97706", "#DC2626", "#EA580C", "#0284C7"];

function getSortValue(f: Faculty, field: SortField): string | number {
  if (field === "departments_count") return f.departments_count;
  return String(f[field] ?? "");
}

export default function FacultiesPageContent() {
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  /* ── create modal state ── */
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", code: "", description: "" });
  const [creating, setCreating] = useState(false);
  const [createMsg, setCreateMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  /* ── import modal state ── */
  const [importOpen, setImportOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch("/api/faculties")
      .then((r) => r.json())
      .then((data) => setFaculties(data as Faculty[]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return faculties;
    const q = searchQuery.toLowerCase();
    return faculties.filter((f) => {
      const name = f.name.toLowerCase();
      const code = f.code.toLowerCase();
      const desc = (f.description || "").toLowerCase();
      return name.includes(q) || code.includes(q) || desc.includes(q);
    });
  }, [faculties, searchQuery]);

  const sorted = useMemo(() => {
    const copy = [...filtered];
    copy.sort((a, b) => {
      const av = getSortValue(a, sortField);
      const bv = getSortValue(b, sortField);
      const cmp = typeof av === "number" && typeof bv === "number" ? av - bv : String(av).localeCompare(String(bv));
      return sortDir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [filtered, sortField, sortDir]);

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
    if (selectedIds.size === sorted.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(sorted.map((f) => f.id)));
  }

  /* ── stats ── */
  const totalFaculties = faculties.length;
  const totalDepartments = faculties.reduce((s, f) => s + f.departments_count, 0);
  const mostDept = faculties.reduce((max, f) => (f.departments_count > (max?.departments_count ?? -1) ? f : max), faculties[0]);
  const avgDepts = totalFaculties ? Math.round((totalDepartments / totalFaculties) * 10) / 10 : 0;

  /* ── chart data ── */
  const deptChartData = useMemo(
    () => [...faculties].sort((a, b) => b.departments_count - a.departments_count).map((f) => ({ name: f.code, departments: f.departments_count })),
    [faculties]
  );
  const trendData = useMemo(() => {
    const now = new Date();
    const months: { month: string; count: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ month: d.toLocaleString("en", { month: "short", year: "2-digit" }), count: 0 });
    }
    for (const f of faculties) {
      if (!f.created_at) continue;
      const rd = new Date(f.created_at);
      const label = rd.toLocaleString("en", { month: "short", year: "2-digit" });
      const found = months.find((m) => m.month === label);
      if (found) found.count++;
    }
    return months;
  }, [faculties]);

  /* ── create faculty ── */
  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setCreating(true);
    setCreateMsg(null);
    try {
      const res = await fetch("/api/faculties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      });
      const payload = await res.json() as { error?: string };
      if (!res.ok) throw new Error(payload.error || "Failed to create faculty");
      setCreateMsg({ type: "success", text: `Faculty "${createForm.name}" created.` });
      setCreateForm({ name: "", code: "", description: "" });
      const updated = await fetch("/api/faculties").then((r) => r.json());
      setFaculties(updated as Faculty[]);
    } catch (err) {
      setCreateMsg({ type: "error", text: err instanceof Error ? err.message : "Failed to create faculty" });
    } finally {
      setCreating(false);
    }
  }

  function closeCreate() {
    setCreateOpen(false);
    setCreateMsg(null);
    setCreateForm({ name: "", code: "", description: "" });
  }

  /* ── exports ── */
  function exportExcel(data: Faculty[], filename = "faculties.xlsx") {
    const rows = data.map((f) => ({
      Name: f.name,
      Code: f.code,
      Description: f.description || "",
      Departments: f.departments_count,
      "Created At": f.created_at || "",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Faculties");
    XLSX.writeFile(wb, filename);
  }

  function exportSingleExcel(faculty: Faculty) {
    exportExcel([faculty], `faculty-${faculty.code}.xlsx`);
  }

  function exportPDF(data: Faculty[], filename = "faculties.pdf") {
    const doc = new jsPDF("landscape");
    doc.setFontSize(16);
    doc.text("Faculties", 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);
    autoTable(doc, {
      startY: 34,
      head: [["Code", "Name", "Description", "Departments"]],
      body: data.map((f) => [f.code, f.name, f.description || "-", String(f.departments_count)]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [30, 58, 138] },
    });
    doc.save(filename);
  }

  function exportSinglePDF(faculty: Faculty) {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Faculty Profile", 14, 22);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
    autoTable(doc, {
      startY: 38,
      body: [
        ["Name", faculty.name],
        ["Code", faculty.code],
        ["Description", faculty.description || "-"],
        ["Departments", String(faculty.departments_count)],
        ["Created At", faculty.created_at ? new Date(faculty.created_at).toLocaleString() : "-"],
      ],
      theme: "plain",
      styles: { fontSize: 10, cellPadding: 4 },
      columnStyles: { 0: { fontStyle: "bold", cellWidth: 40 }, 1: { cellWidth: 120 } },
    });
    doc.save(`faculty-${faculty.code}.pdf`);
  }

  function handleImportDone() {
    setImportOpen(false);
    fetch("/api/faculties").then((r) => r.json()).then((data) => setFaculties(data as Faculty[]));
  }

  /* ── render ── */
  const inputClass = "rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-all duration-300 focus:border-[#1E3A8A] focus:ring-4 focus:ring-[#1E3A8A]/10";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="flex flex-col items-center gap-3">
          <svg className="h-8 w-8 animate-spin text-[#1E3A8A]" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-sm text-slate-500">Loading faculties...</p>
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
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">Faculties</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Manage academic faculties, monitor department allocations, and oversee the institutional structure.
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
              Add Faculty
            </button>
          </div>
        </div>
      </section>

      {/* Create Faculty Modal */}
      <Modal open={createOpen} onClose={closeCreate}>
        <div className="relative rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-200 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Create Faculty</h2>
              <p className="text-sm text-slate-500">Add a new faculty to the institutional structure.</p>
            </div>
            <button type="button" onClick={closeCreate} className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition-all duration-300 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-600">
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
          <form onSubmit={handleCreate} className="space-y-4">
            <label className="block text-sm font-medium text-slate-700">
              Faculty Name
              <input required className={`${inputClass} mt-1 w-full`} value={createForm.name} onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))} />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Faculty Code
              <input required className={`${inputClass} mt-1 w-full uppercase`} value={createForm.code} onChange={(e) => setCreateForm((p) => ({ ...p, code: e.target.value }))} placeholder="e.g. FCOM" />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Description
              <textarea rows={3} className={`${inputClass} mt-1 w-full`} value={createForm.description} onChange={(e) => setCreateForm((p) => ({ ...p, description: e.target.value }))} />
            </label>
            <div className="flex items-center gap-3 pt-2">
              <button type="submit" disabled={creating} className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#1E3A8A] px-5 text-sm font-semibold text-white shadow-lg shadow-[#1E3A8A]/25 transition-all duration-300 hover:bg-[#152C6B] disabled:cursor-not-allowed disabled:bg-slate-400 disabled:shadow-none">
                {creating ? (
                  <><svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Saving...</>
                ) : (
                  <><span className="material-symbols-outlined text-lg">account_balance</span>Save Faculty</>
                )}
              </button>
              <button type="button" onClick={closeCreate} className="inline-flex h-10 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition-all duration-300 hover:bg-slate-50">Cancel</button>
            </div>
          </form>
          {createMsg && (
            <div className={`mt-4 rounded-lg px-4 py-3 text-sm animate-fade-in-up ${createMsg.type === "success" ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200" : "bg-red-50 text-red-800 ring-1 ring-red-200"}`}>
              <span className="material-symbols-outlined align-middle text-base mr-1">{createMsg.type === "success" ? "check_circle" : "error"}</span>
              {createMsg.text}
            </div>
          )}
        </div>
      </Modal>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 animate-fade-in-up">
        {[
          { label: "Total Faculties", value: totalFaculties, icon: "account_balance", color: "#1E3A8A", bg: "bg-blue-50" },
          { label: "Total Departments", value: totalDepartments, icon: "business", color: "#7C3AED", bg: "bg-purple-50" },
          { label: "Most Departments", value: mostDept?.code ?? "-", icon: "trending_up", color: "#059669", bg: "bg-emerald-50", sub: `${mostDept?.departments_count ?? 0} depts` },
          { label: "Avg Departments", value: avgDepts, icon: "analytics", color: "#D97706", bg: "bg-amber-50" },
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
                <AreaChart data={deptChartData.slice(0, 6)} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id={`fg-${card.label}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={card.color} stopOpacity={0.25} />
                      <stop offset="100%" stopColor={card.color} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="departments" stroke={card.color} strokeWidth={1.5} fill={`url(#fg-${card.label})`} dot={false} isAnimationActive />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2 animate-fade-in-up">
        {/* Departments per Faculty */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-1 text-sm font-semibold text-slate-900">Departments per Faculty</h3>
          <p className="mb-4 text-xs text-slate-500">Number of departments under each faculty</p>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748B" }} />
                <YAxis tick={{ fontSize: 11, fill: "#64748B" }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="departments" radius={[6, 6, 0, 0]}>
                  {deptChartData.map((entry, i) => (
                    <Cell key={entry.name} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Faculty Creation Trend */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-1 text-sm font-semibold text-slate-900">Faculty Creation Trend</h3>
          <p className="mb-4 text-xs text-slate-500">Faculties created over time</p>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1E3A8A" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#1E3A8A" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748B" }} />
                <YAxis tick={{ fontSize: 11, fill: "#64748B" }} allowDecimals={false} />
                <Tooltip />
                <Area type="monotone" dataKey="count" stroke="#1E3A8A" strokeWidth={2} fill="url(#trendGrad)" dot={{ r: 3, fill: "#1E3A8A" }} activeDot={{ r: 5 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px] flex-1">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-lg text-slate-400">search</span>
            <input type="text" placeholder="Wide search (name, code, description...)" className={`${inputClass} w-full pl-10`} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          <div className="flex gap-2 ml-auto">
            <button type="button" onClick={() => { const d = selectedIds.size > 0 ? sorted.filter((f) => selectedIds.has(f.id)) : sorted; exportExcel(d); }}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition-all duration-300 hover:bg-slate-50">
              <span className="material-symbols-outlined text-base">table</span> Excel{selectedIds.size > 0 ? ` (${selectedIds.size})` : ""}
            </button>
            <button type="button" onClick={() => { const d = selectedIds.size > 0 ? sorted.filter((f) => selectedIds.has(f.id)) : sorted; exportPDF(d); }}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition-all duration-300 hover:bg-slate-50">
              <span className="material-symbols-outlined text-base">picture_as_pdf</span> PDF{selectedIds.size > 0 ? ` (${selectedIds.size})` : ""}
            </button>
          </div>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          {filtered.length} facult{filtered.length !== 1 ? "ies" : "y"}
          {filtered.length !== faculties.length ? ` out of ${faculties.length}` : ""}
          {selectedIds.size > 0 ? ` · ${selectedIds.size} selected` : ""}
        </p>
      </section>

      {/* Table */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center py-16">
            <span className="material-symbols-outlined text-5xl text-slate-300">account_balance</span>
            <p className="mt-4 text-sm font-medium text-slate-600">No faculties match your criteria.</p>
            <p className="text-xs text-slate-400">Try adjusting your search.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="w-10 px-3 py-3"><input type="checkbox" checked={selectedIds.size === sorted.length && sorted.length > 0} onChange={toggleSelectAll} className="h-4 w-4 rounded border-slate-300 text-[#1E3A8A] focus:ring-[#1E3A8A]" /></th>
                  <Th onClick={() => toggleSort("name")} active={sortField === "name"} sortDir={sortDir}>Name <SortIcon field="name" /></Th>
                  <Th onClick={() => toggleSort("code")} active={sortField === "code"} sortDir={sortDir}>Code <SortIcon field="code" /></Th>
                  <Th onClick={() => toggleSort("description")} active={sortField === "description"} sortDir={sortDir}>Description <SortIcon field="description" /></Th>
                  <Th onClick={() => toggleSort("departments_count")} active={sortField === "departments_count"} sortDir={sortDir}>Departments <SortIcon field="departments_count" /></Th>
                  <Th>Actions</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sorted.map((faculty) => (
                  <tr key={faculty.id} className={`transition-all duration-200 hover:bg-slate-50 ${selectedIds.has(faculty.id) ? "bg-blue-50/40" : ""}`}>
                    <td className="px-3 py-3"><input type="checkbox" checked={selectedIds.has(faculty.id)} onChange={() => toggleSelect(faculty.id)} className="h-4 w-4 rounded border-slate-300 text-[#1E3A8A] focus:ring-[#1E3A8A]" /></td>
                    <td className="whitespace-nowrap px-3 py-3">
                      <a href={`/admin/faculties/${faculty.id}`} className="flex items-center gap-2 group">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#1E3A8A] text-xs font-bold text-white">{faculty.name.charAt(0).toUpperCase()}</div>
                        <span className="font-semibold text-slate-900 group-hover:text-[#1E3A8A] transition-colors">{faculty.name}</span>
                      </a>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3"><span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-mono font-semibold text-slate-700">{faculty.code}</span></td>
                    <td className="px-3 py-3 text-slate-600 max-w-[220px] truncate">{faculty.description || "-"}</td>
                    <td className="whitespace-nowrap px-3 py-3">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                        <span className="material-symbols-outlined text-sm">business</span>
                        {faculty.departments_count}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">
                      <div className="flex items-center gap-1">
                        <a href={`/admin/faculties/${faculty.id}`} className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-all duration-200 hover:bg-blue-50 hover:text-blue-600" title="Edit">
                          <span className="material-symbols-outlined text-base">edit</span>
                        </a>
                        <button type="button" onClick={() => exportSingleExcel(faculty)} className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-all duration-200 hover:bg-emerald-50 hover:text-emerald-600" title="Export Excel">
                          <span className="material-symbols-outlined text-base">table</span>
                        </button>
                        <button type="button" onClick={() => exportSinglePDF(faculty)} className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-all duration-200 hover:bg-red-50 hover:text-red-600" title="Export PDF">
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

      {/* Import Modal */}
      <FacultyImportModal open={importOpen} onClose={handleImportDone} />
    </div>
  );
}

/* ── import modal sub-component ── */
function FacultyImportModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [rows, setRows] = useState<{ name: string; code: string; description: string }[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ ok: number; errors: string[] } | null>(null);

  async function handleFile(file: File) {
    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) return;
    setResult(null);
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json<{ name?: string; code?: string; description?: string }>(ws, { defval: "" });
    setRows(data.map((r) => ({ name: r.name || "", code: r.code || "", description: r.description || "" })));
  }

  async function handleImport() {
    setImporting(true);
    setResult(null);
    const errors: string[] = [];
    let ok = 0;
    for (const row of rows) {
      try {
        const res = await fetch("/api/faculties", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(row),
        });
        const payload = await res.json();
        if (!res.ok) errors.push(`${row.code || row.name}: ${payload.error || "Error"}`);
        else ok++;
      } catch { errors.push(`${row.code || row.name}: Network error`); }
    }
    setResult({ ok, errors });
    setImporting(false);
  }

  return (
    <Modal open={open} onClose={() => { setRows([]); setResult(null); onClose(); }}>
      <div className="relative max-h-[85vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-200 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <div><h2 className="text-xl font-bold text-slate-900">Import Faculties</h2><p className="text-sm text-slate-500">Upload an Excel file to batch-create faculties</p></div>
          <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition-all duration-300 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-600">
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>
        {rows.length === 0 && !result && (
          <div className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center transition-all duration-300 hover:border-[#1E3A8A] hover:bg-blue-50/50" onClick={() => document.getElementById("fac-import-input")?.click()}>
            <span className="material-symbols-outlined text-4xl text-slate-400">upload_file</span>
            <p className="mt-3 text-sm font-medium text-slate-700">Drop an Excel file here, or click to browse</p>
            <p className="mt-1 text-xs text-slate-500">Supports .xlsx, .xls, .csv (columns: name, code, description)</p>
            <input id="fac-import-input" type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
          </div>
        )}
        {rows.length > 0 && !result && (
          <div className="space-y-4">
            <p className="text-sm font-semibold text-slate-700">{rows.length} row(s) parsed</p>
            <div className="max-h-48 overflow-auto rounded-lg border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-xs">
                <thead className="bg-slate-50"><tr><th className="px-2 py-2 text-left font-semibold text-slate-600">Name</th><th className="px-2 py-2 text-left font-semibold text-slate-600">Code</th><th className="px-2 py-2 text-left font-semibold text-slate-600">Description</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="px-2 py-1.5 text-slate-700">{r.name}</td>
                      <td className="px-2 py-1.5 text-slate-700">{r.code}</td>
                      <td className="px-2 py-1.5 text-slate-700">{r.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button type="button" onClick={handleImport} disabled={importing}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#1E3A8A] px-5 text-sm font-semibold text-white shadow-lg shadow-[#1E3A8A]/25 transition-all duration-300 hover:bg-[#152C6B] disabled:cursor-not-allowed disabled:bg-slate-400 disabled:shadow-none">
              {importing ? (
                <><svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Importing...</>
              ) : (
                <><span className="material-symbols-outlined text-lg">cloud_upload</span>Import {rows.length} facult{rows.length !== 1 ? "ies" : "y"}</>
              )}
            </button>
          </div>
        )}
        {result && (
          <div className="space-y-3 animate-fade-in-up">
            <div className="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800 ring-1 ring-emerald-200"><span className="font-semibold">{result.ok}</span> facult{result.ok !== 1 ? "ies" : "y"} imported.</div>
            {result.errors.length > 0 && (
              <div className="max-h-40 overflow-auto rounded-lg bg-red-50 p-4 text-sm text-red-800 ring-1 ring-red-200">
                <p className="mb-2 font-semibold">{result.errors.length} error(s):</p>
                {result.errors.map((err, i) => <p key={i} className="text-xs leading-5">{err}</p>)}
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}

function Th({ children, onClick, active }: { children: React.ReactNode; onClick?: () => void; active?: boolean; sortDir?: SortDir }) {
  return (
    <th onClick={onClick} className={`px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider ${onClick ? "cursor-pointer select-none hover:text-[#1E3A8A]" : ""} ${active ? "text-[#1E3A8A]" : "text-slate-600"}`}>
      {children}
    </th>
  );
}
