'use client';

import { useMemo, useState } from 'react';
import Modal from '@/components/ui/Modal';

type ScoreRow = {
  id: number;
  student: string;
  ca: number | null;
  exam: number | null;
  total: number | null;
  grade: string;
  status: string;
};

const initialRows: ScoreRow[] = [
  { id: 1, student: 'Aisha Conteh', ca: 22, exam: 45, total: 67, grade: 'B', status: 'Completed' },
  { id: 2, student: 'Mohamed Sesay', ca: 18, exam: 40, total: 58, grade: 'C', status: 'Completed' },
  { id: 3, student: 'Zainab Kamara', ca: 12, exam: null, total: null, grade: '-', status: 'Pending' },
  { id: 4, student: 'Fatmata Jalloh', ca: 25, exam: 49, total: 74, grade: 'B+', status: 'Completed' },
];

function calculateGrade(total: number) {
  if (total >= 70) return 'A';
  if (total >= 60) return 'B+';
  if (total >= 50) return 'B';
  if (total >= 45) return 'C';
  if (total >= 40) return 'D';
  return 'F';
}

export default function Page({ params }: { params: { id: string } }) {
  const [rows, setRows] = useState<ScoreRow[]>(initialRows);
  const [selectedRow, setSelectedRow] = useState<ScoreRow | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [caScore, setCaScore] = useState('');
  const [examScore, setExamScore] = useState('');
  const [message, setMessage] = useState('');

  const totalStudents = rows.length;
  const enteredScores = rows.filter((row) => row.total !== null).length;
  const pendingScores = rows.filter((row) => row.total === null).length;
  const progress = Math.round((enteredScores / Math.max(totalStudents, 1)) * 100);

  const currentTotal = useMemo(() => {
    const ca = Number(caScore) || 0;
    const exam = Number(examScore) || 0;
    return ca + exam;
  }, [caScore, examScore]);

  const currentGrade = useMemo(() => (currentTotal > 0 ? calculateGrade(currentTotal) : '-'), [currentTotal]);

  const openModal = (row: ScoreRow) => {
    setSelectedRow(row);
    setCaScore(row.ca?.toString() ?? '');
    setExamScore(row.exam?.toString() ?? '');
    setModalOpen(true);
  };

  const saveScore = (continueEditing = false) => {
    if (!selectedRow) return;
    const caValue = Number(caScore);
    const examValue = Number(examScore);
    const total = caValue + examValue;
    const grade = calculateGrade(total);
    const updatedRows = rows.map((row) =>
      row.id === selectedRow.id
        ? { ...row, ca: caValue, exam: examValue, total, grade, status: 'Completed' }
        : row
    );
    setRows(updatedRows);
    setSelectedRow({ ...selectedRow, ca: caValue, exam: examValue, total, grade, status: 'Completed' });
    setMessage(continueEditing ? 'Score saved, continue editing.' : 'Score saved successfully.');
    if (!continueEditing) {
      setModalOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#2563EB]">Score entry</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">Enter student scores for course {params.id}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Add or update continuous assessment and exam results for your class.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setSelectedRow({ id: 0, student: 'New student', ca: null, exam: null, total: null, grade: '-', status: 'Pending' });
              setCaScore('');
              setExamScore('');
              setModalOpen(true);
            }}
            className="inline-flex items-center rounded-full bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1D4ED8]"
          >
            Add Score
          </button>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Total Students</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{totalStudents}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Scores Entered</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{enteredScores}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Scores Pending</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{pendingScores}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Submission Progress</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{progress}%</p>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Score entry list</h2>
            <p className="text-sm text-slate-600">Edit scores and keep the class set up to date.</p>
          </div>
          <button
            type="button"
            onClick={() => setMessage('Draft saved locally.')}
            className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-200"
          >
            Save Draft
          </button>
        </div>

        {message ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{message}</div> : null}

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead>
              <tr>
                <th className="px-3 py-3 text-left font-semibold text-slate-700">Student</th>
                <th className="px-3 py-3 text-center font-semibold text-slate-700">CA</th>
                <th className="px-3 py-3 text-center font-semibold text-slate-700">Exam</th>
                <th className="px-3 py-3 text-center font-semibold text-slate-700">Total</th>
                <th className="px-3 py-3 text-left font-semibold text-slate-700">Grade</th>
                <th className="px-3 py-3 text-left font-semibold text-slate-700">Status</th>
                <th className="px-3 py-3 text-right font-semibold text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50">
                  <td className="px-3 py-3 text-slate-700">{row.student}</td>
                  <td className="px-3 py-3 text-center text-slate-700">{row.ca ?? '-'}</td>
                  <td className="px-3 py-3 text-center text-slate-700">{row.exam ?? '-'}</td>
                  <td className="px-3 py-3 text-center text-slate-700">{row.total ?? '-'}</td>
                  <td className="px-3 py-3 text-slate-700">{row.grade}</td>
                  <td className="px-3 py-3 text-slate-700">{row.status}</td>
                  <td className="px-3 py-3 text-right text-slate-700">
                    <button
                      onClick={() => openModal(row)}
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      Edit Score
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Add / Edit Score</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">Student</label>
              <input
                type="text"
                value={selectedRow?.student ?? ''}
                readOnly
                className="w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-700"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">Continuous Assessment</label>
              <input
                type="number"
                min={0}
                max={40}
                value={caScore}
                onChange={(event) => setCaScore(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">Examination Score</label>
              <input
                type="number"
                min={0}
                max={60}
                value={examScore}
                onChange={(event) => setExamScore(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Total Score</p>
                <p className="mt-2 text-xl font-semibold text-slate-900">{currentTotal}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Grade</p>
                <p className="mt-2 text-xl font-semibold text-slate-900">{currentGrade}</p>
              </div>
            </div>
          </div>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => saveScore(true)}
              className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
            >
              Save Draft
            </button>
            <button
              type="button"
              onClick={() => saveScore(false)}
              className="w-full rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1D4ED8]"
            >
              Save & Continue
            </button>
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
