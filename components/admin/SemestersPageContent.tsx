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

interface Semester {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  status: string;
  academic_session_id: number;
  academic_session_name: string;
  created_at: string;
}

interface AcademicSession {
  id: number;
  name: string;
  code: string;
  is_active: boolean;
}

type SortField = "name" | "academic_session_name" | "start_date" | "end_date" | "status";
type SortDir = "asc" | "desc";

const CHART_COLORS = ["#1E3A8A", "#7C3AED", "#0891B2", "#059669", "#D97706", "#DC2626", "#EA580C", "#0284C7"];
const STATUS_COLORS: Record<string, string> = { active: "#059669", inactive: "#94A3B8", closed: "#DC2626" };

function getSortValue(s: Semester, field: SortField): string | number {
  if (field === "start_date" || field === "end_date") return s[field];
  if (field === "academic_session_name") return s.academic_session_name || "";
  return String(s[field] ?? "");
}

export default function SemestersPageContent() {
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("start_date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const [createOpen, setCreateOpen] = useState(false);
  const [cf, setCf] = useState({ name: "", academic_session_id: "", start_date: "", end_date: "", status: "inactive" });
  const [creating, setCreating] = useState(false);
  const [createMsg, setCreateMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [importOpen, setImportOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch("/api/semesters").then((r) => r.json()),
      fetch("/api/academic-sessions").then((r) => r.json()),
    ])
      .then(([sems, sessPayload]: [Semester[], { data: AcademicSession[] }]) => {
        setSemesters(sems);
        setSessions(sessPayload.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return semesters;
    const q = searchQuery.toLowerCase();
    return semesters.filter((s) =>
      [s.name, s.academic_session_name, s.start_date, s.end_date, s.status]
        .some((v) => (v || "").toLowerCase().includes(q))
    );
  }, [semesters, searchQuery]);

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
    return <span className="ml-1 text-[#1E3A8A]">{sortDir === "asc" ? "\u2191" : "\u2193"}</span>;
  }

  function toggleSelect(id: number) {
    setSelectedIds((prev) => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  }
  function toggleSelectAll() {
    if (selectedIds.size === sorted.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(sorted.map((r) => r.id)));
  }

  const totalSemesters = semesters.length;
  const activeSemesters = semesters.filter((s) => s.status === "active").length;
  const avgDuration = totalSemesters
    ? Math.round(semesters.reduce((sum, s) => {
        const sd = new Date(s.start_date).getTime();
        const ed = new Date(s.end_date).getTime();
        return sum + (ed - sd) / (1000 * 60 * 60 * 24);
      }, 0) / totalSemesters)
    : 0;
  const currentSessionName = sessions.find((s) => s.is_active)?.name ?? "None";

  const statusChartData = useMemo(() => {
    const map: Record<string, number> = {};
    for (const s of semesters) { map[s.status] = (map[s.status] || 0) + 1; }
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [semesters]);

  const sessionChartData = useMemo(() => {
    const map: Record<string, number> = {};
    for (const s of semesters) {
      const k = s.academic_session_name || "Unknown";
      map[k] = (map[k] || 0) + 1;
    }
    return Object.entries(map).sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count }));
  }, [semesters]);

  const durationChartData = useMemo(() => {
    const buckets: Record<string, number> = { "<30d": 0, "30-60d": 0, "60-90d": 0, "90-120d": 0, ">120d": 0 };
    for (const s of semesters) {
      const sd = new Date(s.start_date).getTime();
      const ed = new Date(s.end_date).getTime();
      const days = (ed - sd) / (1000 * 60 * 60 * 24);
      if (days < 30) buckets["<30d"]++;
      else if (days < 60) buckets["30-60d"]++;
      else if (days < 90) buckets["60-90d"]++;
      else if (days < 120) buckets["90-120d"]++;
      else buckets[">120d"]++;
    }
    return Object.entries(buckets).filter(([, v]) => v > 0).map(([range, count]) => ({ range, count }));
  }, [semesters]);

  const trendData = useMemo(() => {
    const now = new Date();
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ month: d.toLocaleString("en", { month: "short", year: "2-digit" }), count: 0 });
    }
    for (const s of semesters) {
      const rd = new Date(s.created_at);
      const label = rd.toLocaleString("en", { month: "short", year: "2-digit" });
      const found = months.find((m) => m.month === label);
      if (found) found.count++;
    }
    return months;
  }, [semesters]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!cf.name || !cf.academic_session_id || !cf.start_date || !cf.end_date) return;
    setCreating(true); setCreateMsg(null);
    try {
      const res = await fetch("/api/semesters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: cf.name,
          academic_session_id: Number(cf.academic_session_id),
          start_date: cf.start_date,
          end_date: cf.end_date,
          status: cf.status,
        }),
      });
      const payload = await res.json() as { error?: string };
      if (!res.ok) throw new Error(payload.error || "Failed to create semester");
      setCreateMsg({ type: "success", text: `Semester "${cf.name}" created.` });
      setCf({ name: "", academic_session_id: "", start_date: "", end_date: "", status: "inactive" });
      const [updated, sessPayload] = await Promise.all([
        fetch("/api/semesters").then((r) => r.json()) as Promise<Semester[]>,
        fetch("/api/academic-sessions").then((r) => r.json()) as Promise<{ data: AcademicSession[] }>,
      ]);
      setSemesters(updated);
      setSessions(sessPayload.data);
    } catch (err) {
      setCreateMsg({ type: "error", text: err instanceof Error ? err.message : "Failed to create semester" });
    } finally { setCreating(false); }
  }

  function closeCreate() { setCreateOpen(false); setCreateMsg(null); setCf({ name: "", academic_session_id: "", start_date: "", end_date: "", status: "inactive" }); }

  async function updateStatus(s: Semester, status: string) {
    try {
      const res = await fetch(`/api/semesters/${s.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) return;
      const [updated, sessPayload] = await Promise.all([
        fetch("/api/semesters").then((r) => r.json()) as Promise<Semester[]>,
        fetch("/api/academic-sessions").then((r) => r.json()) as Promise<{ data: AcademicSession[] }>,
      ]);
      setSemesters(updated);
      setSessions(sessPayload.data);
    } catch {}
  }

  async function deleteSemester(s: Semester) {
    if (!confirm(`Delete "${s.name}"?`)) return;
    try {
      const res = await fetch(`/api/semesters/${s.id}`, { method: "DELETE" });
      if (!res.ok) { const p = await res.json() as { error?: string }; alert(p.error || "Failed to delete"); return; }
      const updated = await fetch("/api/semesters").then((r) => r.json()) as Promise<Semester[]>;
      setSemesters(await updated);
    } catch {}
  }

  function exportExcel(data: Semester[], filename = "semesters.xlsx") {
    const rows = data.map((s) => ({
      Name: s.name,
      "Academic Session": s.academic_session_name,
      "Start Date": s.start_date,
      "End Date": s.end_date,
      Status: s.status,
      "Created At": s.created_at,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Semesters");
    XLSX.writeFile(wb, filename);
  }

  function exportSingleExcel(s: Semester) { exportExcel([s], `semester-${s.name.replace(/\s+/g, "-")}.xlsx`); }

  function exportPDF(data: Semester[], filename = "semesters.pdf") {
    const doc = new jsPDF("landscape");
    doc.setFontSize(16); doc.text("Semesters", 14, 20);
    doc.setFontSize(10); doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);
    autoTable(doc, {
      startY: 34,
      head: [["Name", "Academic Session", "Start", "End", "Status"]],
      body: data.map((s) => [s.name, s.academic_session_name, s.start_date, s.end_date, s.status]),
      styles: { fontSize: 8 }, headStyles: { fillColor: [30, 58, 138] },
    });
    doc.save(filename);
  }

  function exportSinglePDF(s: Semester) {
    const doc = new jsPDF();
    doc.setFontSize(18); doc.text("Semester Profile", 14, 22);
    doc.setFontSize(10); doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
    autoTable(doc, {
      startY: 38,
      body: [
        ["Name", s.name],
        ["Academic Session", s.academic_session_name],
        ["Start Date", s.start_date],
        ["End Date", s.end_date],
        ["Status", s.status],
        ["Duration", `${Math.round((new Date(s.end_date).getTime() - new Date(s.start_date).getTime()) / (1000 * 60 * 60 * 24))} days`],
        ["Created At", new Date(s.created_at).toLocaleString()],
      ],
      theme: "plain", styles: { fontSize: 10, cellPadding: 4 },
      columnStyles: { 0: { fontStyle: "bold", cellWidth: 40 }, 1: { cellWidth: 120 } },
    });
    doc.save(`semester-${s.name.replace(/\s+/g, "-")}.pdf`);
  }

  function handleImportDone() {
    setImportOpen(false);
    Promise.all([
      fetch("/api/semesters").then((r) => r.json()),
      fetch("/api/academic-sessions").then((r) => r.json()),
    ]).then(([sems, sessPayload]: [Semester[], { data: AcademicSession[] }]) => { setSemesters(sems); setSessions(sessPayload.data); });
  }

  const ic = "rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-all duration-300 focus:border-[#1E3A8A] focus:ring-4 focus:ring-[#1E3A8A]/10";

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <div className="flex flex-col items-center gap-3">
        <svg className="h-8 w-8 animate-spin text-[#1E3A8A]" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
        <p className="text-sm text-slate-500">Loading semesters...</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm animate-fade-in-up">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#1E3A8A]">Administration</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">Semesters</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Manage academic semesters, activate or close periods, and track semester timelines across academic sessions.
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button type="button" onClick={() => setImportOpen(true)}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition-all duration-300 hover:bg-slate-50">
              <span className="material-symbols-outlined text-lg">upload</span> Import
            </button>
            <button type="button" onClick={() => setCreateOpen(true)}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#1E3A8A] px-5 text-sm font-semibold text-white shadow-lg shadow-[#1E3A8A]/25 transition-all duration-300 hover:bg-[#152C6B] hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0">
              <span className="material-symbols-outlined text-lg">add</span> Add Semester
            </button>
          </div>
        </div>
      </section>

      {/* Create Modal */}
      <Modal open={createOpen} onClose={closeCreate}>
        <div className="relative rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-200 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <div><h2 className="text-xl font-bold text-slate-900">Create Semester</h2><p className="text-sm text-slate-500">Add a new semester under an academic session.</p></div>
            <button type="button" onClick={closeCreate} className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition-all duration-300 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-600">
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <label className="block text-sm font-medium text-slate-700">
                Semester Name
                <input required className={`${ic} mt-1 w-full`} value={cf.name} onChange={(e) => setCf((p) => ({ ...p, name: e.target.value }))} placeholder="First Semester" />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Academic Session
                <select required className={`${ic} mt-1 w-full`} value={cf.academic_session_id} onChange={(e) => setCf((p) => ({ ...p, academic_session_id: e.target.value }))}>
                  <option value="">Select session</option>
                  {sessions.map((ses) => (
                    <option key={ses.id} value={ses.id}>
                      {ses.name}{ses.is_active ? " (active)" : ""}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <label className="block text-sm font-medium text-slate-700">
                Start Date
                <input required type="date" className={`${ic} mt-1 w-full`} value={cf.start_date} onChange={(e) => setCf((p) => ({ ...p, start_date: e.target.value }))} />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                End Date
                <input required type="date" className={`${ic} mt-1 w-full`} value={cf.end_date} onChange={(e) => setCf((p) => ({ ...p, end_date: e.target.value }))} />
              </label>
            </div>
            <label className="block text-sm font-medium text-slate-700">
              Status
              <select className={`${ic} mt-1 w-full`} value={cf.status} onChange={(e) => setCf((p) => ({ ...p, status: e.target.value }))}>
                <option value="inactive">Inactive</option>
                <option value="active">Active</option>
                <option value="closed">Closed</option>
              </select>
            </label>
            <div className="flex items-center gap-3 pt-2">
              <button type="submit" disabled={creating || !cf.academic_session_id}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#1E3A8A] px-5 text-sm font-semibold text-white shadow-lg shadow-[#1E3A8A]/25 transition-all duration-300 hover:bg-[#152C6B] disabled:cursor-not-allowed disabled:bg-slate-400 disabled:shadow-none">
                {creating ? <><svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Saving...</>
                  : <><span className="material-symbols-outlined text-lg">calendar_view_month</span>Save Semester</>}
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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
        {[
          { label: "Total Semesters", value: totalSemesters, icon: "calendar_view_month", color: "#1E3A8A", bg: "bg-blue-50" },
          { label: "Active", value: activeSemesters, icon: "check_circle", color: "#059669", bg: "bg-emerald-50" },
          { label: "Avg Duration", value: `${avgDuration} days`, icon: "schedule", color: "#7C3AED", bg: "bg-purple-50" },
          { label: "Current Session", value: currentSessionName, icon: "today", color: "#D97706", bg: "bg-amber-50" },
        ].map((card) => (
          <div key={card.label} className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
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
                  <defs><linearGradient id={`sem-${card.label}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={card.color} stopOpacity={0.25} /><stop offset="100%" stopColor={card.color} stopOpacity={0} /></linearGradient></defs>
                  <Area type="monotone" dataKey="count" stroke={card.color} strokeWidth={1.5} fill={`url(#sem-${card.label})`} dot={false} isAnimationActive />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-3 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
        {/* Semesters per Academic Session */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
          <h3 className="mb-1 text-sm font-semibold text-slate-900">Semesters per Session</h3>
          <p className="mb-4 text-xs text-slate-500">Count of semesters under each academic session</p>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sessionChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: "#64748B" }} angle={-20} textAnchor="end" height={55} />
                <YAxis tick={{ fontSize: 11, fill: "#64748B" }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} isAnimationActive animationDuration={800}>
                  {sessionChartData.map((e, i) => <Cell key={e.name} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Duration Distribution */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
          <h3 className="mb-1 text-sm font-semibold text-slate-900">Duration Distribution</h3>
          <p className="mb-4 text-xs text-slate-500">Semesters grouped by length in days</p>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={durationChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis type="number" tick={{ fontSize: 11, fill: "#64748B" }} allowDecimals={false} />
                <YAxis type="category" dataKey="range" tick={{ fontSize: 10, fill: "#64748B" }} width={60} />
                <Tooltip />
                <Bar dataKey="count" radius={[0, 6, 6, 0]} isAnimationActive animationDuration={800}>
                  {durationChartData.map((e, i) => <Cell key={e.range} fill={CHART_COLORS[(i + 2) % CHART_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
          <h3 className="mb-1 text-sm font-semibold text-slate-900">Status Distribution</h3>
          <p className="mb-4 text-xs text-slate-500">Active, inactive, and closed semesters</p>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusChartData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value" isAnimationActive animationDuration={800}>
                  {statusChartData.map((e) => <Cell key={e.name} fill={STATUS_COLORS[e.name] || "#94A3B8"} />)}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" iconType="circle" iconSize={8} formatter={(v: string) => <span className="text-xs text-slate-700">{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px] flex-1">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-lg text-slate-400">search</span>
            <input type="text" placeholder="Wide search (name, session, dates, status...)" className={`${ic} w-full pl-10`} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
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
          {filtered.length} semester{filtered.length !== 1 ? "s" : ""}
          {filtered.length !== semesters.length ? ` out of ${semesters.length}` : ""}
          {selectedIds.size > 0 ? ` \u00B7 ${selectedIds.size} selected` : ""}
        </p>
      </section>

      {/* Table */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm animate-fade-in-up" style={{ animationDelay: "0.35s" }}>
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center py-16">
            <span className="material-symbols-outlined text-5xl text-slate-300">calendar_view_month</span>
            <p className="mt-4 text-sm font-medium text-slate-600">No semesters match your criteria.</p>
            <p className="text-xs text-slate-400">Try adjusting your search.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="w-10 px-3 py-3"><input type="checkbox" checked={selectedIds.size === sorted.length && sorted.length > 0} onChange={toggleSelectAll} className="h-4 w-4 rounded border-slate-300 text-[#1E3A8A] focus:ring-[#1E3A8A]" /></th>
                  <Th onClick={() => toggleSort("name")} active={sortField === "name"} sortDir={sortDir}>Name <SortIcon field="name" /></Th>
                  <Th onClick={() => toggleSort("academic_session_name")} active={sortField === "academic_session_name"} sortDir={sortDir}>Session <SortIcon field="academic_session_name" /></Th>
                  <Th onClick={() => toggleSort("start_date")} active={sortField === "start_date"} sortDir={sortDir}>Start <SortIcon field="start_date" /></Th>
                  <Th onClick={() => toggleSort("end_date")} active={sortField === "end_date"} sortDir={sortDir}>End <SortIcon field="end_date" /></Th>
                  <Th onClick={() => toggleSort("status")} active={sortField === "status"} sortDir={sortDir}>Status <SortIcon field="status" /></Th>
                  <Th>Actions</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sorted.map((sem) => (
                  <tr key={sem.id} className={`transition-all duration-200 hover:bg-slate-50 ${selectedIds.has(sem.id) ? "bg-blue-50/40" : ""}`}>
                    <td className="px-3 py-3"><input type="checkbox" checked={selectedIds.has(sem.id)} onChange={() => toggleSelect(sem.id)} className="h-4 w-4 rounded border-slate-300 text-[#1E3A8A] focus:ring-[#1E3A8A]" /></td>
                    <td className="whitespace-nowrap px-3 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#7C3AED] text-xs font-bold text-white">{sem.name.charAt(0).toUpperCase()}</div>
                        <span className="font-semibold text-slate-900">{sem.name}</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">{sem.academic_session_name}</span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-slate-600">{sem.start_date}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-slate-600">{sem.end_date}</td>
                    <td className="whitespace-nowrap px-3 py-3">
                      <StatusBadge status={sem.status} onActivate={() => updateStatus(sem, "active")} onClose={() => updateStatus(sem, "closed")} />
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">
                      <div className="flex items-center gap-1">
                        <button type="button" onClick={() => exportSingleExcel(sem)} className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-all duration-200 hover:bg-emerald-50 hover:text-emerald-600" title="Export Excel"><span className="material-symbols-outlined text-base">table</span></button>
                        <button type="button" onClick={() => exportSinglePDF(sem)} className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-all duration-200 hover:bg-red-50 hover:text-red-600" title="Export PDF"><span className="material-symbols-outlined text-base">picture_as_pdf</span></button>
                        <button type="button" onClick={() => deleteSemester(sem)} className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-all duration-200 hover:bg-red-50 hover:text-red-600" title="Delete"><span className="material-symbols-outlined text-base">delete</span></button>
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
      <SemesterImportModal open={importOpen} onClose={handleImportDone} sessions={sessions} />
    </div>
  );
}

/* ── Status badge with dropdown ── */
function StatusBadge({ status, onActivate, onClose }: { status: string; onActivate: () => void; onClose: () => void }) {
  const [open, setOpen] = useState(false);

  const colorMap: Record<string, string> = {
    active: "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300",
    inactive: "bg-slate-100 text-slate-500 ring-1 ring-slate-200",
    closed: "bg-red-100 text-red-700 ring-1 ring-red-200",
  };
  const dotMap: Record<string, string> = {
    active: "bg-emerald-500 animate-pulse",
    inactive: "bg-slate-400",
    closed: "bg-red-500",
  };

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-[11px] font-semibold transition-all duration-200 hover:scale-105 ${colorMap[status] || "bg-slate-100 text-slate-500"}`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${dotMap[status] || "bg-slate-400"}`} />
        {status}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-20 mt-1 min-w-[120px] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg animate-fade-in-up">
            {status !== "active" && (
              <button type="button" onClick={() => { onActivate(); setOpen(false); }}
                className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 transition-all hover:bg-emerald-50 hover:text-emerald-700">
                <span className="material-symbols-outlined text-sm">check_circle</span> Activate
              </button>
            )}
            {status !== "closed" && (
              <button type="button" onClick={() => { onClose(); setOpen(false); }}
                className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 transition-all hover:bg-red-50 hover:text-red-700">
                <span className="material-symbols-outlined text-sm">cancel</span> Close
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/* ── Import modal ── */
function SemesterImportModal({ open, onClose, sessions }: { open: boolean; onClose: () => void; sessions: AcademicSession[] }) {
  const [rows, setRows] = useState<{ name: string; academic_session_id: number; start_date: string; end_date: string; status: string }[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ ok: number; errors: string[] } | null>(null);

  function parseDate(v: unknown): string {
    if (!v) return "";
    if (typeof v === "number") {
      const d = new Date((v - 25569) * 86400 * 1000);
      return d.toISOString().split("T")[0];
    }
    const s = String(v).trim();
    const d = new Date(s);
    if (!isNaN(d.getTime())) return d.toISOString().split("T")[0];
    return s;
  }

  async function handleFile(file: File) {
    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) return;
    setResult(null);
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });
    const parsed = data.map((r) => {
      const sessionInput = String(r.academic_session || r.session || r["Academic Session"] || "").toLowerCase();
      const matched = sessions.find(
        (s) => s.name.toLowerCase() === sessionInput || s.code.toLowerCase() === sessionInput || String(s.id) === sessionInput
      );
      return {
        name: String(r.name || r.Name || r["Semester Name"] || "").trim(),
        academic_session_id: matched?.id ?? 0,
        start_date: parseDate(r.start_date || r["Start Date"] || r.startDate),
        end_date: parseDate(r.end_date || r["End Date"] || r.endDate),
        status: String(r.status || r.Status || "inactive").trim().toLowerCase(),
      };
    });
    setRows(parsed);
  }

  async function handleImport() {
    setImporting(true); setResult(null);
    const errors: string[] = []; let ok = 0;
    for (const row of rows) {
      if (!row.name || !row.academic_session_id || !row.start_date || !row.end_date) {
        errors.push(`${row.name || "?"}: Missing required fields`);
        continue;
      }
      try {
        const res = await fetch("/api/semesters", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(row),
        });
        const payload = await res.json() as { error?: string };
        if (!res.ok) errors.push(`${row.name}: ${payload.error || "Error"}`);
        else ok++;
      } catch { errors.push(`${row.name}: Network error`); }
    }
    setResult({ ok, errors }); setImporting(false);
  }

  return (
    <Modal open={open} onClose={() => { setRows([]); setResult(null); onClose(); }}>
      <div className="relative max-h-[85vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-200 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <div><h2 className="text-xl font-bold text-slate-900">Import Semesters</h2><p className="text-sm text-slate-500">Upload an Excel file to batch-create semesters</p></div>
          <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition-all duration-300 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-600">
            <span className="material-symbols-outlined text-lg">close</span></button>
        </div>
        {rows.length === 0 && !result && (
          <div className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center transition-all duration-300 hover:border-[#1E3A8A] hover:bg-blue-50/50" onClick={() => document.getElementById("sem-import-input")?.click()}>
            <span className="material-symbols-outlined text-4xl text-slate-400">upload_file</span>
            <p className="mt-3 text-sm font-medium text-slate-700">Drop an Excel file here, or click to browse</p>
            <p className="mt-1 text-xs text-slate-500">Columns: name, academic_session, start_date, end_date, status</p>
            <input id="sem-import-input" type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
          </div>
        )}
        {rows.length > 0 && !result && (
          <div className="space-y-4">
            <p className="text-sm font-semibold text-slate-700">{rows.length} row(s) parsed</p>
            <div className="max-h-48 overflow-auto rounded-lg border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-xs">
                <thead className="bg-slate-50"><tr><th className="px-2 py-2 text-left font-semibold text-slate-600">Name</th><th className="px-2 py-2 text-left font-semibold text-slate-600">Session</th><th className="px-2 py-2 text-left font-semibold text-slate-600">Start</th><th className="px-2 py-2 text-left font-semibold text-slate-600">End</th><th className="px-2 py-2 text-left font-semibold text-slate-600">Status</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="px-2 py-1.5 text-slate-700">{r.name}</td>
                      <td className="px-2 py-1.5 text-slate-700">{sessions.find((s) => s.id === r.academic_session_id)?.name || "?"}</td>
                      <td className="px-2 py-1.5 text-slate-700">{r.start_date}</td>
                      <td className="px-2 py-1.5 text-slate-700">{r.end_date}</td>
                      <td className="px-2 py-1.5 text-slate-700">{r.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button type="button" onClick={handleImport} disabled={importing}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#1E3A8A] px-5 text-sm font-semibold text-white shadow-lg shadow-[#1E3A8A]/25 transition-all duration-300 hover:bg-[#152C6B] disabled:cursor-not-allowed disabled:bg-slate-400 disabled:shadow-none">
              {importing ? <><svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Importing...</>
                : <><span className="material-symbols-outlined text-lg">cloud_upload</span>Import {rows.length} semester{rows.length !== 1 ? "s" : ""}</>}
            </button>
          </div>
        )}
        {result && (
          <div className="space-y-3 animate-fade-in-up">
            <div className="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800 ring-1 ring-emerald-200"><span className="font-semibold">{result.ok}</span> semester{result.ok !== 1 ? "s" : ""} imported.</div>
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
