'use client';

import { FormEvent, useState } from 'react';

type GradeRow = { min: string; max: string; grade: string; point: string; remark: string };

export default function Page() {
  const [rows, setRows] = useState<GradeRow[]>([{ min: '70', max: '100', grade: 'A', point: '5.0', remark: 'Excellent' }]);
  const [formula, setFormula] = useState({ type: 'fixed', rounding: 'nearest', weighting: 'credit-based' });

  function addRow(event: FormEvent) {
    event.preventDefault();
    setRows((prev) => [...prev, { min: '', max: '', grade: '', point: '', remark: '' }]);
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Grading System</h1>
        <p className="mt-2 text-sm text-slate-600">Changes affect the entire calculation engine and should be locked during active grading period.</p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Grade Scale Editor</h2>
        <form onSubmit={addRow} className="mt-4 space-y-3">
          {rows.map((row, index) => (
            <div key={`grade-row-${index}`} className="grid gap-2 md:grid-cols-5">
              <input className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Min" value={row.min} onChange={(e) => setRows((prev) => prev.map((item, i) => i === index ? { ...item, min: e.target.value } : item))} />
              <input className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Max" value={row.max} onChange={(e) => setRows((prev) => prev.map((item, i) => i === index ? { ...item, max: e.target.value } : item))} />
              <input className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Grade" value={row.grade} onChange={(e) => setRows((prev) => prev.map((item, i) => i === index ? { ...item, grade: e.target.value } : item))} />
              <input className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Grade Point" value={row.point} onChange={(e) => setRows((prev) => prev.map((item, i) => i === index ? { ...item, point: e.target.value } : item))} />
              <input className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Remarks" value={row.remark} onChange={(e) => setRows((prev) => prev.map((item, i) => i === index ? { ...item, remark: e.target.value } : item))} />
            </div>
          ))}
          <button type="submit" className="rounded-lg border border-slate-300 px-4 py-2 text-sm">Add Grade Row</button>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">GPA Settings</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <label className="text-sm">Formula Type<select className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={formula.type} onChange={(e) => setFormula((prev) => ({ ...prev, type: e.target.value }))}><option value="fixed">Fixed</option><option value="custom">Custom</option></select></label>
          <label className="text-sm">Credit Weighting<select className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={formula.weighting} onChange={(e) => setFormula((prev) => ({ ...prev, weighting: e.target.value }))}><option value="credit-based">Credit-based</option><option value="equal">Equal</option></select></label>
          <label className="text-sm">Rounding<select className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={formula.rounding} onChange={(e) => setFormula((prev) => ({ ...prev, rounding: e.target.value }))}><option value="nearest">Nearest</option><option value="up">Up</option><option value="down">Down</option></select></label>
        </div>
      </section>
    </div>
  );
}
