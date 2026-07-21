"use client";
import { useCallback, FormEvent, useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Cell,
} from "recharts";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface LoginRecord {
  id: number;
  action: string;
  ip_address: string | null;
  created_at: string;
}

interface AdminProfile {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  avatar_url: string | null;
  mfa_enabled: number;
  last_login_at: string | null;
  created_at: string;
  recent_logins: LoginRecord[];
}

const CHART_COLORS = ["#1E3A8A", "#059669", "#7C3AED", "#D97706"];

export default function ProfilePageContent() {
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ oldPassword: "", newPassword: "" });
  const [changingPassword, setChangingPassword] = useState(false);

  const loadProfile = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/profile", { cache: "no-store" });
      const payload = await res.json() as AdminProfile | { error?: string };
      if (!res.ok) throw new Error((payload as { error?: string }).error || "Failed to load profile");
      setProfile(payload as AdminProfile);
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to load profile"); }
  }, []);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  async function onSaveProfile(e: FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setSaving(true); setError(""); setSuccess("");
    try {
      const res = await fetch("/api/admin/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      const payload = await res.json() as { error?: string };
      if (!res.ok) throw new Error(payload.error || "Failed to update profile");
      setSuccess("Profile updated successfully.");
      await loadProfile();
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to update profile"); }
    finally { setSaving(false); }
  }

  async function onChangePassword(e: FormEvent) {
    e.preventDefault();
    setChangingPassword(true); setError(""); setSuccess("");
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(passwordForm),
      });
      const payload = await res.json() as { error?: string };
      if (!res.ok) throw new Error(payload.error || "Failed to change password");
      setSuccess("Password changed successfully.");
      setPasswordForm({ oldPassword: "", newPassword: "" });
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to change password"); }
    finally { setChangingPassword(false); }
  }

  /* ── computed stats ── */
  const accountAge = useMemo(() => {
    if (!profile?.created_at) return "N/A";
    const created = new Date(profile.created_at);
    const now = new Date();
    const days = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
    if (days < 30) return `${days} days`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months} month${months !== 1 ? "s" : ""}`;
    const years = Math.floor(months / 12);
    return `${years} year${years !== 1 ? "s" : ""}`;
  }, [profile]);

  const totalLogins = profile?.recent_logins?.length ?? 0;

  const lastLoginDisplay = useMemo(() => {
    if (!profile?.last_login_at) return "Never";
    return new Date(profile.last_login_at).toLocaleString();
  }, [profile]);

  const loginTrendData = useMemo(() => {
    const map: Record<string, number> = {};
    if (!profile?.recent_logins) return [];
    for (const log of profile.recent_logins) {
      const d = new Date(log.created_at);
      const label = d.toLocaleString("en", { month: "short", day: "numeric" });
      map[label] = (map[label] || 0) + 1;
    }
    const sorted = Object.entries(map).sort(([a], [b]) => {
      const da = new Date(a);
      const db = new Date(b);
      return da.getTime() - db.getTime();
    });
    return sorted.map(([date, count]) => ({ date, count }));
  }, [profile]);

  const loginHourData = useMemo(() => {
    const hours = new Array(24).fill(0);
    if (!profile?.recent_logins) return [];
    for (const log of profile.recent_logins) {
      const h = new Date(log.created_at).getHours();
      hours[h]++;
    }
    return hours.map((count, i) => ({ hour: `${i.toString().padStart(2, "0")}:00`, count }));
  }, [profile]);

  /* ── export functions ── */
  function exportLoginHistoryExcel() {
    if (!profile?.recent_logins?.length) return;
    const rows = profile.recent_logins.map((l) => ({
      Action: l.action,
      "IP Address": l.ip_address || "N/A",
      Timestamp: new Date(l.created_at).toLocaleString(),
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Login History");
    XLSX.writeFile(wb, `login-history-${profile.id}.xlsx`);
  }

  function exportProfilePDF() {
    if (!profile) return;
    const doc = new jsPDF();
    doc.setFontSize(18); doc.text("Admin Profile", 14, 22);
    doc.setFontSize(10); doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
    autoTable(doc, {
      startY: 38,
      body: [
        ["Name", `${profile.first_name} ${profile.last_name}`],
        ["Email", profile.email],
        ["Phone", profile.phone || "-"],
        ["MFA Enabled", profile.mfa_enabled ? "Yes" : "No"],
        ["Account Created", new Date(profile.created_at).toLocaleString()],
        ["Last Login", profile.last_login_at ? new Date(profile.last_login_at).toLocaleString() : "Never"],
        ["Total Logins", String(totalLogins)],
      ],
      theme: "plain", styles: { fontSize: 10, cellPadding: 4 },
      columnStyles: { 0: { fontStyle: "bold", cellWidth: 40 }, 1: { cellWidth: 120 } },
    });
    doc.save("admin-profile.pdf");
  }

  function exportLoginHistoryPDF() {
    if (!profile?.recent_logins?.length) return;
    const doc = new jsPDF("landscape");
    doc.setFontSize(16); doc.text("Login History", 14, 20);
    doc.setFontSize(10); doc.text(`User: ${profile.first_name} ${profile.last_name}`, 14, 28);
    autoTable(doc, {
      startY: 34,
      head: [["Action", "IP Address", "Timestamp"]],
      body: profile.recent_logins.map((l) => [l.action, l.ip_address || "N/A", new Date(l.created_at).toLocaleString()]),
      styles: { fontSize: 8 }, headStyles: { fillColor: [30, 58, 138] },
    });
    doc.save("login-history.pdf");
  }

  const ic = "rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-all duration-300 focus:border-[#1E3A8A] focus:ring-4 focus:ring-[#1E3A8A]/10";

  if (!profile) return (
    <div className="flex items-center justify-center py-32">
      <div className="flex flex-col items-center gap-3">
        <svg className="h-8 w-8 animate-spin text-[#1E3A8A]" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
        <p className="text-sm text-slate-500">Loading profile...</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm animate-fade-in-up">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-5">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1E3A8A] to-[#7C3AED] text-2xl font-bold text-white shadow-lg shadow-[#1E3A8A]/25">
              {profile.first_name.charAt(0).toUpperCase()}{profile.last_name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#1E3A8A]">Administration</p>
              <h1 className="mt-1 text-3xl font-semibold text-slate-900">{profile.first_name} {profile.last_name}</h1>
              <p className="mt-1 text-sm text-slate-500">{profile.email}</p>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <button type="button" onClick={exportProfilePDF}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition-all duration-300 hover:bg-slate-50">
              <span className="material-symbols-outlined text-lg">picture_as_pdf</span> Export PDF
            </button>
          </div>
        </div>
      </section>

      {/* Flash messages */}
      {error && (
        <div className="animate-fade-in-up rounded-xl border border-red-200 bg-red-50 px-5 py-3 text-sm text-red-700 ring-1 ring-red-100">
          <span className="material-symbols-outlined align-middle text-base mr-1.5">error</span>{error}
        </div>
      )}
      {success && (
        <div className="animate-fade-in-up rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm text-emerald-700 ring-1 ring-emerald-100">
          <span className="material-symbols-outlined align-middle text-base mr-1.5">check_circle</span>{success}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
        {[
          { label: "Account Age", value: accountAge, icon: "calendar_today", color: "#1E3A8A", bg: "bg-blue-50" },
          { label: "Last Login", value: lastLoginDisplay === "Never" ? "Never" : lastLoginDisplay, icon: "login", color: "#059669", bg: "bg-emerald-50", small: lastLoginDisplay !== "Never" },
          { label: "MFA Status", value: profile.mfa_enabled ? "Enabled" : "Disabled", icon: "security", color: profile.mfa_enabled ? "#059669" : "#94A3B8", bg: profile.mfa_enabled ? "bg-emerald-50" : "bg-slate-100" },
          { label: "Total Logins", value: totalLogins, icon: "history", color: "#7C3AED", bg: "bg-purple-50" },
        ].map((card) => (
          <div key={card.label} className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">{card.label}</p>
                <p className={`mt-1 font-bold text-slate-900 truncate ${(card as typeof card & { small?: boolean }).small ? "text-sm" : "text-2xl"}`}>{card.value}</p>
              </div>
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${card.bg}`}>
                <span className="material-symbols-outlined text-xl" style={{ color: card.color }}>{card.icon}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Profile Edit & Security */}
      <div className="grid gap-6 lg:grid-cols-2 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
        {/* Profile Info */}
        <form onSubmit={onSaveProfile} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-md">
          <div className="flex items-center gap-2 mb-5">
            <span className="material-symbols-outlined text-[#1E3A8A]">person</span>
            <h2 className="text-lg font-semibold text-slate-900">Personal Information</h2>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <label className="block text-sm font-medium text-slate-700">
                First Name
                <input className={`${ic} mt-1 w-full`} value={profile.first_name} onChange={(e) => setProfile({ ...profile, first_name: e.target.value })} />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Last Name
                <input className={`${ic} mt-1 w-full`} value={profile.last_name} onChange={(e) => setProfile({ ...profile, last_name: e.target.value })} />
              </label>
            </div>
            <label className="block text-sm font-medium text-slate-700">
              Email
              <input className={`${ic} mt-1 w-full bg-slate-50 text-slate-500 cursor-not-allowed`} value={profile.email} disabled />
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className="block text-sm font-medium text-slate-700">
                Phone
                <input className={`${ic} mt-1 w-full`} value={profile.phone || ""} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} placeholder="+234..." />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Avatar URL
                <input className={`${ic} mt-1 w-full`} value={profile.avatar_url || ""} onChange={(e) => setProfile({ ...profile, avatar_url: e.target.value })} placeholder="https://..." />
              </label>
            </div>
            <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 transition-all duration-300 hover:bg-slate-100/50 cursor-pointer">
              <input type="checkbox" checked={Boolean(profile.mfa_enabled)} onChange={(e) => setProfile({ ...profile, mfa_enabled: e.target.checked ? 1 : 0 })}
                className="h-5 w-5 rounded border-slate-300 text-[#1E3A8A] focus:ring-[#1E3A8A]" />
              <div>
                <span className="text-sm font-medium text-slate-900">Enable Multi-Factor Authentication</span>
                <p className="text-xs text-slate-500">Add an extra layer of security to your account.</p>
              </div>
            </label>
            <button type="submit" disabled={saving}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#1E3A8A] px-5 text-sm font-semibold text-white shadow-lg shadow-[#1E3A8A]/25 transition-all duration-300 hover:bg-[#152C6B] disabled:cursor-not-allowed disabled:bg-slate-400 disabled:shadow-none">
              {saving ? <><svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Saving...</>
                : <><span className="material-symbols-outlined text-lg">save</span>Save Profile</>}
            </button>
          </div>
        </form>

        {/* Change Password */}
        <form onSubmit={onChangePassword} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-md">
          <div className="flex items-center gap-2 mb-5">
            <span className="material-symbols-outlined text-[#1E3A8A]">lock</span>
            <h2 className="text-lg font-semibold text-slate-900">Security</h2>
          </div>
          <div className="space-y-4">
            <label className="block text-sm font-medium text-slate-700">
              Current Password
              <input type="password" required className={`${ic} mt-1 w-full`} value={passwordForm.oldPassword} onChange={(e) => setPasswordForm((p) => ({ ...p, oldPassword: e.target.value }))} placeholder="Enter current password" />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              New Password
              <input type="password" required className={`${ic} mt-1 w-full`} value={passwordForm.newPassword} onChange={(e) => setPasswordForm((p) => ({ ...p, newPassword: e.target.value }))} placeholder="Enter new password" />
            </label>
            <button type="submit" disabled={changingPassword}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60">
              {changingPassword ? <><svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Updating...</>
                : <><span className="material-symbols-outlined text-lg">key</span>Change Password</>}
            </button>
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-xs text-amber-800 flex items-center gap-2">
                <span className="material-symbols-outlined text-base">info</span>
                Use a strong password with at least 8 characters, including uppercase, lowercase, numbers, and symbols.
              </p>
            </div>
          </div>
        </form>
      </div>

      {/* Login Charts */}
      {totalLogins > 0 && (
        <div className="grid gap-6 lg:grid-cols-2 animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
          {/* Login Timeline */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-semibold text-slate-900">Login Activity</h3>
              <span className="text-xs text-slate-400">Last 20 logins</span>
            </div>
            <p className="mb-4 text-xs text-slate-500">Logins grouped by day</p>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={loginTrendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="loginTrend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#1E3A8A" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#1E3A8A" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#64748B" }} angle={-25} textAnchor="end" height={50} />
                  <YAxis tick={{ fontSize: 11, fill: "#64748B" }} allowDecimals={false} />
                  <Tooltip />
                  <Area type="monotone" dataKey="count" stroke="#1E3A8A" strokeWidth={2} fill="url(#loginTrend)" dot={{ r: 3, fill: "#1E3A8A" }} isAnimationActive />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Login by Hour */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-semibold text-slate-900">Login by Hour</h3>
              <span className="text-xs text-slate-400">24-hour distribution</span>
            </div>
            <p className="mb-4 text-xs text-slate-500">When you typically log in</p>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={loginHourData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="hour" tick={{ fontSize: 8, fill: "#64748B" }} interval={2} />
                  <YAxis tick={{ fontSize: 11, fill: "#64748B" }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} isAnimationActive animationDuration={800}>
                    {loginHourData.map((e, i) => (
                      <Cell key={e.hour} fill={i >= 6 && i <= 18 ? "#059669" : "#1E3A8A"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Login History */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm animate-fade-in-up" style={{ animationDelay: "0.35s" }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#1E3A8A]">history</span>
            <h2 className="text-lg font-semibold text-slate-900">Recent Login History</h2>
          </div>
          {totalLogins > 0 && (
            <div className="flex gap-2">
              <button type="button" onClick={exportLoginHistoryExcel}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition-all duration-300 hover:bg-slate-50">
                <span className="material-symbols-outlined text-sm">table</span> Excel
              </button>
              <button type="button" onClick={exportLoginHistoryPDF}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition-all duration-300 hover:bg-slate-50">
                <span className="material-symbols-outlined text-sm">picture_as_pdf</span> PDF
              </button>
            </div>
          )}
        </div>
        {!profile.recent_logins || profile.recent_logins.length === 0 ? (
          <div className="flex flex-col items-center py-12">
            <span className="material-symbols-outlined text-4xl text-slate-300">history</span>
            <p className="mt-3 text-sm font-medium text-slate-600">No login records found.</p>
            <p className="text-xs text-slate-400">Login activity will appear here after your next sign-in.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Action</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">IP Address</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {profile.recent_logins.map((log) => (
                  <tr key={log.id} className="transition-all duration-200 hover:bg-slate-50">
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className="rounded-md bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-800">{log.action}</span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-slate-600">{log.ip_address || "N/A"}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{new Date(log.created_at).toLocaleString()}</td>
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
