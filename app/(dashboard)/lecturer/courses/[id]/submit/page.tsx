'use client';

import { useState } from 'react';
import Modal from '@/components/ui/Modal';

type SubmissionRow = {
  id: number;
  course: string;
  students: number;
  status: string;
  submittedDate: string;
};

const submissionData: SubmissionRow[] = [
  { id: 1, course: 'CSC 302', students: 42, status: 'Ready', submittedDate: '-' },
  { id: 2, course: 'CSC 218', students: 38, status: 'Draft', submittedDate: '-' },
  { id: 3, course: 'STA 301', students: 29, status: 'Returned', submittedDate: '2026-04-25' },
];

export default function Page({ params }: { params: { id: string } }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionRow | null>(null);
  const [message, setMessage] = useState('');
  const [submissions, setSubmissions] = useState(submissionData);

  const readyForSubmission = submissions.filter((item) => item.status === 'Ready').length;
  const draftResults = submissions.filter((item) => item.status === 'Draft').length;
  const submittedResults = submissions.filter((item) => item.status === 'Submitted').length;
  const returnedResults = submissions.filter((item) => item.status === 'Returned').length;

  const openSubmitModal = (submission: SubmissionRow) => {
    setSelectedSubmission(submission);
    setConfirmed(false);
    setModalOpen(true);
  };

  const handleSubmit = () => {
    if (!confirmed || !selectedSubmission) return;
    setSubmissions((prev) => prev.map((item) => (item.id === selectedSubmission.id ? { ...item, status: 'Submitted', submittedDate: new Date().toISOString().split('T')[0] } : item)));
    setMessage('Result submitted successfully to the Head of Department.');
    setModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#2563EB]">Result submission</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">Finalize result submissions</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Submit completed course results and review submission history for your assigned classes.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Ready for Submission</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{readyForSubmission}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Draft Results</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{draftResults}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Submitted Results</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{submittedResults}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Returned Results</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{returnedResults}</p>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Submission tracker</h2>
            <p className="text-sm text-slate-600">Preview course submission status and history.</p>
          </div>
        </div>
        {message ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{message}</div> : null}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead>
              <tr>
                <th className="px-3 py-3 text-left font-semibold text-slate-700">Course</th>
                <th className="px-3 py-3 text-center font-semibold text-slate-700">Students</th>
                <th className="px-3 py-3 text-left font-semibold text-slate-700">Status</th>
                <th className="px-3 py-3 text-left font-semibold text-slate-700">Submitted Date</th>
                <th className="px-3 py-3 text-right font-semibold text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {submissions.map((submission) => (
                <tr key={submission.id} className="hover:bg-slate-50">
                  <td className="px-3 py-3 text-slate-700">{submission.course}</td>
                  <td className="px-3 py-3 text-center text-slate-700">{submission.students}</td>
                  <td className="px-3 py-3 text-slate-700">{submission.status}</td>
                  <td className="px-3 py-3 text-slate-700">{submission.submittedDate}</td>
                  <td className="px-3 py-3 text-right text-slate-700">
                    <div className="flex flex-wrap justify-end gap-2">
                      <button
                        onClick={() => {
                          setSelectedSubmission(submission);
                          setModalOpen(true);
                        }}
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        Submit
                      </button>
                      <button className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                        View History
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
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Submit Result</h3>
          <div className="space-y-4 text-sm text-slate-700">
            <p>
              Course: <span className="font-semibold text-slate-900">{selectedSubmission?.course}</span>
            </p>
            <p>
              Total Students: <span className="font-semibold text-slate-900">{selectedSubmission?.students}</span>
            </p>
            <p>
              Submission Date: <span className="font-semibold text-slate-900">{new Date().toISOString().split('T')[0]}</span>
            </p>
            <p className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              I confirm that all scores have been verified.
            </p>
            <label className="inline-flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(event) => setConfirmed(event.target.checked)}
                className="h-4 w-4 rounded border border-slate-300 text-[#2563EB] focus:ring-[#2563EB]"
              />
              I confirm that all scores have been verified.
            </label>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={() => setModalOpen(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!confirmed}
              className="rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1D4ED8] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Submit
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
