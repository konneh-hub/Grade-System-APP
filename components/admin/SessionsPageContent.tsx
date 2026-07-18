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

interface Session {
  id: number;
  name: string;
  code: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
}

type SortField = "name" | "code" | "start_date" | "end_date" | "is_active";
type SortDir = "asc" | "desc";

function SortIcon({ field, sortField, sortDir }: { field: SortField; sortField: SortField; sortDir: SortDir }) {
  if (sortField !== field) return <span className="ml-1 text-slate-300">&#8597;</span>;
  return <span className="ml-1 text-[#1E3A8A]">{sortDir === "asc" ? "↑" : "↓"}</span>;
}

const CHART_COLORS = ["#1E3A8A", "#7C3AED", "#0891B2", "#059669", "#D97706", "#DC2626", "#EA580C", "#0284C7"];

function getSortValue(s: Session, field: SortField): string | number {
  if (field === "is_active") return s.is_active ? 1 : 0;
  if (field === "start_date" || field === "end_date") return s[field];
  return String(s[field] ?? "");
}

export default function SessionsPageContent() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("start_date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const [createOpen, setCreateOpen] = useState(false);
  const [cf, setCf] = useState({ name: "", code: "", start_date: "", end_date: "", is_active: false });
  const [creating, setCreating] = useState(false);
  const [createMsg, setCreateMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [importOpen, setImportOpen] = useState(false);

  useEffect(() => {
    fetch("/api/academic-sessions")
      .then((r) => r.json())
      .then((payload: { data: Session[] }) => { setSessions(payload.data); })
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return sessions;
    const q = searchQuery.toLowerCase();
    return sessions.filter((s) =>
      [s.name, s.code, s.start_date, s.end_date, s.is_active ? "active" : "inactive"]
        .some((v) => v.toLowerCase().includes(q))
    );
  }, [sessions, searchQuery]);

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

  function toggleSelect(id: number) {
    setSelectedIds((prev) => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  }
  function toggleSelectAll() {
    if (selectedIds.size === sorted.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(sorted.map((r) => r.id)));
  }

  const totalSessions = sessions.length;
  const activeSession = sessions.find((s) => s.is_active);
  const activeName = activeSession?.name ?? "None";
  const avgDuration = totalSessions
    ? Math.round(sessions.reduce((sum, s) => {
        const sd = new Date(s.start_date).getTime();
        const ed = new Date(s.end_date).getTime();
        return sum + (ed - sd) / (1000 * 60 * 60 * 24);
      }, 0) / totalSessions)
    : 0;
  const thisYearCount = sessions.filter((s) => {
    const year = new Date(s.start_date).getFullYear();
    return year === new Date().getFullYear();
  }).length;

  const yearChartData = useMemo(() => {
    const map: Record<string, number> = {};
    for (const s of sessions) {
      const y = new Date(s.start_date).getFullYear();
      const k = String(y);
      map[k] = (map[k] || 0) + 1;
    }
    return Object.entries(map).sort(([a], [b]) => Number(a) - Number(b)).map(([year, count]) => ({ year, count }));
  }, [sessions]);

  const durationChartData = useMemo(() => {
    const buckets: Record<string, number> = { "<30d": 0, "30-90d": 0, "90-180d": 0, "180-365d": 0, ">365d": 0 };
    for (const s of sessions) {
      const sd = new Date(s.start_date).getTime();
      const ed = new Date(s.end_date).getTime();
      const days = (ed - sd) / (1000 * 60 * 60 * 24);
      if (days < 30) buckets["<30d"]++;
      else if (days < 90) buckets["30-90d"]++;
      else if (days < 180) buckets["90-180d"]++;
      else if (days < 365) buckets["180-365d"]++;
      else buckets[">365d"]++;
    }
    return Object.entries(buckets).filter(([, v]) => v > 0).map(([range, count]) => ({ range, count }));
  }, [sessions]);

  const activeInactiveChartData = useMemo(() => {
    const active = sessions.filter((s) => s.is_active).length;
    return [
      { name: "Active", value: active },
      { name: "Inactive", value: sessions.length - active },
    ];
  }, [sessions]);

  const trendData = useMemo(() => {
    const now = new Date();
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ month: d.toLocaleString("en", { month: "short", year: "2-digit" }), count: 0 });
    }
    for (const s of sessions) {
      const rd = new Date(s.created_at);
      const label = rd.toLocaleString("en", { month: "short", year: "2-digit" });
      const found = months.find((m) => m.month === label);
      if (found) found.count++;
    }
    return months;
  }, [sessions]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!cf.name || !cf.start_date || !cf.end_date) return;
    setCreating(true); setCreateMsg(null);
    try {
      const res = await fetch("/api/academic-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: cf.name, code: cf.code || cf.name,
          start_date: cf.start_date, end_date: cf.end_date,
          is_active: cf.is_active,
        }),
      });
      const payload = await res.json() as { error?: string };
      if (!res.ok) throw new Error(payload.error || "Failed to create session");
      setCreateMsg({ type: "success", text: `Session "${cf.name}" created.` });
      setCf({ name: "", code: "", start_date: "", end_date: "", is_active: false });
      const updated = await fetch("/api/academic-sessions").then((r) => r.json()) as { data: Session[] };
      setSessions(updated.data);
    } catch (err) {
      setCreateMsg({ type: "error", text: err instanceof Error ? err.message : "Failed to create session" });
    } finally { setCreating(false); }
  }

  function closeCreate() { setCreateOpen(false); setCreateMsg(null); setCf({ name: "", code: "", start_date: "", end_date: "", is_active: false }); }

  async function toggleActive(s: Session) {
    const next = !s.is_active;
    try {
      const res = await fetch(`/api/academic-sessions/${s.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: next }),
      });
      if (!res.ok) return;
      const updated = await fetch("/api/academic-sessions").then((r) => r.json()) as { data: Session[] };
      setSessions(updated.data);
    } catch {}
  }

  async function deleteSession(s: Session) {
    if (!confirm(`Delete "${s.name}"?`)) return;
    try {
      const res = await fetch(`/api/academic-sessions/${s.id}`, { method: "DELETE" });
      if (!res.ok) {
        const payload = await res.json() as { error?: string };
        alert(payload.error || "Failed to delete");
        return;
      }
      const updated = await fetch("/api/academic-sessions").then((r) => r.json()) as { data: Session[] };
      setSessions(updated.data);
    } catch {}
  }

  function exportExcel(data: Session[], filename = "academic-sessions.xlsx") {
    const rows = data.map((s) => ({
      Name: s.name, Code: s.code,
      "Start Date": s.start_date, "End Date": s.end_date,
      Status: s.is_active ? "Active" : "Inactive",
      "Created At": s.created_at,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sessions");
    XLSX.writeFile(wb, filename);
  }

  function exportSingleExcel(s: Session) { exportExcel([s], `session-${s.code || s.id}.xlsx`); }

  function exportPDF(data: Session[], filename = "academic-sessions.pdf") {
    const doc = new jsPDF("landscape");
    doc.setFontSize(16); doc.text("Academic Sessions", 14, 20);
    doc.setFontSize(10); doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);
    autoTable(doc, {
      startY: 34,
      head: [["Code", "Name", "Start", "End", "Status"]],
      body: data.map((s) => [s.code, s.name, s.start_date, s.end_date, s.is_active ? "Active" : "Inactive"]),
      styles: { fontSize: 8 }, headStyles: { fillColor: [30, 58, 138] },
    });
    doc.save(filename);
  }

  function exportSinglePDF(s: Session) {
    const doc = new jsPDF();
    doc.setFontSize(18); doc.text("Session Profile", 14, 22);
    doc.setFontSize(10); doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
    autoTable(doc, {
      startY: 38,
      body: [
        ["Name", s.name], ["Code", s.code],
        ["Start Date", s.start_date], ["End Date", s.end_date],
        ["Status", s.is_active ? "Active" : "Inactive"],
        ["Duration", `${Math.round((new Date(s.end_date).getTime() - new Date(s.start_date).getTime()) / (1000 * 60 * 60 * 24))} days`],
        ["Created At", new Date(s.created_at).toLocaleString()],
      ],
      theme: "plain", styles: { fontSize: 10, cellPadding: 4 },
      columnStyles: { 0: { fontStyle: "bold", cellWidth: 40 }, 1: { cellWidth: 120 } },
    });
    doc.save(`session-${s.code || s.id}.pdf`);
  }

  function handleImportDone() {
    setImportOpen(false);
    fetch("/api/academic-sessions").then((r) => r.json()).then((payload: { data: Session[] }) => setSessions(payload.data));
  }

  const ic = "rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-all duration-300 focus:border-[#1E3A8A] focus:ring-4 focus:ring-[#1E3A8A]/10";

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <div className="flex flex-col items-center gap-3">
        <svg className="h-8 w-8 animate-spin text-[#1E3A8A]" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
        <p className="text-sm text-slate-500">Loading academic sessions...</p>
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
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">Academic Sessions</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Manage academic sessions, define active periods, and track session timelines across the institution.
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button type="button" onClick={() => setImportOpen(true)}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition-all duration-300 hover:bg-slate-50">
              <span className="material-symbols-outlined text-lg">upload</span> Import
            </button>
            <button type="button" onClick={() => setCreateOpen(true)}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#1E3A8A] px-5 text-sm font-semibold text-white shadow-lg shadow-[#1E3A8A]/25 transition-all duration-300 hover:bg-[#152C6B] hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0">
              <span className="material-symbols-outlined text-lg">add</span> Add Session
            </button>
          </div>
        </div>
      </section>

      {/* Create Modal */}
      <Modal open={createOpen} onClose={closeCreate}>
        <div className="relative rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-200 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <div><h2 className="text-xl font-bold text-slate-900">Create Academic Session</h2><p className="text-sm text-slate-500">Define a new academic session period.</p></div>
            <button type="button" onClick={closeCreate} className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition-all duration-300 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-600">
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <label className="block text-sm font-medium text-slate-700">
                Session Name
                <input required className={`${ic} mt-1 w-full`} value={cf.name} onChange={(e) => setCf((p) => ({ ...p, name: e.target.value }))} placeholder="2026/2027" />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Code
                <input className={`${ic} mt-1 w-full uppercase`} value={cf.code} onChange={(e) => setCf((p) => ({ ...p, code: e.target.value }))} placeholder="2026-2027" />
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
            <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 transition-all duration-300 hover:bg-slate-100/50 cursor-pointer">
              <input type="checkbox" checked={cf.is_active} onChange={(e) => setCf((p) => ({ ...p, is_active: e.target.checked }))}
                className="h-5 w-5 rounded border-slate-300 text-[#1E3A8A] focus:ring-[#1E3A8A]" />
              <div>
                <span className="text-sm font-medium text-slate-900">Set as Active Session</span>
                <p className="text-xs text-slate-500">Only one session can be active at a time. Previous active session will be deactivated.</p>
              </div>
            </label>
            <div className="flex items-center gap-3 pt-2">
              <button type="submit" disabled={creating}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#1E3A8A] px-5 text-sm font-semibold text-white shadow-lg shadow-[#1E3A8A]/25 transition-all duration-300 hover:bg-[#152C6B] disabled:cursor-not-allowed disabled:bg-slate-400 disabled:shadow-none">
                {creating ? <><svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Saving...</>
                  : <><span className="material-symbols-outlined text-lg">calendar_month</span>Save Session</>}
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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 animate-fade-in-up [animation-delay:0.1s]">
        {[
          { label: "Total Sessions", value: totalSessions, icon: "calendar_month", iconClassName: "text-[#1E3A8A]", bg: "bg-blue-50" },
          { label: "Active Session", value: activeName, icon: "check_circle", iconClassName: "text-[#059669]", bg: "bg-emerald-50" },
          { label: "Avg Duration", value: `${avgDuration} days`, icon: "schedule", iconClassName: "text-[#7C3AED]", bg: "bg-purple-50" },
          { label: "This Year", value: thisYearCount, icon: "today", iconClassName: "text-[#D97706]", bg: "bg-amber-50" },
        ].map((card) => (
          <div key={card.label} className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">{card.label}</p>
                <p className="mt-1 text-2xl font-bold text-slate-900 truncate">{card.label === "Active Session" && card.value === "None" ? <span className="text-slate-400 italic text-lg font-medium">None</span> : card.value}</p>
              </div>
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${card.bg}`}>
                <span className={`material-symbols-outlined text-xl ${card.iconClassName}`}>{card.icon}</span>
              </div>
            </div>
            <div className="mt-3 h-8">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <defs><linearGradient id={`ses-${card.label}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={card.color} stopOpacity={0.25} /><stop offset="100%" stopColor={card.color} stopOpacity={0} /></linearGradient></defs>
                  <Area type="monotone" dataKey="count" stroke={card.color} strokeWidth={1.5} fill={`url(#ses-${card.label})`} dot={false} isAnimationActive />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-3 animate-fade-in-up [animation-delay:0.2s]">
        {/* Sessions by Year */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-md">
          <h3 className="mb-1 text-sm font-semibold text-slate-900">Sessions by Year</h3>
          <p className="mb-4 text-xs text-slate-500">Number of sessions starting each year</p>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={yearChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="year" tick={{ fontSize: 11, fill: "#64748B" }} />
                <YAxis tick={{ fontSize: 11, fill: "#64748B" }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} isAnimationActive animationDuration={800}>
                  {yearChartData.map((e, i) => <Cell key={e.year} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Duration Distribution */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-md">
          <h3 className="mb-1 text-sm font-semibold text-slate-900">Duration Distribution</h3>
          <p className="mb-4 text-xs text-slate-500">Sessions grouped by length in days</p>
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

        {/* Active vs Inactive */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-md">
          <h3 className="mb-1 text-sm font-semibold text-slate-900">Status Distribution</h3>
          <p className="mb-4 text-xs text-slate-500">Active vs inactive sessions</p>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={activeInactiveChartData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value" isAnimationActive animationDuration={800}>
                  {activeInactiveChartData.map((e) => (
                    <Cell key={e.name} fill={e.name === "Active" ? "#059669" : "#94A3B8"} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" iconType="circle" iconSize={8} formatter={(v: string) => <span className="text-xs text-slate-700">{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm animate-fade-in-up [animation-delay:0.3s]">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px] flex-1">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-lg text-slate-400">search</span>
            <input type="text" placeholder="Wide search (name, code, dates, status...)" className={`${ic} w-full pl-10`} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
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
          {filtered.length} session{filtered.length !== 1 ? "s" : ""}
          {filtered.length !== sessions.length ? ` out of ${sessions.length}` : ""}
          {selectedIds.size > 0 ? ` \u00B7 ${selectedIds.size} selected` : ""}
        </p>
      </section>

      {/* Table */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm animate-fade-in-up [animation-delay:0.35s]">
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center py-16">
            <span className="material-symbols-outlined text-5xl text-slate-300">calendar_month</span>
            <p className="mt-4 text-sm font-medium text-slate-600">No sessions match your criteria.</p>
            <p className="text-xs text-slate-400">Try adjusting your search.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="w-10 px-3 py-3">
                    <label htmlFor="select-all-sessions" className="sr-only">Select all sessions</label>
                    <input id="select-all-sessions" aria-label="Select all sessions" type="checkbox" checked={selectedIds.size === sorted.length && sorted.length > 0} onChange={toggleSelectAll} className="h-4 w-4 rounded border-slate-300 text-[#1E3A8A] focus:ring-[#1E3A8A]" />
                  </th>
                  <Th onClick={() => toggleSort("name")} active={sortField === "name"} sortDir={sortDir}>Name <SortIcon field="name" sortField={sortField} sortDir={sortDir} /></Th>
                  <Th onClick={() => toggleSort("code")} active={sortField === "code"} sortDir={sortDir}>Code <SortIcon field="code" sortField={sortField} sortDir={sortDir} /></Th>
                  <Th onClick={() => toggleSort("start_date")} active={sortField === "start_date"} sortDir={sortDir}>Start <SortIcon field="start_date" sortField={sortField} sortDir={sortDir} /></Th>
                  <Th onClick={() => toggleSort("end_date")} active={sortField === "end_date"} sortDir={sortDir}>End <SortIcon field="end_date" sortField={sortField} sortDir={sortDir} /></Th>
                  <Th onClick={() => toggleSort("is_active")} active={sortField === "is_active"} sortDir={sortDir}>Status <SortIcon field="is_active" sortField={sortField} sortDir={sortDir} /></Th>
                  <Th>Actions</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sorted.map((sess) => (
                  <tr key={sess.id} className={`transition-all duration-200 hover:bg-slate-50 ${selectedIds.has(sess.id) ? "bg-blue-50/40" : ""}`}>
                    <td className="px-3 py-3">
                      <label htmlFor={`select-session-${sess.id}`} className="sr-only">Select {sess.name}</label>
                      <input id={`select-session-${sess.id}`} aria-label={`Select session ${sess.name}`} type="checkbox" checked={selectedIds.has(sess.id)} onChange={() => toggleSelect(sess.id)} className="h-4 w-4 rounded border-slate-300 text-[#1E3A8A] focus:ring-[#1E3A8A]" />
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#1E3A8A] text-xs font-bold text-white">{sess.name.charAt(0).toUpperCase()}</div>
                        <span className="font-semibold text-slate-900">{sess.name}</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3"><span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-mono font-semibold text-slate-700">{sess.code}</span></td>
                    <td className="whitespace-nowrap px-3 py-3 text-slate-600">{sess.start_date}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-slate-600">{sess.end_date}</td>
                    <td className="whitespace-nowrap px-3 py-3">
                      <button type="button" onClick={() => toggleActive(sess)}
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-[11px] font-semibold transition-all duration-200 hover:scale-105 ${
                          sess.is_active
                            ? "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300"
                            : "bg-slate-100 text-slate-500 ring-1 ring-slate-200"
                        }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${sess.is_active ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
                        {sess.is_active ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">
                      <div className="flex items-center gap-1">
                        <button type="button" onClick={() => exportSingleExcel(sess)} className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-all duration-200 hover:bg-emerald-50 hover:text-emerald-600" title="Export Excel"><span className="material-symbols-outlined text-base">table</span></button>
                        <button type="button" onClick={() => exportSinglePDF(sess)} className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-all duration-200 hover:bg-red-50 hover:text-red-600" title="Export PDF"><span className="material-symbols-outlined text-base">picture_as_pdf</span></button>
                        <button type="button" onClick={() => deleteSession(sess)} className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-all duration-200 hover:bg-red-50 hover:text-red-600" title="Delete"><span className="material-symbols-outlined text-base">delete</span></button>
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
      <SessionImportModal open={importOpen} onClose={handleImportDone} />
    </div>
  );
}

/* ── import modal ── */
function SessionImportModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [rows, setRows] = useState<{ name: string; code: string; start_date: string; end_date: string; is_active: boolean }[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ ok: number; errors: string[] } | null>(null);

  function parseDate(v: unknown): string {
    if (!v) return "";
    if (typeof v === "number") {
      // Excel serial date
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
    const parsed = data.map((r) => ({
      name: String(r.name || r.Name || r["Session Name"] || "").trim(),
      code: String(r.code || r.Code || r["Session Code"] || "").trim().toUpperCase(),
      start_date: parseDate(r.start_date || r["Start Date"] || r.startDate),
      end_date: parseDate(r.end_date || r["End Date"] || r.endDate),
      is_active: typeof r.is_active === "string"
        ? ["true", "yes", "active", "1"].includes(r.is_active.toLowerCase().trim())
        : r.is_active === true || r.is_active === 1,
    }));
    setRows(parsed);
  }

  async function handleImport() {
    setImporting(true); setResult(null);
    const errors: string[] = []; let ok = 0;
    for (const row of rows) {
      if (!row.name || !row.start_date || !row.end_date) { errors.push(`${row.name || row.code || "?"}: Missing required fields`); continue; }
      try {
        const res = await fetch("/api/academic-sessions", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(row),
        });
        const payload = await res.json() as { error?: string };
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
          <div><h2 className="text-xl font-bold text-slate-900">Import Sessions</h2><p className="text-sm text-slate-500">Upload an Excel file to batch-create academic sessions</p></div>
          <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition-all duration-300 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-600">
            <span className="material-symbols-outlined text-lg">close</span></button>
        </div>
        {rows.length === 0 && !result && (
          <div className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center transition-all duration-300 hover:border-[#1E3A8A] hover:bg-blue-50/50" onClick={() => document.getElementById("sess-import-input")?.click()}>
            <span className="material-symbols-outlined text-4xl text-slate-400">upload_file</span>
            <p className="mt-3 text-sm font-medium text-slate-700">Drop an Excel file here, or click to browse</p>
            <p className="mt-1 text-xs text-slate-500">Columns: name, code, start_date, end_date, is_active</p>
            <input id="sess-import-input" aria-label="Upload academic sessions file" type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
          </div>
        )}
        {rows.length > 0 && !result && (
          <div className="space-y-4">
            <p className="text-sm font-semibold text-slate-700">{rows.length} row(s) parsed</p>
            <div className="max-h-48 overflow-auto rounded-lg border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-xs">
                <thead className="bg-slate-50"><tr><th className="px-2 py-2 text-left font-semibold text-slate-600">Name</th><th className="px-2 py-2 text-left font-semibold text-slate-600">Code</th><th className="px-2 py-2 text-left font-semibold text-slate-600">Start</th><th className="px-2 py-2 text-left font-semibold text-slate-600">End</th><th className="px-2 py-2 text-left font-semibold text-slate-600">Active</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="px-2 py-1.5 text-slate-700">{r.name}</td>
                      <td className="px-2 py-1.5 text-slate-700">{r.code}</td>
                      <td className="px-2 py-1.5 text-slate-700">{r.start_date}</td>
                      <td className="px-2 py-1.5 text-slate-700">{r.end_date}</td>
                      <td className="px-2 py-1.5 text-slate-700">{r.is_active ? "Yes" : "No"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button type="button" onClick={handleImport} disabled={importing}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#1E3A8A] px-5 text-sm font-semibold text-white shadow-lg shadow-[#1E3A8A]/25 transition-all duration-300 hover:bg-[#152C6B] disabled:cursor-not-allowed disabled:bg-slate-400 disabled:shadow-none">
              {importing ? <><svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Importing...</>
                : <><span className="material-symbols-outlined text-lg">cloud_upload</span>Import {rows.length} session{rows.length !== 1 ? "s" : ""}</>}
            </button>
          </div>
        )}
        {result && (
          <div className="space-y-3 animate-fade-in-up">
            <div className="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800 ring-1 ring-emerald-200"><span className="font-semibold">{result.ok}</span> session{result.ok !== 1 ? "s" : ""} imported.</div>
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

function Th({ children, onClick, active }: { children: React.ReactNode; onClick?: () => void; active?: boolean }) {
  return (
    <th onClick={onClick} className={`px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider ${onClick ? "cursor-pointer select-none hover:text-[#1E3A8A]" : ""} ${active ? "text-[#1E3A8A]" : "text-slate-600"}`}>
      {children}
    </th>
  );
}
