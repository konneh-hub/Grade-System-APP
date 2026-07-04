"use client";
import { useMemo } from "react";
import {
  ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";

export interface UserStat {
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

function getMonthLabel(d: Date): string {
  return d.toLocaleString("en", { month: "short", year: "2-digit" });
}

function computeSparkline(users: UserStat[]): { month: string; count: number }[] {
  const now = new Date();
  const months: { month: string; count: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ month: getMonthLabel(d), count: 0 });
  }
  for (const u of users) {
    if (!u.registered_at) continue;
    const rd = new Date(u.registered_at);
    const label = getMonthLabel(rd);
    const found = months.find((m) => m.month === label);
    if (found) found.count++;
  }
  return months;
}

export default function UserStatsCharts({ users }: { users: UserStat[] }) {
  const total = users.length;
  const activeCount = users.filter((u) => u.status === "active").length;
  const suspendedCount = users.filter((u) => u.status === "suspended").length;
  const now = new Date();
  const newThisMonth = users.filter((u) => {
    if (!u.registered_at) return false;
    const d = new Date(u.registered_at);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const sparkline = useMemo(() => computeSparkline(users), [users]);

  const roleCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const u of users) {
      const role = u.roles?.[0] || "unknown";
      map[role] = (map[role] || 0) + 1;
    }
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [users]);

  const statusCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const u of users) {
      map[u.status] = (map[u.status] || 0) + 1;
    }
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [users]);

  const ROLE_COLORS: Record<string, string> = {
    admin: "#1E3A8A",
    dean: "#7C3AED",
    hod: "#0891B2",
    lecturer: "#059669",
    exam_officer: "#D97706",
    student: "#DC2626",
    unknown: "#94A3B8",
  };

  const STATUS_COLORS: Record<string, string> = {
    active: "#059669",
    suspended: "#DC2626",
    pending: "#D97706",
  };

  const statCards = [
    { label: "Total Users", value: total, color: "#1E3A8A", bg: "bg-blue-50" },
    { label: "Active", value: activeCount, color: "#059669", bg: "bg-emerald-50" },
    { label: "Suspended", value: suspendedCount, color: "#DC2626", bg: "bg-red-50" },
    { label: "New This Month", value: newThisMonth, color: "#7C3AED", bg: "bg-purple-50" },
  ];

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">{card.label}</p>
                <p className="mt-1 text-3xl font-bold text-slate-900">{card.value.toLocaleString()}</p>
              </div>
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.bg}`}>
                <span
                  className="material-symbols-outlined text-xl"
                  style={{ color: card.color }}
                >
                  {card.label === "Total Users" ? "people" : card.label === "Active" ? "check_circle" : card.label === "Suspended" ? "block" : "person_add"}
                </span>
              </div>
            </div>
            <div className="mt-3 h-10">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sparkline} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id={`grad-${card.label}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={card.color} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={card.color} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke={card.color}
                    strokeWidth={2}
                    fill={`url(#grad-${card.label})`}
                    dot={false}
                    isAnimationActive={true}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Role Distribution */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-1 text-sm font-semibold text-slate-900">Role Distribution</h3>
          <p className="mb-4 text-xs text-slate-500">Users grouped by their primary role</p>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={roleCounts}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {roleCounts.map((entry) => (
                    <Cell key={entry.name} fill={ROLE_COLORS[entry.name] || "#94A3B8"} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  iconSize={8}
                  formatter={(value: string) => (
                    <span className="text-xs text-slate-700">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-1 text-sm font-semibold text-slate-900">Status Distribution</h3>
          <p className="mb-4 text-xs text-slate-500">Active vs suspended accounts</p>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusCounts} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#64748B" }} />
                <YAxis tick={{ fontSize: 12, fill: "#64748B" }} />
                <Tooltip />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {statusCounts.map((entry) => (
                    <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || "#94A3B8"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Registration Trend */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-1 text-sm font-semibold text-slate-900">Registration Trend</h3>
          <p className="mb-4 text-xs text-slate-500">New user registrations over time</p>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparkline} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
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
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#1E3A8A"
                  strokeWidth={2}
                  fill="url(#trendGrad)"
                  dot={{ r: 3, fill: "#1E3A8A" }}
                  activeDot={{ r: 5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
