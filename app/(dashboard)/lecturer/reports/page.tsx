'use client';

import { useEffect, useState } from 'react';
import Modal from '@/components/ui/Modal';

type ReportItem = {
  id: number;
  title: string;
  type: string;
  period: string;
  status: 'Draft' | 'Completed' | 'Pending' | 'Submitted';
  dueDate: string;
};

const initialReports: ReportItem[] = [
  { id: 1, title: 'CSC 302 continuous assessment report', type: 'Course report', period: '2025/2026 Sem 2', status: 'Draft', dueDate: '2026-05-10' },
  { id: 2, title: 'Teaching performance summary', type: 'Performance report', period: '2025/2026', status: 'Pending', dueDate: '2026-05-18' },
  { id: 3, title: 'Student progress review', type: 'Assessment report', period: '2025/2026 Sem 2', status: 'Completed', dueDate: '2026-04-20' },
];

export default function Page() {
  const [reports, setReports] = useState<ReportItem[]>(initialReports);
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formState, setFormState] = useState({
    title: '',
    type: 'Course report',
    period: '2025/2026 Sem 2',
    dueDate: '',
  });

  useEffect(() => {
    void fetchReports();
  }, []);

  async function fetchReports() {
    try {
      const res = await fetch('/api/reports', { cache: 'no-store' });
      const payload = (await res.json()) as any;
      if (!res.ok) throw new Error(payload?.error || 'Failed to load reports');
      const rows = Array.isArray(payload.generated) ? payload.generated : [];
      const mapped = rows.map((r: any) => ({
        id: Number(r.id),
        title: String(r.template_name ?? 'Generated report'),
        type: String(r.category ?? 'general'),
        period: r.generated_at ? String(r.generated_at).split('T')[0] : String(r.created_at ?? '-'),
        status: (String(r.status || 'available').toLowerCase() === 'completed' ? 'Completed' : String(r.status || 'Pending')) as any,
        dueDate: r.generated_at ? String(r.generated_at).split('T')[0] : String(r.created_at ?? '-'),
      }));
      setReports(mapped);
    } catch (err) {
      // keep local mocks on failure
    }
  }

  const dueReports = reports.filter((item) => item.status === 'Pending' || item.status === 'Draft').length;
  const completedReports = reports.filter((item) => item.status === 'Completed').length;
  const submittedReports = reports.filter((item) => item.status === 'Submitted').length;
  const draftReports = reports.filter((item) => item.status === 'Draft').length;

  const handleCreate = async () => {
    try {
      const rawType = formState.type || 'custom';
      const normalizedType = rawType.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'custom';

      const res = await fetch(`/api/reports/${encodeURIComponent(normalizedType)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format: 'pdf' }),
      });
      const payload = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(payload.error || 'Failed to create report');
      setShowCreateModal(false);
      setFormState({ title: '', type: 'Course report', period: '2025/2026 Sem 2', dueDate: '' });
      await fetchReports();
    } catch (err) {
      // fallback to local create
      const nextId = Math.max(...reports.map((item) => item.id)) + 1;
      setReports([
        {
          id: nextId,
          title: formState.title || 'New teaching report',
          type: formState.type,
          period: formState.period,
          status: 'Draft',
          dueDate: formState.dueDate || '-',
        },
        ...reports,
      ]);
      setShowCreateModal(false);
      setFormState({ title: '', type: 'Course report', period: '2025/2026 Sem 2', dueDate: '' });
    }
  };

  const handleSubmitReport = (report: ReportItem) => {
    setReports((prev) => prev.map((item) => (item.id === report.id ? { ...item, status: 'Submitted' } : item)));
    setModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#2563EB]">Lecturer reports</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">Track teaching reports</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Create and manage report submissions for courses, assessment summaries, and teaching performance.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center rounded-full bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1D4ED8]"
          >
            New report
          </button>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Due reports</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{dueReports}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Drafts</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{draftReports}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Completed</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{completedReports}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Submitted</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{submittedReports}</p>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Report tasks</h2>
            <p className="text-sm text-slate-600">Review and submit the teaching reports that are due.</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead>
              <tr>
                <th className="px-3 py-3 text-left font-semibold text-slate-700">Title</th>
                <th className="px-3 py-3 text-left font-semibold text-slate-700">Type</th>
                <th className="px-3 py-3 text-left font-semibold text-slate-700">Period</th>
                <th className="px-3 py-3 text-left font-semibold text-slate-700">Due date</th>
                <th className="px-3 py-3 text-left font-semibold text-slate-700">Status</th>
                <th className="px-3 py-3 text-right font-semibold text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reports.map((report) => (
                <tr key={report.id} className="hover:bg-slate-50">
                  <td className="px-3 py-3 text-slate-700">{report.title}</td>
                  <td className="px-3 py-3 text-slate-700">{report.type}</td>
                  <td className="px-3 py-3 text-slate-700">{report.period}</td>
                  <td className="px-3 py-3 text-slate-700">{report.dueDate}</td>
                  <td className="px-3 py-3 text-slate-700">{report.status}</td>
                  <td className="px-3 py-3 text-right text-slate-700">
                    <div className="flex flex-wrap justify-end gap-2">
                      <button
                        onClick={() => {
                          setSelectedReport(report);
                          setModalOpen(true);
                        }}
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleSubmitReport(report)}
                        className="rounded-lg bg-[#2563EB] px-3 py-2 text-sm font-semibold text-white hover:bg-[#1D4ED8]"
                      >
                        Submit
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <div className="bg-white rounded-lg p-6 w-full max-w-lg">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Report overview</h3>
          {selectedReport ? (
            <div className="space-y-4 text-sm text-slate-700">
              <div>
                <p className="text-slate-500">Title</p>
                <p className="font-semibold">{selectedReport.title}</p>
              </div>
              <div>
                <p className="text-slate-500">Type</p>
                <p className="font-semibold">{selectedReport.type}</p>
              </div>
              <div>
                <p className="text-slate-500">Period</p>
                <p className="font-semibold">{selectedReport.period}</p>
              </div>
              <div>
                <p className="text-slate-500">Due date</p>
                <p className="font-semibold">{selectedReport.dueDate}</p>
              </div>
              <div>
                <p className="text-slate-500">Status</p>
                <p className="font-semibold">{selectedReport.status}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm leading-6 text-slate-700">
                  This report is prepared for department review. Use the submit action to send it to the HoD after completing the required sections.
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-600">Select a report to preview its details.</p>
          )}
          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={() => setModalOpen(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={showCreateModal} onClose={() => setShowCreateModal(false)}>
        <div className="bg-white rounded-lg p-6 w-full max-w-lg">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Create report task</h3>
          <div className="space-y-4 text-sm text-slate-700">
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">Title</label>
              <input
                value={formState.title}
                onChange={(event) => setFormState({ ...formState, title: event.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">Type</label>
              <select
                value={formState.type}
                onChange={(event) => setFormState({ ...formState, type: event.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              >
                <option>Course report</option>
                <option>Assessment report</option>
                <option>Performance report</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">Period</label>
              <select
                value={formState.period}
                onChange={(event) => setFormState({ ...formState, period: event.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              >
                <option>2025/2026 Sem 2</option>
                <option>2025/2026</option>
                <option>2024/2025 Sem 1</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">Due date</label>
              <input
                type="date"
                value={formState.dueDate}
                onChange={(event) => setFormState({ ...formState, dueDate: event.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              />
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreate}
              className="rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1D4ED8]"
            >
              Create draft
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
