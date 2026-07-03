'use client';

import { useEffect, useState } from 'react';

type SecurityPayload = {
  metrics: {
    active_users: number;
    blocked_users: number;
    failed_logins_24h: number;
    suspicious_activities_7d: number;
  };
  recent_logins: Array<{ id: number; action: string; entity_type: string; ip_address: string | null; created_at: string }>;
};

export default function SecurityPage() {
  const [data, setData] = useState<SecurityPayload | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    void loadSecurity();
  }, []);

  async function loadSecurity() {
    try {
      const response = await fetch('/api/admin/security', { cache: 'no-store' });
      const payload = (await response.json()) as SecurityPayload | { error?: string };
      if (!response.ok) throw new Error((payload as { error?: string }).error || 'Failed to load security metrics');
      setData(payload as SecurityPayload);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load security metrics');
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Security Center</h1>
        <p className="mt-2 text-sm text-slate-600">Monitor active users, failed attempts, blocked accounts, and login trail.</p>
      </section>

      {error ? <p className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</p> : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4"><h2 className="text-sm font-semibold text-slate-600">Active Users</h2><p className="mt-1 text-2xl font-semibold text-slate-900">{data?.metrics.active_users ?? 0}</p></div>
        <div className="rounded-xl border border-slate-200 bg-white p-4"><h2 className="text-sm font-semibold text-slate-600">Blocked Accounts</h2><p className="mt-1 text-2xl font-semibold text-slate-900">{data?.metrics.blocked_users ?? 0}</p></div>
        <div className="rounded-xl border border-slate-200 bg-white p-4"><h2 className="text-sm font-semibold text-slate-600">Failed Logins (24h)</h2><p className="mt-1 text-2xl font-semibold text-slate-900">{data?.metrics.failed_logins_24h ?? 0}</p></div>
        <div className="rounded-xl border border-slate-200 bg-white p-4"><h2 className="text-sm font-semibold text-slate-600">Suspicious Activities (7d)</h2><p className="mt-1 text-2xl font-semibold text-slate-900">{data?.metrics.suspicious_activities_7d ?? 0}</p></div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Login History</h2>
        <div className="mt-3 space-y-2">
          {!data || data.recent_logins.length === 0 ? (
            <p className="text-sm text-slate-600">No login history available.</p>
          ) : (
            data.recent_logins.map((item) => (
              <div key={item.id} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                {item.action} | {item.entity_type} | {item.ip_address || 'N/A'} | {new Date(item.created_at).toLocaleString()}
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
