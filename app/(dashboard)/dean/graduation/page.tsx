"use client";

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Modal from '@/components/ui/Modal';

type SummaryData = {
  eligibleStudents: number;
  pendingVerification: number;
  approvedGraduation: number;
};

type StudentData = {
  id: number;
  user_id: number;
  full_name: string;
  email: string;
  programme: string;
  programme_code: string;
  department: string;
  current_level: number;
  graduation_status: string;
  cgpa: number;
  courses_completed: number;
};

type StudentDetails = {
  student: {
    id: number;
    user_id: number;
    full_name: string;
    email: string;
    programme: string;
    programme_code: string;
    department: string;
    current_level: number;
    graduation_status: string;
    cgpa: string;
    classification: string;
    courses_completed: number;
  };
  outstanding_courses: Array<{
    id: number;
    code: string;
    title: string;
    status: string;
    grade: string;
    total_score: number;
  }>;
};

const initialSummary: SummaryData = {
  eligibleStudents: 0,
  pendingVerification: 0,
  approvedGraduation: 0,
};

export default function Page() {
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [summaryType, setSummaryType] = useState<'eligible' | 'pending' | 'approved'>('pending');
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentData | null>(null);
  const [selectedStudentDetails, setSelectedStudentDetails] = useState<StudentDetails | null>(null);
  const [summary, setSummary] = useState<SummaryData>(initialSummary);
  const [students, setStudents] = useState<StudentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);

      try {
        const summaryRes = await fetch('/api/dean/graduation/summary');
        const pendingRes = await fetch('/api/dean/graduation/pending');

        if (!summaryRes.ok) {
          throw new Error('Failed to load graduation summary');
        }

        const summaryJson = await summaryRes.json();
        setSummary({
          eligibleStudents: Number(summaryJson.eligibleStudents ?? 0),
          pendingVerification: Number(summaryJson.pendingVerification ?? 0),
          approvedGraduation: Number(summaryJson.approvedGraduation ?? 0),
        });

        if (pendingRes.ok) {
          const pendingJson = await pendingRes.json();
          setStudents((pendingJson.students ?? []).map((s: any) => ({
            id: Number(s.id ?? 0),
            user_id: Number(s.user_id ?? 0),
            full_name: String(s.full_name ?? 'Unknown'),
            email: String(s.email ?? ''),
            programme: String(s.programme ?? 'N/A'),
            programme_code: String(s.programme_code ?? 'N/A'),
            department: String(s.department ?? 'N/A'),
            current_level: Number(s.current_level ?? 0),
            graduation_status: String(s.graduation_status ?? 'pending_verification'),
            cgpa: Number(s.cgpa ?? 0),
            courses_completed: Number(s.courses_completed ?? 0),
          })));
        }
      } catch (err) {
        console.error(err);
        setError('Unable to load graduation review data.');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  async function openVerificationModal(student: StudentData) {
    setSelectedStudent(student);
    setComments('');

    try {
      const detailsRes = await fetch(`/api/dean/graduation/details?student_id=${student.id}`);
      if (detailsRes.ok) {
        const details = await detailsRes.json();
        setSelectedStudentDetails(details);
      }
    } catch (err) {
      console.error('Failed to load student details:', err);
    }

    setVerifyOpen(true);
  }

  async function handleVerificationDecision(decision: 'approve' | 'reject') {
    if (!selectedStudent) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/dean/graduation/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: selectedStudent.id,
          decision,
          comments,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${decision} graduation`);
      }

      const result = await response.json();
      setVerifyOpen(false);
      setNotification(
        `✓ Graduation ${decision}ed for ${selectedStudent.full_name}. Status: ${result.new_status}`
      );

      // Reload data
      const summaryRes = await fetch('/api/dean/graduation/summary');
      const pendingRes = await fetch('/api/dean/graduation/pending');

      if (summaryRes.ok) {
        const summaryJson = await summaryRes.json();
        setSummary({
          eligibleStudents: Number(summaryJson.eligibleStudents ?? 0),
          pendingVerification: Number(summaryJson.pendingVerification ?? 0),
          approvedGraduation: Number(summaryJson.approvedGraduation ?? 0),
        });
      }

      if (pendingRes.ok) {
        const pendingJson = await pendingRes.json();
        setStudents((pendingJson.students ?? []).map((s: any) => ({
          id: Number(s.id ?? 0),
          user_id: Number(s.user_id ?? 0),
          full_name: String(s.full_name ?? 'Unknown'),
          email: String(s.email ?? ''),
          programme: String(s.programme ?? 'N/A'),
          programme_code: String(s.programme_code ?? 'N/A'),
          department: String(s.department ?? 'N/A'),
          current_level: Number(s.current_level ?? 0),
          graduation_status: String(s.graduation_status ?? 'pending_verification'),
          cgpa: Number(s.cgpa ?? 0),
          courses_completed: Number(s.courses_completed ?? 0),
        })));
      }
    } catch (err) {
      console.error(err);
      setNotification(`Error: ${err instanceof Error ? err.message : 'Failed to process decision'}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function loadSummaryStudents(type: 'eligible' | 'pending' | 'approved') {
    setSummaryType(type);
    try {
      const endpoint =
        type === 'eligible'
          ? '/api/dean/graduation/eligible'
          : type === 'approved'
          ? '/api/dean/graduation/approved'
          : '/api/dean/graduation/pending';

      const res = await fetch(endpoint);
      if (res.ok) {
        const json = await res.json();
        setStudents((json.students ?? []).map((s: any) => ({
          id: Number(s.id ?? 0),
          user_id: Number(s.user_id ?? 0),
          full_name: String(s.full_name ?? 'Unknown'),
          email: String(s.email ?? ''),
          programme: String(s.programme ?? 'N/A'),
          programme_code: String(s.programme_code ?? 'N/A'),
          department: String(s.department ?? 'N/A'),
          current_level: Number(s.current_level ?? 0),
          graduation_status: String(s.graduation_status ?? type),
          cgpa: Number(s.cgpa ?? 0),
          courses_completed: Number(s.courses_completed ?? 0),
        })));
      }
    } catch (err) {
      console.error('Failed to load students:', err);
    }
  }

  const summaryCards = [
    {
      title: 'Eligible Students',
      value: summary.eligibleStudents.toString(),
      note: 'Ready for verification',
      action: () => {
        loadSummaryStudents('eligible');
        setSummaryOpen(true);
      },
    },
    {
      title: 'Pending Verification',
      value: summary.pendingVerification.toString(),
      note: 'Awaiting dean review',
      action: () => {
        loadSummaryStudents('pending');
        setSummaryOpen(true);
      },
    },
    {
      title: 'Approved Graduation',
      value: summary.approvedGraduation.toString(),
      note: 'Final approval given',
      action: () => {
        loadSummaryStudents('approved');
        setSummaryOpen(true);
      },
    },
  ];

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#2563EB]">Dean graduation review</p>
              <h1 className="mt-3 text-3xl font-semibold text-slate-900">Verify and approve student graduation</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                Review eligible students, verify their academic standing, and approve final graduation status.
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-3">
          {loading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-28 rounded-2xl border border-slate-200 bg-slate-100 p-5 shadow-sm animate-pulse" />
            ))
          ) : (
            summaryCards.map((card) => (
              <div key={card.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition">
                <p className="text-sm font-medium text-slate-500">{card.title}</p>
                <p className="mt-3 text-3xl font-semibold text-slate-900">{card.value}</p>
                <p className="mt-2 text-sm text-slate-600">{card.note}</p>
                <button
                  type="button"
                  onClick={card.action}
                  className="mt-4 w-full rounded-full bg-[#1E3A8A] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#172B5E]"
                >
                  {card.title.includes('Pending') ? 'Review' : 'View'}
                </button>
              </div>
            ))
          )}
        </section>

        {students.length > 0 && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-semibold text-slate-900 mb-6">
              {summaryType === 'eligible'
                ? 'Eligible Students'
                : summaryType === 'approved'
                ? 'Approved Graduation List'
                : 'Pending Verification'}
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Student</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Programme</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">CGPA</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Status</th>
                    {summaryType === 'pending' && (
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">Action</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-900">{student.full_name}</td>
                      <td className="px-4 py-3 text-slate-600">{student.programme}</td>
                      <td className="px-4 py-3 text-slate-600 font-semibold">{student.cgpa.toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            student.graduation_status === 'graduated'
                              ? 'bg-emerald-100 text-emerald-800'
                              : student.graduation_status === 'pending_verification'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {student.graduation_status === 'graduated'
                            ? 'Approved'
                            : student.graduation_status === 'pending_verification'
                            ? 'Pending'
                            : 'Eligible'}
                        </span>
                      </td>
                      {summaryType === 'pending' && (
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => openVerificationModal(student)}
                            className="rounded-full bg-[#1E3A8A] px-3 py-1 text-sm font-semibold text-white transition hover:bg-[#172B5E]"
                          >
                            Verify
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {notification ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 shadow-sm">
            {notification}
          </div>
        ) : null}
      </div>

      <Modal open={verifyOpen} onClose={() => setVerifyOpen(false)}>
        <div className="rounded-2xl bg-white p-6 shadow-lg max-w-2xl">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Graduation Verification</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">Verify student graduation</h2>
            </div>
            <button
              type="button"
              onClick={() => setVerifyOpen(false)}
              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
            >
              Close
            </button>
          </div>

          {selectedStudentDetails && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase text-slate-500">Student</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">{selectedStudentDetails.student.full_name}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase text-slate-500">Email</p>
                  <p className="mt-2 text-sm text-slate-900">{selectedStudentDetails.student.email}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase text-slate-500">Programme</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">{selectedStudentDetails.student.programme}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase text-slate-500">Credits Completed</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">{selectedStudentDetails.student.courses_completed}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase text-slate-500">CGPA</p>
                  <p className="mt-2 text-lg font-semibold text-[#1E3A8A]">{selectedStudentDetails.student.cgpa}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase text-slate-500">Classification</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">{selectedStudentDetails.student.classification}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase text-slate-500 mb-2">Outstanding Courses</p>
                {selectedStudentDetails.outstanding_courses.length === 0 ? (
                  <p className="text-sm text-emerald-700 font-semibold">✓ None</p>
                ) : (
                  <div className="space-y-2">
                    {selectedStudentDetails.outstanding_courses.map((course) => (
                      <div key={course.id} className="text-sm text-slate-700">
                        <span className="font-semibold">{course.code}</span> - {course.title}{' '}
                        <span className="text-amber-600">({course.status})</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid gap-2">
                <label htmlFor="comments" className="text-sm font-medium text-slate-700">
                  Comments
                </label>
                <textarea
                  id="comments"
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  rows={3}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-500"
                  placeholder="Add any comments or notes..."
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2 pt-4">
                <button
                  type="button"
                  onClick={() => handleVerificationDecision('approve')}
                  disabled={isSubmitting}
                  className="rounded-full bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                >
                  {isSubmitting ? 'Processing...' : '✓ Approve Graduation'}
                </button>
                <button
                  type="button"
                  onClick={() => handleVerificationDecision('reject')}
                  disabled={isSubmitting}
                  className="rounded-full bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
                >
                  {isSubmitting ? 'Processing...' : '✗ Reject'}
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      <Modal open={summaryOpen} onClose={() => setSummaryOpen(false)}>
        <div className="rounded-2xl bg-white p-6 shadow-lg max-w-3xl">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Student Summary</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                {summaryType === 'eligible'
                  ? 'Eligible Students'
                  : summaryType === 'approved'
                  ? 'Approved Graduation List'
                  : 'Pending Verification'}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setSummaryOpen(false)}
              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
            >
              Close
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Student</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Programme</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">CGPA</th>
                  {summaryType === 'pending' && (
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Action</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{student.full_name}</td>
                    <td className="px-4 py-3 text-slate-600">{student.programme}</td>
                    <td className="px-4 py-3 text-slate-600 font-semibold">{student.cgpa.toFixed(2)}</td>
                    {summaryType === 'pending' && (
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => openVerificationModal(student)}
                          className="rounded-full bg-[#1E3A8A] px-3 py-1 text-sm font-semibold text-white transition hover:bg-[#172B5E]"
                        >
                          Verify
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>
    </main>
  );
}
