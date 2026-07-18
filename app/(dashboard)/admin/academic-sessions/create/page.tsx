"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AcademicSessionCreatePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isActive, setIsActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  // auto-fill code from name if user hasn't typed code explicitly
  useEffect(() => {
    if (!code) {
      const generated = String(name || "").trim().replace(/\s+/g, '_').toUpperCase();
      setCode(generated);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name]);

  const validate = () => {
    if (!name.trim()) return 'Name is required';
    if (!startDate) return 'Start date is required';
    if (!endDate) return 'End date is required';
    if (startDate > endDate) return 'Start date must be before end date';
    return null;
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    const clientError = validate();
    if (clientError) {
      setError(clientError);
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/academic-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), code: code.trim().toUpperCase(), start_date: startDate, end_date: endDate, is_active: isActive }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create session");
      router.push("/dashboard/admin/academic-sessions");
    } catch (err: any) {
      setError(err?.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  const clientError = touched ? validate() : null;

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold mb-4">Create Academic Session</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">Name</label>
          <input className="mt-1 block w-full rounded border px-3 py-2" value={name} onChange={(e) => setName(e.target.value)} onBlur={() => setTouched(true)} />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Code (optional)</label>
          <input className="mt-1 block w-full rounded border px-3 py-2" value={code} onChange={(e) => setCode(e.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Start Date</label>
            <input type="date" className="mt-1 block w-full rounded border px-3 py-2" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">End Date</label>
            <input type="date" className="mt-1 block w-full rounded border px-3 py-2" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input id="active" type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
          <label htmlFor="active" className="text-sm text-slate-700">Set active</label>
        </div>

        {clientError && <div className="text-sm text-red-600">{clientError}</div>}
        {error && <div className="text-sm text-red-700">{error}</div>}

        <div>
          <button type="submit" disabled={loading || Boolean(clientError)} className="inline-flex items-center rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-60">
            {loading ? 'Creating…' : 'Create Session'}
          </button>
        </div>
      </form>
    </div>
  );
}
