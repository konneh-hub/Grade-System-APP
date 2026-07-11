"use client";

import { useEffect, useMemo, useState } from 'react';
import DataTable from '@/components/shared/DataTable';

type ResultRow = {
  id: number;
  academic_session_id: number;
  academic_session_name: string;
  semester: string;
  course_code: string;
  course_title: string;
  credit_unit: number;
  ca_score: number;
  exam_score: number;
  total_score: number;
  grade: string;
  grade_point: number;
  status: string;
};

function summaryRemark(gpa: number | null) {
  if (gpa === null) return 'No published results yet.';
  if (gpa >= 3.5) return 'Excellent performance.';
  if (gpa >= 2.0) return 'Good academic standing.';
  return 'Your academic standing requires attention.';
}

export default function Page() {
  const [results, setResults] = useState<ResultRow[]>([]);
  const [sessions, setSessions] = useState<Array<{ id: number; name: string }>>([]);
  const [selectedSession, setSelectedSession] = useState<string>('');
  const [selectedSemester, setSelectedSemester] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
    let mounted = true;

    async function loadData() {
      try {
        setLoading(true);
        const [resultsRes, sessionsRes] = await Promise.all([
          fetch('/api/students/results', { cache: 'no-store' }),
          fetch('/api/academic-sessions', { cache: 'no-store' }),
        ]);

        if (!mounted) return;

        if (!resultsRes.ok) {
          const body = await resultsRes.json();
          throw new Error(body.error || 'Failed to load results');
        }

        if (!sessionsRes.ok) {
          const body = await sessionsRes.json();
          throw new Error(body.error || 'Failed to load sessions');
        }

        const resultsJson = (await resultsRes.json()) as ResultRow[];
        const sessionsJson = (await sessionsRes.json()) as { data: Array<{ id: number; name: string }>; count: number };

        setResults(resultsJson);
        setSessions(sessionsJson.data ?? []);
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : 'Unable to load results.');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      mounted = false;
    };
  }, []);

  const semesters = useMemo(() => {
    const values = Array.from(new Set(results.map((result) => result.semester).filter(Boolean)));
    return values.sort();
  }, [results]);

  const filteredResults = useMemo(() => {
    return results.filter((result) => {
      if (selectedSession && result.academic_session_id !== Number(selectedSession)) return false;
      if (selectedSemester && result.semester !== selectedSemester) return false;
      return true;
    });
  }, [results, selectedSession, selectedSemester]);

  const totalCredits = filteredResults.reduce((sum, row) => sum + (row.credit_unit ?? 0), 0);
  const weightedPoints = filteredResults.reduce((sum, row) => sum + ((row.credit_unit ?? 0) * (row.grade_point ?? 0)), 0);
  const gpa = totalCredits ? Number((weightedPoints / totalCredits).toFixed(2)) : null;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#2563EB]">Student</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">My results</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
          Keep track of your published results and academic progress.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <label htmlFor="session-select" className="block text-sm font-medium text-slate-700">Academic session</label>
          <select
            id="session-select"
            className="mt-2 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
            value={selectedSession}
            onChange={(event) => setSelectedSession(event.target.value)}
          >
            <option value="">All sessions</option>
            {sessions.map((session) => (
              <option key={session.id} value={String(session.id)}>{session.name}</option>
            ))}
          </select>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <label htmlFor="semester-select" className="block text-sm font-medium text-slate-700">Semester</label>
          <select
            id="semester-select"
            className="mt-2 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
            value={selectedSemester}
            onChange={(event) => setSelectedSemester(event.target.value)}
          >
            <option value="">All semesters</option>
            {semesters.map((semester) => (
              <option key={semester} value={semester}>{semester}</option>
            ))}
          </select>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Result summary</p>
          <p className="mt-3 text-3xl font-semibold text-slate-900">{totalCredits}</p>
          <p className="mt-1 text-sm text-slate-600">Total credit units</p>
          <p className="mt-4 text-sm font-medium text-slate-700">GPA: {gpa ?? 'N/A'}</p>
          <p className="mt-2 text-sm text-slate-500">{summaryRemark(gpa)}</p>
        </div>
      </section>

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">Loading results…</div>
      ) : error ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm text-sm text-red-600">{error}</div>
      ) : (
        <DataTable
          title="Academic results"
          description="Your officially published semester grades."
          rows={filteredResults}
          emptyMessage="No results are available for the selected filters."
          columns={[
            { header: 'Session', accessor: 'academic_session_name' },
            { header: 'Semester', accessor: 'semester' },
            { header: 'Course Code', accessor: 'course_code' },
            { header: 'Course Title', accessor: 'course_title' },
            { header: 'Credit Unit', accessor: 'credit_unit' },
            { header: 'CA', accessor: 'ca_score' },
            { header: 'Exam', accessor: 'exam_score' },
            { header: 'Total', accessor: 'total_score' },
            { header: 'Grade', accessor: 'grade' },
            { header: 'Grade Point', accessor: 'grade_point' },
            {
              header: 'Status',
              accessor: 'status',
              render: (_, row) => (row.grade === 'F' ? 'Fail' : 'Pass'),
            },
          ]}
        />
      )}
    </div>
  );
}
