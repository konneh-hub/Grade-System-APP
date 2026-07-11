"use client";

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Modal from '@/components/ui/Modal';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

type SummaryData = {
  pendingApprovals: number;
  departments: number;
  students: number;
  averageCGPA: number | null;
  graduationCandidates: number;
  notifications: number;
};

type DepartmentStat = {
  department_id: number;
  department: string;
  avgCgpa: number;
  pending: number;
  approved: number;
};

type DecisionOption = 'approve' | 'reject' | 'return';

type FilterState = {
  department_id?: number;
  programme_id?: number;
  academic_level?: string;
  programme_type?: string;
};

type Department = {
  id: number;
  name: string;
  code: string;
};

type Programme = {
  id: number;
  name: string;
  code: string;
};

const initialSummary: SummaryData = {
  pendingApprovals: 0,
  departments: 0,
  students: 0,
  averageCGPA: null,
  graduationCandidates: 0,
  notifications: 0,
};

// Helper: Export to PDF
function exportToPDF(data: DepartmentStat[], filename: string) {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text('Department Performance Report', 14, 10);
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 18);

  const tableData = data.map((dept) => [
    dept.department,
    dept.avgCgpa.toFixed(2),
    dept.pending.toString(),
    dept.approved.toString(),
  ]);

  autoTable(doc, {
    head: [['Department', 'Avg CGPA', 'Pending', 'Approved']],
    body: tableData,
    startY: 25,
    theme: 'grid',
    headStyles: { fillColor: [30, 58, 138], textColor: [255, 255, 255] },
  });

  doc.save(filename);
}

// Helper: Export to Excel
function exportToExcel(data: DepartmentStat[], filename: string) {
  const exportData = data.map((dept) => ({
    'Department': dept.department,
    'Average CGPA': dept.avgCgpa.toFixed(2),
    'Pending Submissions': dept.pending,
    'Approved Submissions': dept.approved,
  }));

  const ws = XLSX.utils.json_to_sheet(exportData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Performance');
  XLSX.writeFile(wb, filename);
}



export default function Page() {
  const [filterOpen, setFilterOpen] = useState(false);
  const [approvalOpen, setApprovalOpen] = useState(false);
  const [reviewComment, setReviewComment] = useState('');
  const [decision, setDecision] = useState<DecisionOption>('approve');
  const [notification, setNotification] = useState<string | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState('');
  const [selectedDeptId, setSelectedDeptId] = useState<number | null>(null);
  const [selectedSemester, setSelectedSemester] = useState<string>('');
  const [summary, setSummary] = useState<SummaryData>(initialSummary);
  const [departments, setDepartments] = useState<DepartmentStat[]>([]);
  const [departmentList, setDepartmentList] = useState<Department[]>([]);
  const [programmeList, setProgrammeList] = useState<Programme[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>({});
  const [isSubmittingDecision, setIsSubmittingDecision] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);

      try {
        const [summaryRes, deptRes, deptListRes, progListRes] = await Promise.all([
          fetch('/api/dean/summary'),
          fetch('/api/dean/departments/stats'),
          fetch('/api/departments'),
          fetch('/api/programmes'),
        ]);

        if (!summaryRes.ok) {
          throw new Error('Failed to load summary');
        }
        if (!deptRes.ok) {
          throw new Error('Failed to load department stats');
        }

        const summaryJson = await summaryRes.json();
        const deptJson = await deptRes.json();
        const deptListJson = deptListRes.ok ? await deptListRes.json() : [];
        const progListJson = progListRes.ok ? await progListRes.json() : [];

        setSummary({
          pendingApprovals: Number(summaryJson.pendingApprovals ?? 0),
          departments: Number(summaryJson.departments ?? 0),
          students: Number(summaryJson.students ?? 0),
          averageCGPA: summaryJson.averageCGPA != null ? Number(summaryJson.averageCGPA) : null,
          graduationCandidates: Number(summaryJson.graduationCandidates ?? 0),
          notifications: Number(summaryJson.notifications ?? 0),
        });

        setDepartments((deptJson.departments ?? []).map((dept: any) => ({
          department_id: Number(dept.department_id ?? 0),
          department: String(dept.department ?? 'Unknown'),
          avgCgpa: dept.avgCgpa != null ? Number(dept.avgCgpa) : 0,
          pending: Number(dept.pending ?? 0),
          approved: Number(dept.approved ?? 0),
        })));

        setDepartmentList(Array.isArray(deptListJson) ? deptListJson : []);
        setProgrammeList(Array.isArray(progListJson) ? progListJson : []);
      } catch (err) {
        console.error(err);
        setError('Unable to load result review data.');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const sortedDepartments = useMemo(
    () => [...departments].sort((a, b) => b.avgCgpa - a.avgCgpa),
    [departments]
  );

  const chartData = useMemo(() => {
    const sorted = [...departments].sort((a, b) => b.avgCgpa - a.avgCgpa);
    return sorted.map((dept) => ({
      name: dept.department,
      avgCgpa: parseFloat(dept.avgCgpa.toFixed(2)),
      pending: dept.pending,
      approved: dept.approved,
    }));
  }, [departments]);

  const performanceCategories = useMemo(() => {
    const sorted = [...departments].sort((a, b) => b.avgCgpa - a.avgCgpa);
    const third = Math.ceil(sorted.length / 3);
    return {
      best: sorted.slice(0, third),
      average: sorted.slice(third, third * 2),
      poor: sorted.slice(third * 2),
    };
  }, [departments]);

  const summaryCards = [
    { title: 'Pending submissions', value: summary.pendingApprovals.toString(), note: 'Awaiting review from HoD' },
    { title: 'Departments reporting', value: summary.departments.toString(), note: 'Current semester active' },
    { title: 'Average CGPA', value: summary.averageCGPA != null ? summary.averageCGPA.toFixed(2) : '—', note: 'Across all results' },
    { title: 'Graduation candidates', value: summary.graduationCandidates.toString(), note: 'Pending dean review' },
  ];

  function openApprovalModal(deptId: number, dept: string, semester: string = '1st Semester') {
    setSelectedDeptId(deptId);
    setSelectedSubmission(dept);
    setSelectedSemester(semester);
    setReviewComment('');
    setDecision('approve');
    setApprovalOpen(true);
  }

  async function handleApprovalSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedDeptId || !selectedSemester) {
      setNotification('Missing department or semester information.');
      return;
    }

    setIsSubmittingDecision(true);
    try {
      const endpoint =
        decision === 'approve'
          ? '/api/dean/submissions/approve'
          : decision === 'reject'
          ? '/api/dean/submissions/reject'
          : '/api/dean/submissions/reject'; // "return" uses reject with reason

      const payload = {
        department_id: selectedDeptId,
        semester: selectedSemester,
        reason: decision === 'return' ? reviewComment || 'Returned for revision' : reviewComment,
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${decision} submission`);
      }

      const result = await response.json();
      setApprovalOpen(false);
      setNotification(
        `✓ Decision submitted: ${decision.toUpperCase()} for ${selectedSubmission} (${result.updated} results updated).`
      );

      // Reload data
      const summaryRes = await fetch('/api/dean/summary');
      const deptRes = await fetch('/api/dean/departments/stats');
      if (summaryRes.ok && deptRes.ok) {
        const summaryJson = await summaryRes.json();
        const deptJson = await deptRes.json();

        setSummary({
          pendingApprovals: Number(summaryJson.pendingApprovals ?? 0),
          departments: Number(summaryJson.departments ?? 0),
          students: Number(summaryJson.students ?? 0),
          averageCGPA: summaryJson.averageCGPA != null ? Number(summaryJson.averageCGPA) : null,
          graduationCandidates: Number(summaryJson.graduationCandidates ?? 0),
          notifications: Number(summaryJson.notifications ?? 0),
        });

        setDepartments((deptJson.departments ?? []).map((dept: any) => ({
          department_id: Number(dept.department_id ?? 0),
          department: String(dept.department ?? 'Unknown'),
          avgCgpa: dept.avgCgpa != null ? Number(dept.avgCgpa) : 0,
          pending: Number(dept.pending ?? 0),
          approved: Number(dept.approved ?? 0),
        })));
      }
    } catch (err) {
      console.error(err);
      setNotification(`Error: ${err instanceof Error ? err.message : 'Failed to process decision'}`);
    } finally {
      setIsSubmittingDecision(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50" suppressHydrationWarning>
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#2563EB]">Dean result review</p>
              <h1 className="mt-3 text-3xl font-semibold text-slate-900">Review, compare and decide on result submissions</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                Monitor submission quality by department and use comparison insights to make consistent approval decisions.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setFilterOpen(true)}
                className="inline-flex items-center rounded-full bg-slate-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-900"
              >
                Filter results
              </button>
              <button
                type="button"
                onClick={() => openApprovalModal(sortedDepartments[0]?.department_id ?? 0, sortedDepartments[0]?.department ?? 'Submission', '1st Semester')}
                className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm transition hover:border-slate-300"
              >
                Approval decision
              </button>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-28 rounded-2xl border border-slate-200 bg-slate-100 p-5 shadow-sm animate-pulse" />
            ))
          ) : (
            summaryCards.map((card) => (
              <div key={card.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-medium text-slate-500">{card.title}</p>
                <p className="mt-3 text-3xl font-semibold text-slate-900">{card.value}</p>
                <p className="mt-2 text-sm text-slate-600">{card.note}</p>
              </div>
            ))
          )}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Department statistics</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900">Result performance by department</h2>
              </div>
              <button
                type="button"
                onClick={() => setFilterOpen(true)}
                className="rounded-full bg-[#1E3A8A] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#172B5E]"
              >
                Filter departments
              </button>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {loading ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="h-52 rounded-2xl border border-slate-200 bg-slate-100 p-5 shadow-sm animate-pulse" />
                ))
              ) : departments.length === 0 ? (
                <div className="col-span-full rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
                  No department stats are available yet.
                </div>
              ) : (
                departments.map((dept) => (
                  <div key={dept.department_id} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-base font-semibold text-slate-900">{dept.department}</p>
                        <p className="mt-1 text-sm text-slate-600">Average CGPA</p>
                      </div>
                      <span className="text-3xl font-semibold text-slate-900">{dept.avgCgpa.toFixed(2)}</span>
                    </div>
                    <div className="mt-4 grid gap-2 text-sm text-slate-600">
                      <div className="flex items-center justify-between rounded-xl bg-white px-3 py-2 shadow-sm">
                        <span>Pending submissions</span>
                        <span>{dept.pending}</span>
                      </div>
                      <div className="flex items-center justify-between rounded-xl bg-white px-3 py-2 shadow-sm">
                        <span>Approved submissions</span>
                        <span>{dept.approved}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => openApprovalModal(dept.department_id, dept.department, '1st Semester')}
                      className="mt-4 w-full rounded-full bg-[#1E3A8A] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#172B5E]"
                    >
                      Review {dept.department}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4 mb-6">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Performance Analytics</p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-900">Department CGPA Comparison</h2>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => exportToPDF(chartData as any, 'department-performance.pdf')}
                    className="rounded-full bg-red-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
                  >
                    PDF
                  </button>
                  <button
                    type="button"
                    onClick={() => exportToExcel(chartData as any, 'department-performance.xlsx')}
                    className="rounded-full bg-green-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-green-700"
                  >
                    Excel
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterOpen(true)}
                    className="rounded-full bg-slate-800 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-900"
                  >
                    Filter
                  </button>
                </div>
              </div>
              {departments.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="avgCgpa" fill="#1E3A8A" name="Average CGPA" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-300 flex items-center justify-center text-slate-500">No data available</div>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {performanceCategories.best.length > 0 && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                  <p className="text-sm font-semibold text-emerald-900">Best Performing</p>
                  <div className="mt-3 space-y-2">
                    {performanceCategories.best.slice(0, 3).map((dept) => (
                      <div key={dept.department_id} className="text-sm text-emerald-800">
                        <p className="font-semibold">{dept.department}</p>
                        <p className="text-xs">{dept.avgCgpa.toFixed(2)} CGPA</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {performanceCategories.average.length > 0 && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm font-semibold text-amber-900">Average Performing</p>
                  <div className="mt-3 space-y-2">
                    {performanceCategories.average.slice(0, 3).map((dept) => (
                      <div key={dept.department_id} className="text-sm text-amber-800">
                        <p className="font-semibold">{dept.department}</p>
                        <p className="text-xs">{dept.avgCgpa.toFixed(2)} CGPA</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {performanceCategories.poor.length > 0 && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
                  <p className="text-sm font-semibold text-red-900">Poor Performing</p>
                  <div className="mt-3 space-y-2">
                    {performanceCategories.poor.slice(0, 3).map((dept) => (
                      <div key={dept.department_id} className="text-sm text-red-800">
                        <p className="font-semibold">{dept.department}</p>
                        <p className="text-xs">{dept.avgCgpa.toFixed(2)} CGPA</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {notification ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 shadow-sm">
            {notification}
          </div>
        ) : null}
      </div>

      <Modal open={filterOpen} onClose={() => setFilterOpen(false)}>
        <div className="rounded-2xl bg-white p-6 shadow-lg max-w-md">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Filter Results</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">Apply filters</h2>
            </div>
            <button
              type="button"
              onClick={() => setFilterOpen(false)}
              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
            >
              Close
            </button>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setFilterOpen(false);
              setNotification('Filters applied. Results updated.');
            }}
            className="mt-6 space-y-4"
          >
            <div className="grid gap-2">
              <label htmlFor="filterDept" className="text-sm font-medium text-slate-700">
                Department
              </label>
              <select
                id="filterDept"
                value={filters.department_id ?? ''}
                onChange={(e) => setFilters({ ...filters, department_id: e.target.value ? Number(e.target.value) : undefined })}
                className="rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
              >
                <option value="">All departments</option>
                {departmentList.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-2">
              <label htmlFor="filterProg" className="text-sm font-medium text-slate-700">
                Programme
              </label>
              <select
                id="filterProg"
                value={filters.programme_id ?? ''}
                onChange={(e) => setFilters({ ...filters, programme_id: e.target.value ? Number(e.target.value) : undefined })}
                className="rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
              >
                <option value="">All programmes</option>
                {programmeList.map((prog) => (
                  <option key={prog.id} value={prog.id}>
                    {prog.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-2">
              <label htmlFor="filterLevel" className="text-sm font-medium text-slate-700">
                Academic Level
              </label>
              <select
                id="filterLevel"
                value={filters.academic_level ?? ''}
                onChange={(e) => setFilters({ ...filters, academic_level: e.target.value || undefined })}
                className="rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
              >
                <option value="">All levels</option>
                <option value="100">100 Level</option>
                <option value="200">200 Level</option>
                <option value="300">300 Level</option>
                <option value="400">400 Level</option>
              </select>
            </div>

            <div className="grid gap-2">
              <label htmlFor="filterType" className="text-sm font-medium text-slate-700">
                Programme Type
              </label>
              <select
                id="filterType"
                value={filters.programme_type ?? ''}
                onChange={(e) => setFilters({ ...filters, programme_type: e.target.value || undefined })}
                className="rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
              >
                <option value="">All types</option>
                <option value="Regular">Regular</option>
                <option value="Diploma">Diploma</option>
                <option value="Certificate">Certificate</option>
              </select>
            </div>

            <button
              type="submit"
              className="inline-flex w-full justify-center rounded-full bg-[#1E3A8A] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#172B5E]"
            >
              Apply filters
            </button>
          </form>
        </div>
      </Modal>

      <Modal open={approvalOpen} onClose={() => setApprovalOpen(false)}>
        <div className="rounded-2xl bg-white p-6 shadow-lg">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Approval decision</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">Submission approval form</h2>
            </div>
            <button
              type="button"
              onClick={() => setApprovalOpen(false)}
              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
            >
              Close
            </button>
          </div>
          <form onSubmit={handleApprovalSubmit} className="mt-6 space-y-5">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-700">Department</label>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900">
                {selectedSubmission}
              </div>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-700">Semester</label>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900">
                {selectedSemester}
              </div>
            </div>

            <div className="grid gap-2">
              <label htmlFor="reviewComment" className="text-sm font-medium text-slate-700">
                {decision === 'return' ? 'Reason for return' : 'Review comment'}
              </label>
              <textarea
                id="reviewComment"
                value={reviewComment}
                onChange={(event) => setReviewComment(event.target.value)}
                rows={4}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900"
                placeholder={decision === 'return' ? 'Explain why this is being returned for revision' : 'Enter your comment here (optional)'}
              />
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm font-semibold text-slate-700">Decision</p>
              <div className="mt-4 space-y-3">
                {(['approve', 'reject', 'return'] as DecisionOption[]).map((option) => (
                  <label key={option} className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 transition hover:border-[#1E3A8A]">
                    <input
                      type="radio"
                      name="decision"
                      value={option}
                      checked={decision === option}
                      onChange={() => setDecision(option)}
                      className="h-4 w-4 accent-[#1E3A8A]"
                    />
                    <span className="text-sm font-medium text-slate-900">
                      {option === 'approve' ? '✓ Approve' : option === 'reject' ? '✗ Reject' : '↻ Return to HoD'}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmittingDecision}
              className="inline-flex w-full justify-center rounded-full bg-[#1E3A8A] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#172B5E] disabled:opacity-50"
            >
              {isSubmittingDecision ? 'Submitting...' : 'Submit decision'}
            </button>
          </form>
        </div>
      </Modal>
    </main>
  );
}
