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

interface Programme {
  id: number;
  name: string;
  code: string;
  duration_years: number;
  degree_type: string;
  status: string;
  department_id: number;
  department_name: string | null;
  faculty_name: string | null;
  created_at: string | null;
}

interface Department {
  id: number;
  name: string;
  code: string;
}

type SortField = "name" | "code" | "department_name" | "degree_type" | "duration_years" | "status";
type SortDir = "asc" | "desc";

const CHART_COLORS = ["#1E3A8A", "#7C3AED", "#0891B2", "#059669", "#D97706", "#DC2626", "#EA580C", "#0284C7"];
const DEGREE_COLORS: Record<string, string> = { bsc: "#1E3A8A", ba: "#7C3AED", hnd: "#059669", nd: "#0891B2", pgd: "#D97706", msc: "#DC2626" };
const STATUS_COLORS: Record<string, string> = { active: "#059669", archived: "#DC2626" };

function getSortValue(p: Programme, field: SortField): string | number {
  if (field === "duration_years") return p.duration_years;
  if (field === "department_name") return p.department_name || "";
  return String(p[field] ?? "");
}

export default function ProgrammesPageContent() {
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  /* ── create modal ── */
  const [createOpen, setCreateOpen] = useState(false);
  const [cf, setCf] = useState({ name: "", code: "", department_id: "", degree_type: "bsc", duration_years: "4", status: "active" });
  const [creating, setCreating] = useState(false);
  const [createMsg, setCreateMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  /* ── import modal ── */
  const [importOpen, setImportOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch("/api/programmes").then((r) => r.json()),
      fetch("/api/departments").then((r) => r.json()),
    ])
      .then(([progs, depts]) => {
        setProgrammes(progs as Programme[]);
        setDepartments(depts as Department[]);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return programmes;
    const q = searchQuery.toLowerCase();
    return programmes.filter((p) =>
      [p.name, p.code, p.department_name, p.faculty_name, p.degree_type, p.status]
        .some((s) => (s || "").toLowerCase().includes(q))
    );
  }, [programmes, searchQuery]);

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
    setSelectedIds((prev) => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  }
  function toggleSelectAll() {
    if (selectedIds.size === sorted.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(sorted.map((r) => r.id)));
  }

  /* ── stats ── */
  const totalProgs = programmes.length;
  const activeCount = programmes.filter((p) => p.status === "active").length;
  const avgDuration = totalProgs ? Math.round((programmes.reduce((s, p) => s + p.duration_years, 0) / totalProgs) * 10) / 10 : 0;
  const deptCount = departments.length;

  /* ── chart data ── */
  const deptChartData = useMemo(() => {
    const map: Record<string, number> = {};
    for (const p of programmes) { const k = p.department_name || "Unknown"; map[k] = (map[k] || 0) + 1; }
    return Object.entries(map).sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, programmes: count }));
  }, [programmes]);

  const degreeChartData = useMemo(() => {
    const map: Record<string, number> = {};
    for (const p of programmes) { map[p.degree_type] = (map[p.degree_type] || 0) + 1; }
    return Object.entries(map).map(([name, value]) => ({ name: name.toUpperCase(), value }));
  }, [programmes]);

  const statusChartData = useMemo(() => {
    const map: Record<string, number> = {};
    for (const p of programmes) { map[p.status] = (map[p.status] || 0) + 1; }
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [programmes]);

  const trendData = useMemo(() => {
    const now = new Date();
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ month: d.toLocaleString("en", { month: "short", year: "2-digit" }), count: 0 });
    }
    for (const p of programmes) {
      if (!p.created_at) continue;
      const rd = new Date(p.created_at);
      const label = rd.toLocaleString("en", { month: "short", year: "2-digit" });
      const found = months.find((m) => m.month === label);
      if (found) found.count++;
    }
    return months;
  }, [programmes]);

  /* ── create ── */
  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!cf.department_id) return;
    setCreating(true); setCreateMsg(null);
    try {
      const res = await fetch("/api/programmes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: cf.name, code: cf.code, department_id: Number(cf.department_id),
          degree_type: cf.degree_type, duration_years: Number(cf.duration_years), status: cf.status,
        }),
      });
      const payload = await res.json() as { error?: string };
      if (!res.ok) throw new Error(payload.error || "Failed to create programme");
      setCreateMsg({ type: "success", text: `Programme "${cf.name}" created.` });
      setCf({ name: "", code: "", department_id: "", degree_type: "bsc", duration_years: "4", status: "active" });
      const updated = await fetch("/api/programmes").then((r) => r.json());
      setProgrammes(updated as Programme[]);
    } catch (err) { setCreateMsg({ type: "error", text: err instanceof Error ? err.message : "Failed to create programme" });
    } finally { setCreating(false); }
  }

  function closeCreate() { setCreateOpen(false); setCreateMsg(null); setCf({ name: "", code: "", department_id: "", degree_type: "bsc", duration_years: "4", status: "active" }); }

  /* ── toggle status ── */
  async function toggleStatus(p: Programme) {
    const next = p.status === "active" ? "archived" : "active";
    try {
      const res = await fetch(`/api/programmes/${p.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) return;
      const updated = await fetch("/api/programmes").then((r) => r.json());
      setProgrammes(updated as Programme[]);
    } catch {}
  }

  /* ── exports ── */
  function exportExcel(data: Programme[], filename = "programmes.xlsx") {
    const rows = data.map((p) => ({
      Name: p.name, Code: p.code, Department: p.department_name || "",
      Faculty: p.faculty_name || "", "Degree Type": p.degree_type.toUpperCase(),
      "Duration (yrs)": p.duration_years, Status: p.status, "Created At": p.created_at || "",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Programmes");
    XLSX.writeFile(wb, filename);
  }

  function exportSingleExcel(p: Programme) { exportExcel([p], `programme-${p.code}.xlsx`); }

  function exportPDF(data: Programme[], filename = "programmes.pdf") {
    const doc = new jsPDF("landscape");
    doc.setFontSize(16); doc.text("Programmes", 14, 20);
    doc.setFontSize(10); doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);
    autoTable(doc, {
      startY: 34,
      head: [["Code", "Name", "Department", "Degree", "Duration", "Status"]],
      body: data.map((p) => [p.code, p.name, p.department_name || "-", p.degree_type.toUpperCase(), String(p.duration_years), p.status]),
      styles: { fontSize: 8 }, headStyles: { fillColor: [30, 58, 138] },
    });
    doc.save(filename);
  }

  function exportSinglePDF(p: Programme) {
    const doc = new jsPDF();
    doc.setFontSize(18); doc.text("Programme Profile", 14, 22);
    doc.setFontSize(10); doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
    autoTable(doc, {
      startY: 38,
      body: [
        ["Name", p.name], ["Code", p.code], ["Department", p.department_name || "-"],
        ["Faculty", p.faculty_name || "-"], ["Degree Type", p.degree_type.toUpperCase()],
        ["Duration", `${p.duration_years} years`], ["Status", p.status],
        ["Created At", p.created_at ? new Date(p.created_at).toLocaleString() : "-"],
      ],
      theme: "plain", styles: { fontSize: 10, cellPadding: 4 },
      columnStyles: { 0: { fontStyle: "bold", cellWidth: 40 }, 1: { cellWidth: 120 } },
    });
    doc.save(`programme-${p.code}.pdf`);
  }

  function handleImportDone() {
    setImportOpen(false);
    Promise.all([
      fetch("/api/programmes").then((r) => r.json()),
      fetch("/api/departments").then((r) => r.json()),
    ]).then(([progs, depts]) => { setProgrammes(progs as Programme[]); setDepartments(depts as Department[]); });
  }

  /* ── render ── */
  const ic = "rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-all duration-300 focus:border-[#1E3A8A] focus:ring-4 focus:ring-[#1E3A8A]/10";

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <div className="flex flex-col items-center gap-3">
        <svg className="h-8 w-8 animate-spin text-[#1E3A8A]" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
        <p className="text-sm text-slate-500">Loading programmes...</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#1E3A8A]">Administration</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">Programmes</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Manage academic programmes, track degree types, and oversee programme status across departments.
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button type="button" onClick={() => setImportOpen(true)}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition-all duration-300 hover:bg-slate-50">
              <span className="material-symbols-outlined text-lg">upload</span> Import
            </button>
            <button type="button" onClick={() => setCreateOpen(true)}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#1E3A8A] px-5 text-sm font-semibold text-white shadow-lg shadow-[#1E3A8A]/25 transition-all duration-300 hover:bg-[#152C6B] hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0">
              <span className="material-symbols-outlined text-lg">add</span> Add Programme
            </button>
          </div>
        </div>
      </section>

      {/* Create Modal */}
      <Modal open={createOpen} onClose={closeCreate}>
        <div className="relative rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-200 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <div><h2 className="text-xl font-bold text-slate-900">Create Programme</h2><p className="text-sm text-slate-500">Add a new academic programme.</p></div>
            <button type="button" onClick={closeCreate} className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition-all duration-300 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-600">
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
          <form onSubmit={handleCreate} className="space-y-4">
            <label className="block text-sm font-medium text-slate-700">
              Programme Name
              <input required className={`${ic} mt-1 w-full`} value={cf.name} onChange={(e) => setCf((p) => ({ ...p, name: e.target.value }))} />
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className="block text-sm font-medium text-slate-700">
                Code <input required className={`${ic} mt-1 w-full uppercase`} value={cf.code} onChange={(e) => setCf((p) => ({ ...p, code: e.target.value }))} placeholder="e.g. CSCI" />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Department
                <select required className={`${ic} mt-1 w-full`} value={cf.department_id} onChange={(e) => setCf((p) => ({ ...p, department_id: e.target.value }))}>
                  <option value="">Select department</option>
                  {departments.map((d) => <option key={d.id} value={d.id}>{d.name} ({d.code})</option>)}
                </select>
              </label>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <label className="block text-sm font-medium text-slate-700">
                Degree Type
                <select className={`${ic} mt-1 w-full`} value={cf.degree_type} onChange={(e) => setCf((p) => ({ ...p, degree_type: e.target.value }))}>
                  <option value="bsc">BSc</option><option value="ba">BA</option><option value="hnd">HND</option>
                  <option value="nd">ND</option><option value="pgd">PGD</option><option value="msc">MSc</option>
                </select>
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Duration (yrs)
                <input type="number" min={1} max={8} className={`${ic} mt-1 w-full`} value={cf.duration_years} onChange={(e) => setCf((p) => ({ ...p, duration_years: e.target.value }))} />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Status
                <select className={`${ic} mt-1 w-full`} value={cf.status} onChange={(e) => setCf((p) => ({ ...p, status: e.target.value }))}>
                  <option value="active">Active</option><option value="archived">Archived</option>
                </select>
              </label>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button type="submit" disabled={creating || !cf.department_id}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#1E3A8A] px-5 text-sm font-semibold text-white shadow-lg shadow-[#1E3A8A]/25 transition-all duration-300 hover:bg-[#152C6B] disabled:cursor-not-allowed disabled:bg-slate-400 disabled:shadow-none">
                {creating ? <><svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Saving...</>
                  : <><span className="material-symbols-outlined text-lg">school</span>Save Programme</>}
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
          { label: "Total Programmes", value: totalProgs, icon: "school", color: "#1E3A8A", bg: "bg-blue-50" },
          { label: "Active", value: activeCount, icon: "check_circle", color: "#059669", bg: "bg-emerald-50" },
          { label: "Avg Duration", value: `${avgDuration} yrs`, icon: "schedule", color: "#7C3AED", bg: "bg-purple-50" },
          { label: "Departments", value: deptCount, icon: "business", color: "#D97706", bg: "bg-amber-50" },
        ].map((card) => (
          <div key={card.label} className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-md">
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">{card.label}</p>
                <p className="mt-1 text-2xl font-bold text-slate-900 truncate">{card.value}</p>
              </div>
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${card.bg}`}>
                <span className="material-symbols-outlined text-xl" style={{ color: card.color }}>{card.icon}</span>
              </div>
            </div>
            <div className="mt-3 h-8">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <defs><linearGradient id={`pg-${card.label}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={card.color} stopOpacity={0.25} /><stop offset="100%" stopColor={card.color} stopOpacity={0} /></linearGradient></defs>
                  <Area type="monotone" dataKey="count" stroke={card.color} strokeWidth={1.5} fill={`url(#pg-${card.label})`} dot={false} isAnimationActive />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-3 animate-fade-in-up">
        {/* Programmes per Department */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-1 text-sm font-semibold text-slate-900">Programmes per Department</h3>
          <p className="mb-4 text-xs text-slate-500">Count of programmes under each department</p>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#64748B" }} angle={-15} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 11, fill: "#64748B" }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="programmes" radius={[6, 6, 0, 0]}>
                  {deptChartData.map((e, i) => <Cell key={e.name} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Degree Type Distribution */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-1 text-sm font-semibold text-slate-900">Degree Type Distribution</h3>
          <p className="mb-4 text-xs text-slate-500">Programmes grouped by degree type</p>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={degreeChartData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                  {degreeChartData.map((e) => <Cell key={e.name} fill={DEGREE_COLORS[e.name.toLowerCase()] || "#94A3B8"} />)}
                </Pie>
                <Tooltip /><Legend verticalAlign="bottom" iconType="circle" iconSize={8} formatter={(v: string) => <span className="text-xs text-slate-700">{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-1 text-sm font-semibold text-slate-900">Status Distribution</h3>
          <p className="mb-4 text-xs text-slate-500">Active vs archived programmes</p>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusChartData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                  {statusChartData.map((e) => <Cell key={e.name} fill={STATUS_COLORS[e.name] || "#94A3B8"} />)}
                </Pie>
                <Tooltip /><Legend verticalAlign="bottom" iconType="circle" iconSize={8} formatter={(v: string) => <span className="text-xs text-slate-700">{v}</span>} />
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
            <input type="text" placeholder="Wide search (name, code, department, faculty, degree, status...)" className={`${ic} w-full pl-10`} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          <div className="flex gap-2 ml-auto">
            <button type="button" onClick={() => { const d = selectedIds.size > 0 ? sorted.filter((x) => selectedIds.has(x.id)) : sorted; exportExcel(d); }}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition-all duration-300 hover:bg-slate-50">
              <span className="material-symbols-outlined text-base">table</span> Excel{selectedIds.size > 0 ? ` (${selectedIds.size})` : ""}
            </button>
            <button type="button" onClick={() => { const d = selectedIds.size > 0 ? sorted.filter((x) => selectedIds.has(x.id)) : sorted; exportPDF(d); }}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition-all duration-300 hover:bg-slate-50">
              <span className="material-symbols-outlined text-base">picture_as_pdf</span> PDF{selectedIds.size > 0 ? ` (${selectedIds.size})` : ""}
            </button>
          </div>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          {filtered.length} programme{filtered.length !== 1 ? "s" : ""}
          {filtered.length !== programmes.length ? ` out of ${programmes.length}` : ""}
          {selectedIds.size > 0 ? ` \u00B7 ${selectedIds.size} selected` : ""}
        </p>
      </section>

      {/* Table */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center py-16">
            <span className="material-symbols-outlined text-5xl text-slate-300">school</span>
            <p className="mt-4 text-sm font-medium text-slate-600">No programmes match your criteria.</p>
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
                  <Th onClick={() => toggleSort("department_name")} active={sortField === "department_name"} sortDir={sortDir}>Department <SortIcon field="department_name" /></Th>
                  <Th onClick={() => toggleSort("degree_type")} active={sortField === "degree_type"} sortDir={sortDir}>Degree <SortIcon field="degree_type" /></Th>
                  <Th onClick={() => toggleSort("duration_years")} active={sortField === "duration_years"} sortDir={sortDir}>Duration <SortIcon field="duration_years" /></Th>
                  <Th onClick={() => toggleSort("status")} active={sortField === "status"} sortDir={sortDir}>Status <SortIcon field="status" /></Th>
                  <Th>Actions</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sorted.map((prog) => (
                  <tr key={prog.id} className={`transition-all duration-200 hover:bg-slate-50 ${selectedIds.has(prog.id) ? "bg-blue-50/40" : ""}`}>
                    <td className="px-3 py-3"><input type="checkbox" checked={selectedIds.has(prog.id)} onChange={() => toggleSelect(prog.id)} className="h-4 w-4 rounded border-slate-300 text-[#1E3A8A] focus:ring-[#1E3A8A]" /></td>
                    <td className="whitespace-nowrap px-3 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#0891B2] text-xs font-bold text-white">{prog.name.charAt(0).toUpperCase()}</div>
                        <span className="font-semibold text-slate-900">{prog.name}</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3"><span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-mono font-semibold text-slate-700">{prog.code}</span></td>
                    <td className="whitespace-nowrap px-3 py-3 text-slate-600">{prog.department_name || "-"}</td>
                    <td className="whitespace-nowrap px-3 py-3"><span className="rounded-md bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-800">{prog.degree_type.toUpperCase()}</span></td>
                    <td className="whitespace-nowrap px-3 py-3 text-slate-600">{prog.duration_years} yr{prog.duration_years !== 1 ? "s" : ""}</td>
                    <td className="whitespace-nowrap px-3 py-3">
                      <button type="button" onClick={() => toggleStatus(prog)}
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold transition-all duration-200 hover:scale-105 ${
                          prog.status === "active" ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"
                        }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${prog.status === "active" ? "bg-emerald-500" : "bg-slate-400"}`} />
                        {prog.status}
                      </button>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">
                      <div className="flex items-center gap-1">
                        <button type="button" onClick={() => exportSingleExcel(prog)} className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-all duration-200 hover:bg-emerald-50 hover:text-emerald-600" title="Export Excel"><span className="material-symbols-outlined text-base">table</span></button>
                        <button type="button" onClick={() => exportSinglePDF(prog)} className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-all duration-200 hover:bg-red-50 hover:text-red-600" title="Export PDF"><span className="material-symbols-outlined text-base">picture_as_pdf</span></button>
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
      <ProgrammeImportModal open={importOpen} onClose={handleImportDone} departments={departments} />
    </div>
  );
}

/* ── import modal ── */
function ProgrammeImportModal({ open, onClose, departments }: { open: boolean; onClose: () => void; departments: Department[] }) {
  const [rows, setRows] = useState<{ name: string; code: string; department_id: number; degree_type: string; duration_years: number; status: string }[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ ok: number; errors: string[] } | null>(null);

  async function handleFile(file: File) {
    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) return;
    setResult(null);
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json<{ name?: string; code?: string; department?: string; degree_type?: string; duration_years?: number; status?: string }>(ws, { defval: "" });
    const parsed = data.map((r) => {
      const dept = departments.find((d) => d.name.toLowerCase() === (r.department || "").toLowerCase() || d.code.toLowerCase() === (r.department || "").toLowerCase());
      return {
        name: r.name || "", code: r.code || "", department_id: dept?.id ?? 0,
        degree_type: (r.degree_type || "bsc").toLowerCase(), duration_years: Number(r.duration_years) || 4, status: (r.status || "active").toLowerCase(),
      };
    });
    setRows(parsed);
  }

  async function handleImport() {
    setImporting(true); setResult(null);
    const errors: string[] = []; let ok = 0;
    for (const row of rows) {
      if (!row.department_id) { errors.push(`${row.code || row.name}: No matching department`); continue; }
      try {
        const res = await fetch("/api/programmes", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(row),
        });
        const payload = await res.json();
        if (!res.ok) errors.push(`${row.code || row.name}: ${payload.error || "Error"}`);
        else ok++;
      } catch { errors.push(`${row.code || row.name}: Network error`); }
    }
    setResult({ ok, errors }); setImporting(false);
  }

  return (
    <Modal open={open} onClose={() => { setRows([]); setResult(null); onClose(); }}>
      <div className="relative max-h-[85vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-200 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <div><h2 className="text-xl font-bold text-slate-900">Import Programmes</h2><p className="text-sm text-slate-500">Upload an Excel file to batch-create programmes</p></div>
          <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition-all duration-300 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-600">
            <span className="material-symbols-outlined text-lg">close</span></button>
        </div>
        {rows.length === 0 && !result && (
          <div className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center transition-all duration-300 hover:border-[#1E3A8A] hover:bg-blue-50/50" onClick={() => document.getElementById("prog-import-input")?.click()}>
            <span className="material-symbols-outlined text-4xl text-slate-400">upload_file</span>
            <p className="mt-3 text-sm font-medium text-slate-700">Drop an Excel file here, or click to browse</p>
            <p className="mt-1 text-xs text-slate-500">Columns: name, code, department, degree_type, duration_years, status</p>
            <input id="prog-import-input" type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
          </div>
        )}
        {rows.length > 0 && !result && (
          <div className="space-y-4">
            <p className="text-sm font-semibold text-slate-700">{rows.length} row(s) parsed</p>
            <div className="max-h-48 overflow-auto rounded-lg border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-xs">
                <thead className="bg-slate-50"><tr><th className="px-2 py-2 text-left font-semibold text-slate-600">Name</th><th className="px-2 py-2 text-left font-semibold text-slate-600">Code</th><th className="px-2 py-2 text-left font-semibold text-slate-600">Department</th><th className="px-2 py-2 text-left font-semibold text-slate-600">Degree</th><th className="px-2 py-2 text-left font-semibold text-slate-600">Duration</th><th className="px-2 py-2 text-left font-semibold text-slate-600">Status</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="px-2 py-1.5 text-slate-700">{r.name}</td>
                      <td className="px-2 py-1.5 text-slate-700">{r.code}</td>
                      <td className="px-2 py-1.5 text-slate-700">{departments.find((d) => d.id === r.department_id)?.name || "?"}</td>
                      <td className="px-2 py-1.5 text-slate-700">{r.degree_type.toUpperCase()}</td>
                      <td className="px-2 py-1.5 text-slate-700">{r.duration_years}</td>
                      <td className="px-2 py-1.5 text-slate-700">{r.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button type="button" onClick={handleImport} disabled={importing}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#1E3A8A] px-5 text-sm font-semibold text-white shadow-lg shadow-[#1E3A8A]/25 transition-all duration-300 hover:bg-[#152C6B] disabled:cursor-not-allowed disabled:bg-slate-400 disabled:shadow-none">
              {importing ? <><svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Importing...</>
                : <><span className="material-symbols-outlined text-lg">cloud_upload</span>Import {rows.length} programme{rows.length !== 1 ? "s" : ""}</>}
            </button>
          </div>
        )}
        {result && (
          <div className="space-y-3 animate-fade-in-up">
            <div className="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800 ring-1 ring-emerald-200"><span className="font-semibold">{result.ok}</span> programme{result.ok !== 1 ? "s" : ""} imported.</div>
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
