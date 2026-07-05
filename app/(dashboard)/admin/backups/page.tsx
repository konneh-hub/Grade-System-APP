'use client';

import { FormEvent, useEffect, useState } from 'react';

export default function Page() {
  const [history, setHistory] = useState<Array<{ id: number; backup_type: string; include_logs: number; status: string; file_name: string; size_bytes: number; created_at: string }>>([]);
  const [restoreId, setRestoreId] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadHistory() {
      try {
        const response = await fetch('/api/admin/backups', { cache: 'no-store' });
        const payload = (await response.json()) as Array<{ id: number; backup_type: string; include_logs: number; status: string; file_name: string; size_bytes: number; created_at: string }> | { error?: string };
        if (!response.ok) throw new Error((payload as { error?: string }).error || 'Failed to load backup history');
        if (isMounted) {
          setHistory(payload as Array<{ id: number; backup_type: string; include_logs: number; status: string; file_name: string; size_bytes: number; created_at: string }>);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load backup history');
        }
      }
    }

    void loadHistory();

    return () => {
      isMounted = false;
    };
  }, []);

  async function fetchHistory() {
    try {
      const response = await fetch('/api/admin/backups', { cache: 'no-store' });
      const payload = (await response.json()) as Array<{ id: number; backup_type: string; include_logs: number; status: string; file_name: string; size_bytes: number; created_at: string }> | { error?: string };
      if (!response.ok) throw new Error((payload as { error?: string }).error || 'Failed to load backup history');
      setHistory(payload as Array<{ id: number; backup_type: string; include_logs: number; status: string; file_name: string; size_bytes: number; created_at: string }>);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load backup history');
    }
  }

  async function onBackup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess('');
    const formData = new FormData(event.currentTarget);
    const type = String(formData.get('type') ?? 'full');
    const includeLogs = formData.get('includeLogs') === 'on';

    try {
      const response = await fetch('/api/admin/backups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ backup_type: type, include_logs: includeLogs }),
      });
      const payload = (await response.json()) as { error?: string; file_name?: string };
      if (!response.ok) throw new Error(payload.error || 'Failed to create backup');
      setSuccess(`Backup created: ${payload.file_name}`);
      await fetchHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create backup');
    }
  }

  async function onRestore() {
    if (!restoreId) {
      setError('Select backup ID to restore.');
      return;
    }
    if (!confirmed) {
      setError('You must confirm restore overwrite first.');
      return;
    }

    setError('');
    setSuccess('');
    try {
      const response = await fetch(`/api/admin/backups/${restoreId}/restore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: true }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error || 'Failed to restore backup');
      setSuccess('Backup restored successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to restore backup');
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Backup & Restore</h1>
        <p className="mt-2 text-sm text-slate-600">Create backups, restore selected backups, and track backup history.</p>
      </section>

      <form onSubmit={onBackup} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-3">
        <label className="text-sm block">
          <span className="font-medium">Backup type</span>
          <select name="type" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" aria-label="Backup type">
            <option value="full">Full</option>
            <option value="partial">Partial</option>
          </select>
        </label>
        <label className="text-sm flex items-end gap-2"><input name="includeLogs" type="checkbox" className="h-4 w-4" /> Include Logs</label>
        <button type="submit" className="rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white">Create Backup</button>
      </form>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Restore Backup</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <label className="block">
            <span className="sr-only">Restore backup</span>
            <select className="rounded-lg border border-slate-300 px-3 py-2 text-sm" value={restoreId} onChange={(event) => setRestoreId(event.target.value)} aria-label="Restore backup">
              <option value="">Select backup</option>
              {history.map((item) => <option key={item.id} value={item.id}>{item.id} - {item.file_name}</option>)}
            </select>
          </label>
          <label className="text-sm flex items-center gap-2"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} className="h-4 w-4" /> I understand restore overwrites current DB</label>
          <button type="button" onClick={onRestore} className="rounded-lg border border-rose-300 px-4 py-2 text-sm text-rose-700">Restore Backup</button>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Backup History</h2>
        <div className="mt-3 space-y-2">
          {history.length === 0 ? <p className="text-sm text-slate-600">No backups created in this session.</p> : history.map((item) => (
            <div key={item.id} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
              #{item.id} | {item.file_name} | {item.backup_type.toUpperCase()} | Include Logs: {item.include_logs ? 'Yes' : 'No'} | Size: {item.size_bytes} bytes | {item.status} | {new Date(item.created_at).toLocaleString()}
            </div>
          ))}
        </div>
      </section>
      {error ? <p className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}
      {success ? <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{success}</p> : null}
    </div>
  );
}
