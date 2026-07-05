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

interface CalendarEvent {
  id: number;
  title: string;
  category: string;
  start_date: string;
  end_date: string;
  description: string | null;
  status: string;
  created_at: string;
}

type SortField = "title" | "category" | "start_date" | "end_date" | "status";
type SortDir = "asc" | "desc";

const CHART_COLORS = ["#1E3A8A", "#7C3AED", "#0891B2", "#059669", "#D97706", "#DC2626", "#EA580C", "#0284C7"];
const CATEGORY_COLORS: Record<string, string> = {
  registration: "#1E3A8A", examination: "#DC2626", "result-entry": "#059669",
  "submission-deadline": "#D97706", graduation: "#7C3AED", holiday: "#0891B2",
};
const STATUS_COLORS: Record<string, string> = { active: "#059669", inactive: "#94A3B8", closed: "#DC2626" };

const CATEGORY_OPTIONS = [
  { value: "registration", label: "Registration" },
  { value: "examination", label: "Examination" },
  { value: "result-entry", label: "Result Entry" },
  { value: "submission-deadline", label: "Submission Deadline" },
  { value: "graduation", label: "Graduation" },
  { value: "holiday", label: "Holiday" },
];

function getSortValue(e: CalendarEvent, field: SortField): string | number {
  if (field === "start_date" || field === "end_date") return e[field];
  return String(e[field] ?? "");
}

export default function CalendarPageContent() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("start_date");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const [createOpen, setCreateOpen] = useState(false);
  const [cf, setCf] = useState({ title: "", category: "registration", start_date: "", end_date: "", description: "", status: "active" });
  const [creating, setCreating] = useState(false);
  const [createMsg, setCreateMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [importOpen, setImportOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch("/api/admin/calendar")
      .then((r) => r.json())
      .then((data: CalendarEvent[]) => setEvents(data))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return events;
    const q = searchQuery.toLowerCase();
    return events.filter((e) =>
      [e.title, e.category, e.start_date, e.end_date, e.description, e.status]
        .some((v) => (v || "").toLowerCase().includes(q))
    );
  }, [events, searchQuery]);

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

  const totalEvents = events.length;
  const activeEvents = events.filter((e) => e.status === "active").length;
  const categoryCount = [...new Set(events.map((e) => e.category))].length;
  const upcomingEvents = events.filter((e) => e.start_date >= new Date().toISOString().split("T")[0]).length;

  const categoryChartData = useMemo(() => {
    const map: Record<string, number> = {};
    for (const e of events) { map[e.category] = (map[e.category] || 0) + 1; }
    return Object.entries(map).sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count }));
  }, [events]);

  const monthChartData = useMemo(() => {
    const map: Record<string, number> = {};
    for (const e of events) {
      const d = new Date(e.start_date);
      const k = d.toLocaleString("en", { month: "short", year: "2-digit" });
      map[k] = (map[k] || 0) + 1;
    }
    const monthOrder = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return Object.entries(map)
      .sort(([a], [b]) => {
        const [am, ay] = [a.slice(0, 3), a.slice(4)];
        const [bm, by] = [b.slice(0, 3), b.slice(4)];
        if (ay !== by) return Number(ay) - Number(by);
        return monthOrder.indexOf(am) - monthOrder.indexOf(bm);
      })
      .map(([month, count]) => ({ month, count }));
  }, [events]);

  const statusChartData = useMemo(() => {
    const map: Record<string, number> = {};
    for (const e of events) { map[e.status] = (map[e.status] || 0) + 1; }
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [events]);

  const trendData = useMemo(() => {
    const now = new Date();
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ month: d.toLocaleString("en", { month: "short", year: "2-digit" }), count: 0 });
    }
    for (const e of events) {
      const rd = new Date(e.created_at);
      const label = rd.toLocaleString("en", { month: "short", year: "2-digit" });
      const found = months.find((m) => m.month === label);
      if (found) found.count++;
    }
    return months;
  }, [events]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!cf.title || !cf.start_date || !cf.end_date) return;
    setCreating(true); setCreateMsg(null);
    try {
      const res = await fetch("/api/admin/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: cf.title, category: cf.category,
          start_date: cf.start_date, end_date: cf.end_date,
          description: cf.description || undefined,
          status: cf.status,
        }),
      });
      const payload = await res.json() as { error?: string };
      if (!res.ok) throw new Error(payload.error || "Failed to create event");
      setCreateMsg({ type: "success", text: `Event "${cf.title}" created.` });
      setCf({ title: "", category: "registration", start_date: "", end_date: "", description: "", status: "active" });
      const updated = await fetch("/api/admin/calendar").then((r) => r.json()) as CalendarEvent[];
      setEvents(updated);
    } catch (err) {
      setCreateMsg({ type: "error", text: err instanceof Error ? err.message : "Failed to create event" });
    } finally { setCreating(false); }
  }

  function closeCreate() { setCreateOpen(false); setCreateMsg(null); setCf({ title: "", category: "registration", start_date: "", end_date: "", description: "", status: "active" }); }

  async function updateStatus(e: CalendarEvent, status: string) {
    try {
      const res = await fetch(`/api/admin/calendar/${e.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) return;
      const updated = await fetch("/api/admin/calendar").then((r) => r.json()) as CalendarEvent[];
      setEvents(updated);
    } catch {}
  }

  async function deleteEvent(e: CalendarEvent) {
    if (!confirm(`Delete "${e.title}"?`)) return;
    try {
      const res = await fetch(`/api/admin/calendar/${e.id}`, { method: "DELETE" });
      if (!res.ok) { const p = await res.json() as { error?: string }; alert(p.error || "Failed to delete"); return; }
      const updated = await fetch("/api/admin/calendar").then((r) => r.json()) as CalendarEvent[];
      setEvents(updated);
    } catch {}
  }

  function exportExcel(data: CalendarEvent[], filename = "academic-calendar.xlsx") {
    const rows = data.map((e) => ({
      Title: e.title,
      Category: e.category,
      Description: e.description || "",
      "Start Date": e.start_date,
      "End Date": e.end_date,
      Status: e.status,
      "Created At": e.created_at,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Calendar");
    XLSX.writeFile(wb, filename);
  }

  function exportSingleExcel(e: CalendarEvent) { exportExcel([e], `event-${e.title.replace(/\s+/g, "-").toLowerCase()}.xlsx`); }

  function exportPDF(data: CalendarEvent[], filename = "academic-calendar.pdf") {
    const doc = new jsPDF("landscape");
    doc.setFontSize(16); doc.text("Academic Calendar", 14, 20);
    doc.setFontSize(10); doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);
    autoTable(doc, {
      startY: 34,
      head: [["Title", "Category", "Start", "End", "Status"]],
      body: data.map((e) => [e.title, e.category, e.start_date, e.end_date, e.status]),
      styles: { fontSize: 8 }, headStyles: { fillColor: [30, 58, 138] },
    });
    doc.save(filename);
  }

  function exportSinglePDF(e: CalendarEvent) {
    const doc = new jsPDF();
    doc.setFontSize(18); doc.text("Event Profile", 14, 22);
    doc.setFontSize(10); doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
    autoTable(doc, {
      startY: 38,
      body: [
        ["Title", e.title],
        ["Category", e.category],
        ["Description", e.description || "-"],
        ["Start Date", e.start_date],
        ["End Date", e.end_date],
        ["Status", e.status],
        ["Created At", new Date(e.created_at).toLocaleString()],
      ],
      theme: "plain", styles: { fontSize: 10, cellPadding: 4 },
      columnStyles: { 0: { fontStyle: "bold", cellWidth: 40 }, 1: { cellWidth: 120 } },
    });
    doc.save(`event-${e.title.replace(/\s+/g, "-").toLowerCase()}.pdf`);
  }

  function handleImportDone() {
    setImportOpen(false);
    fetch("/api/admin/calendar").then((r) => r.json()).then((data: CalendarEvent[]) => setEvents(data));
  }

  const ic = "rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-all duration-300 focus:border-[#1E3A8A] focus:ring-4 focus:ring-[#1E3A8A]/10";

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <div className="flex flex-col items-center gap-3">
        <svg className="h-8 w-8 animate-spin text-[#1E3A8A]" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
        <p className="text-sm text-slate-500">Loading calendar events...</p>
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
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">Academic Calendar</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Manage academic events including registration periods, examination schedules, result entries, submission deadlines, graduations, and holidays.
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button type="button" onClick={() => setImportOpen(true)}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition-all duration-300 hover:bg-slate-50">
              <span className="material-symbols-outlined text-lg">upload</span> Import
            </button>
            <button type="button" onClick={() => setCreateOpen(true)}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#1E3A8A] px-5 text-sm font-semibold text-white shadow-lg shadow-[#1E3A8A]/25 transition-all duration-300 hover:bg-[#152C6B] hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0">
              <span className="material-symbols-outlined text-lg">add</span> Add Event
            </button>
          </div>
        </div>
      </section>

      {/* Create Modal */}
      <Modal open={createOpen} onClose={closeCreate}>
        <div className="relative rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-200 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <div><h2 className="text-xl font-bold text-slate-900">Create Calendar Event</h2><p className="text-sm text-slate-500">Add a new academic calendar event.</p></div>
            <button type="button" onClick={closeCreate} className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition-all duration-300 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-600">
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
          <form onSubmit={handleCreate} className="space-y-4">
            <label className="block text-sm font-medium text-slate-700">
              Event Title
              <input required className={`${ic} mt-1 w-full`} value={cf.title} onChange={(e) => setCf((p) => ({ ...p, title: e.target.value }))} placeholder="e.g. First Semester Registration" />
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className="block text-sm font-medium text-slate-700">
                Category
                <select className={`${ic} mt-1 w-full`} value={cf.category} onChange={(e) => setCf((p) => ({ ...p, category: e.target.value }))}>
                  {CATEGORY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Status
                <select className={`${ic} mt-1 w-full`} value={cf.status} onChange={(e) => setCf((p) => ({ ...p, status: e.target.value }))}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="closed">Closed</option>
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
              Description
              <textarea rows={3} className={`${ic} mt-1 w-full resize-none`} value={cf.description} onChange={(e) => setCf((p) => ({ ...p, description: e.target.value }))} placeholder="Optional description..." />
            </label>
            <div className="flex items-center gap-3 pt-2">
              <button type="submit" disabled={creating}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#1E3A8A] px-5 text-sm font-semibold text-white shadow-lg shadow-[#1E3A8A]/25 transition-all duration-300 hover:bg-[#152C6B] disabled:cursor-not-allowed disabled:bg-slate-400 disabled:shadow-none">
                {creating ? <><svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Saving...</>
                  : <><span className="material-symbols-outlined text-lg">calendar_today</span>Save Event</>}
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
          { label: "Total Events", value: totalEvents, icon: "event", color: "#1E3A8A", bg: "bg-blue-50" },
          { label: "Active", value: activeEvents, icon: "check_circle", color: "#059669", bg: "bg-emerald-50" },
          { label: "Categories", value: categoryCount, icon: "category", color: "#7C3AED", bg: "bg-purple-50" },
          { label: "Upcoming", value: upcomingEvents, icon: "upcoming", color: "#D97706", bg: "bg-amber-50" },
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
                  <defs><linearGradient id={`cal-${card.label}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={card.color} stopOpacity={0.25} /><stop offset="100%" stopColor={card.color} stopOpacity={0} /></linearGradient></defs>
                  <Area type="monotone" dataKey="count" stroke={card.color} strokeWidth={1.5} fill={`url(#cal-${card.label})`} dot={false} isAnimationActive />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-3 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
        {/* Events by Category */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
          <h3 className="mb-1 text-sm font-semibold text-slate-900">Events by Category</h3>
          <p className="mb-4 text-xs text-slate-500">Count of events in each category</p>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: "#64748B" }} angle={-20} textAnchor="end" height={55} />
                <YAxis tick={{ fontSize: 11, fill: "#64748B" }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} isAnimationActive animationDuration={800}>
                  {categoryChartData.map((e) => <Cell key={e.name} fill={CATEGORY_COLORS[e.name] || "#94A3B8"} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Events by Month */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
          <h3 className="mb-1 text-sm font-semibold text-slate-900">Events by Month</h3>
          <p className="mb-4 text-xs text-slate-500">Events grouped by their start month</p>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="month" tick={{ fontSize: 9, fill: "#64748B" }} angle={-20} textAnchor="end" height={55} />
                <YAxis tick={{ fontSize: 11, fill: "#64748B" }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} isAnimationActive animationDuration={800}>
                  {monthChartData.map((e, i) => <Cell key={e.month} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
          <h3 className="mb-1 text-sm font-semibold text-slate-900">Status Distribution</h3>
          <p className="mb-4 text-xs text-slate-500">Active, inactive, and closed events</p>
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
            <input type="text" placeholder="Wide search (title, category, dates, description, status...)" className={`${ic} w-full pl-10`} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
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
          {filtered.length} event{filtered.length !== 1 ? "s" : ""}
          {filtered.length !== events.length ? ` out of ${events.length}` : ""}
          {selectedIds.size > 0 ? ` \u00B7 ${selectedIds.size} selected` : ""}
        </p>
      </section>

      {/* Table */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm animate-fade-in-up" style={{ animationDelay: "0.35s" }}>
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center py-16">
            <span className="material-symbols-outlined text-5xl text-slate-300">calendar_today</span>
            <p className="mt-4 text-sm font-medium text-slate-600">No events match your criteria.</p>
            <p className="text-xs text-slate-400">Try adjusting your search.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="w-10 px-3 py-3"><input type="checkbox" checked={selectedIds.size === sorted.length && sorted.length > 0} onChange={toggleSelectAll} className="h-4 w-4 rounded border-slate-300 text-[#1E3A8A] focus:ring-[#1E3A8A]" /></th>
                  <Th onClick={() => toggleSort("title")} active={sortField === "title"} sortDir={sortDir}>Title <SortIcon field="title" /></Th>
                  <Th onClick={() => toggleSort("category")} active={sortField === "category"} sortDir={sortDir}>Category <SortIcon field="category" /></Th>
                  <Th onClick={() => toggleSort("start_date")} active={sortField === "start_date"} sortDir={sortDir}>Start <SortIcon field="start_date" /></Th>
                  <Th onClick={() => toggleSort("end_date")} active={sortField === "end_date"} sortDir={sortDir}>End <SortIcon field="end_date" /></Th>
                  <Th onClick={() => toggleSort("status")} active={sortField === "status"} sortDir={sortDir}>Status <SortIcon field="status" /></Th>
                  <Th>Actions</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sorted.map((ev) => (
                  <tr key={ev.id} className={`transition-all duration-200 hover:bg-slate-50 ${selectedIds.has(ev.id) ? "bg-blue-50/40" : ""}`}>
                    <td className="px-3 py-3"><input type="checkbox" checked={selectedIds.has(ev.id)} onChange={() => toggleSelect(ev.id)} className="h-4 w-4 rounded border-slate-300 text-[#1E3A8A] focus:ring-[#1E3A8A]" /></td>
                    <td className="whitespace-nowrap px-3 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#1E3A8A] text-xs font-bold text-white">{ev.title.charAt(0).toUpperCase()}</div>
                        <div>
                          <span className="font-semibold text-slate-900">{ev.title}</span>
                          {ev.description && <p className="text-xs text-slate-500 truncate max-w-[200px]">{ev.description}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">
                      <CategoryBadge category={ev.category} />
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-slate-600">{ev.start_date}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-slate-600">{ev.end_date}</td>
                    <td className="whitespace-nowrap px-3 py-3">
                      <StatusBadge status={ev.status} onActivate={() => updateStatus(ev, "active")} onDeactivate={() => updateStatus(ev, "inactive")} onClose={() => updateStatus(ev, "closed")} />
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">
                      <div className="flex items-center gap-1">
                        <button type="button" onClick={() => exportSingleExcel(ev)} className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-all duration-200 hover:bg-emerald-50 hover:text-emerald-600" title="Export Excel"><span className="material-symbols-outlined text-base">table</span></button>
                        <button type="button" onClick={() => exportSinglePDF(ev)} className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-all duration-200 hover:bg-red-50 hover:text-red-600" title="Export PDF"><span className="material-symbols-outlined text-base">picture_as_pdf</span></button>
                        <button type="button" onClick={() => deleteEvent(ev)} className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-all duration-200 hover:bg-red-50 hover:text-red-600" title="Delete"><span className="material-symbols-outlined text-base">delete</span></button>
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
      <CalendarImportModal open={importOpen} onClose={handleImportDone} />
    </div>
  );
}

/* ── Category badge ── */
function CategoryBadge({ category }: { category: string }) {
  const colorMap: Record<string, string> = {
    registration: "bg-blue-100 text-blue-800 ring-1 ring-blue-200",
    examination: "bg-red-100 text-red-800 ring-1 ring-red-200",
    "result-entry": "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200",
    "submission-deadline": "bg-amber-100 text-amber-800 ring-1 ring-amber-200",
    graduation: "bg-purple-100 text-purple-800 ring-1 ring-purple-200",
    holiday: "bg-cyan-100 text-cyan-800 ring-1 ring-cyan-200",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${colorMap[category] || "bg-slate-100 text-slate-600 ring-1 ring-slate-200"}`}>
      {category}
    </span>
  );
}

/* ── Status badge with dropdown ── */
function StatusBadge({ status, onActivate, onDeactivate, onClose }: { status: string; onActivate: () => void; onDeactivate: () => void; onClose: () => void }) {
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
          <div className="absolute right-0 top-full z-20 mt-1 min-w-[130px] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg animate-fade-in-up">
            {status !== "active" && (
              <button type="button" onClick={() => { onActivate(); setOpen(false); }}
                className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 transition-all hover:bg-emerald-50 hover:text-emerald-700">
                <span className="material-symbols-outlined text-sm">check_circle</span> Activate
              </button>
            )}
            {status !== "inactive" && (
              <button type="button" onClick={() => { onDeactivate(); setOpen(false); }}
                className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 transition-all hover:bg-slate-100 hover:text-slate-700">
                <span className="material-symbols-outlined text-sm">pause_circle</span> Deactivate
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
function CalendarImportModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [rows, setRows] = useState<{ title: string; category: string; start_date: string; end_date: string; description: string; status: string }[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ ok: number; errors: string[] } | null>(null);

  const VALID_CATEGORIES = ["registration", "examination", "result-entry", "submission-deadline", "graduation", "holiday"];
  const VALID_STATUSES = ["active", "inactive", "closed"];

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

  function normalizeCategory(v: string): string {
    const lower = v.toLowerCase().replace(/\s+/g, "-");
    if (VALID_CATEGORIES.includes(lower)) return lower;
    if (["register", "reg", "enrollment"].includes(lower)) return "registration";
    if (["exam", "exams", "test"].includes(lower)) return "examination";
    if (["result", "results"].includes(lower)) return "result-entry";
    if (["deadline", "submission"].includes(lower)) return "submission-deadline";
    if (["grad", "commencement"].includes(lower)) return "graduation";
    if (["vacation", "break", "leave"].includes(lower)) return "holiday";
    return lower;
  }

  async function handleFile(file: File) {
    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) return;
    setResult(null);
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });
    const parsed = data.map((r) => ({
      title: String(r.title || r.Title || r["Event Title"] || "").trim(),
      category: normalizeCategory(String(r.category || r.Category || r["Event Category"] || "general")),
      start_date: parseDate(r.start_date || r["Start Date"] || r.startDate),
      end_date: parseDate(r.end_date || r["End Date"] || r.endDate),
      description: String(r.description || r.Description || r["Event Description"] || "").trim(),
      status: String(r.status || r.Status || "active").trim().toLowerCase(),
    }));
    setRows(parsed);
  }

  async function handleImport() {
    setImporting(true); setResult(null);
    const errors: string[] = []; let ok = 0;
    for (const row of rows) {
      if (!row.title || !row.start_date || !row.end_date) { errors.push(`${row.title || "?"}: Missing required fields`); continue; }
      if (!VALID_CATEGORIES.includes(row.category)) { errors.push(`${row.title}: Unknown category "${row.category}"`); continue; }
      if (!VALID_STATUSES.includes(row.status)) { row.status = "active"; }
      try {
        const res = await fetch("/api/admin/calendar", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(row),
        });
        const payload = await res.json() as { error?: string };
        if (!res.ok) errors.push(`${row.title}: ${payload.error || "Error"}`);
        else ok++;
      } catch { errors.push(`${row.title}: Network error`); }
    }
    setResult({ ok, errors }); setImporting(false);
  }

  return (
    <Modal open={open} onClose={() => { setRows([]); setResult(null); onClose(); }}>
      <div className="relative max-h-[85vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-200 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <div><h2 className="text-xl font-bold text-slate-900">Import Calendar Events</h2><p className="text-sm text-slate-500">Upload an Excel file to batch-create events</p></div>
          <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition-all duration-300 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-600">
            <span className="material-symbols-outlined text-lg">close</span></button>
        </div>
        {rows.length === 0 && !result && (
          <div className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center transition-all duration-300 hover:border-[#1E3A8A] hover:bg-blue-50/50" onClick={() => document.getElementById("cal-import-input")?.click()}>
            <span className="material-symbols-outlined text-4xl text-slate-400">upload_file</span>
            <p className="mt-3 text-sm font-medium text-slate-700">Drop an Excel file here, or click to browse</p>
            <p className="mt-1 text-xs text-slate-500">Columns: title, category, start_date, end_date, description, status</p>
            <input id="cal-import-input" type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
          </div>
        )}
        {rows.length > 0 && !result && (
          <div className="space-y-4">
            <p className="text-sm font-semibold text-slate-700">{rows.length} row(s) parsed</p>
            <div className="max-h-48 overflow-auto rounded-lg border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-xs">
                <thead className="bg-slate-50"><tr><th className="px-2 py-2 text-left font-semibold text-slate-600">Title</th><th className="px-2 py-2 text-left font-semibold text-slate-600">Category</th><th className="px-2 py-2 text-left font-semibold text-slate-600">Start</th><th className="px-2 py-2 text-left font-semibold text-slate-600">End</th><th className="px-2 py-2 text-left font-semibold text-slate-600">Status</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="px-2 py-1.5 text-slate-700">{r.title}</td>
                      <td className="px-2 py-1.5 text-slate-700">{r.category}</td>
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
                : <><span className="material-symbols-outlined text-lg">cloud_upload</span>Import {rows.length} event{rows.length !== 1 ? "s" : ""}</>}
            </button>
          </div>
        )}
        {result && (
          <div className="space-y-3 animate-fade-in-up">
            <div className="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800 ring-1 ring-emerald-200"><span className="font-semibold">{result.ok}</span> event{result.ok !== 1 ? "s" : ""} imported.</div>
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
