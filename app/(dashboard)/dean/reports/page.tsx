'use client';

import { useCallback, useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Modal from '@/components/ui/Modal';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface PerformanceData {
  overall_avg_cgpa: number;
  department_performance: Array<{
    department_id: number;
    department: string;
    code: string;
    total_students: number;
    avg_cgpa: number;
    approved_courses: number;
  }>;
}

interface GraduationProjection {
  year: string;
  expected_graduates: number;
  already_graduated: number;
  eligible_now: number;
  pending_verification: number;
  by_programme: Array<{
    programme_id: number;
    programme: string;
    code: string;
    eligible: number;
    graduated: number;
    pending: number;
    expected_total: number;
  }>;
}

interface ProbationStudent {
  id: number;
  user_id: number;
  full_name: string;
  email: string;
  programme: string;
  department: string;
  current_level: number;
  courses_taken: number;
  courses_approved: number;
  cgpa: number;
  graduation_status: string;
}

interface ProbationData {
  cgpa_threshold: number;
  total_on_probation: number;
  students: ProbationStudent[];
  by_department: Array<{
    department: string;
    code: string;
    total_on_probation: number;
    avg_cgpa: number;
  }>;
}

export default function Page() {
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const [graduationData, setGraduationData] = useState<GraduationProjection | null>(null);
  const [probationData, setProbationData] = useState<ProbationData | null>(null);
  const [departments, setDepartments] = useState<Array<{ id: number; name: string; code: string }>>([]);
  const [programmes, setProgrammes] = useState<Array<{ id: number; name: string; code: string }>>([]);

  const [performanceModalOpen, setPerformanceModalOpen] = useState(false);
  const [graduationModalOpen, setGraduationModalOpen] = useState(false);
  const [probationModalOpen, setProbationModalOpen] = useState(false);

  // Filter states
  const [performanceFilters, setPerformanceFilters] = useState({
    academic_year: new Date().getFullYear().toString(),
    semester: '1',
    department: '',
  });

  const [graduationFilters, setGraduationFilters] = useState({
    year: new Date().getFullYear().toString(),
    programme: '',
  });

  const [probationFilters, setProbationFilters] = useState({
    cgpa_below: '2.0',
    department: '',
  });

  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportType, setReportType] = useState<'performance' | 'graduation' | 'probation'>('performance');
  const [reportTitle, setReportTitle] = useState('');
  const [isHydrated, setIsHydrated] = useState(false);

  // Load initial data
  useEffect(() => {
    setIsHydrated(true);

    const loadInitialData = async () => {
      try {
        const [perfRes, gradRes, probRes, deptRes, progRes] = await Promise.all([
          fetch('/api/dean/reports/performance'),
          fetch('/api/dean/reports/graduation-projection'),
          fetch('/api/dean/reports/probation'),
          fetch('/api/departments'),
          fetch('/api/programmes'),
        ]);

        if (perfRes.ok) setPerformanceData(await perfRes.json());
        if (gradRes.ok) setGraduationData(await gradRes.json());
        if (probRes.ok) setProbationData(await probRes.json());
        if (deptRes.ok) {
          const deptList = await deptRes.json();
          setDepartments(Array.isArray(deptList) ? deptList : deptList.data || []);
        }
        if (progRes.ok) {
          const progList = await progRes.json();
          setProgrammes(Array.isArray(progList) ? progList : progList.data || []);
        }
      } catch (err) {
        console.error('Error loading report data:', err);
      }
    };

    loadInitialData();
  }, []);

  const handlePerformanceReport = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        department: performanceFilters.department || '',
      });

      const res = await fetch(`/api/dean/reports/performance?${params}`);
      if (!res.ok) throw new Error('Failed to generate report');

      const data: PerformanceData = await res.json();
      setPerformanceData(data);
      setPerformanceModalOpen(false);
    } catch (err) {
      console.error('Error generating performance report:', err);
      alert('Failed to generate report');
    }
  }, [performanceFilters]);

  const handleGraduationReport = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        year: graduationFilters.year,
        programme: graduationFilters.programme || '',
      });

      const res = await fetch(`/api/dean/reports/graduation-projection?${params}`);
      if (!res.ok) throw new Error('Failed to generate report');

      const data: GraduationProjection = await res.json();
      setGraduationData(data);
      setGraduationModalOpen(false);
    } catch (err) {
      console.error('Error generating graduation report:', err);
      alert('Failed to generate report');
    }
  }, [graduationFilters]);

  const handleProbationReport = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        cgpa_below: probationFilters.cgpa_below,
        department: probationFilters.department || '',
      });

      const res = await fetch(`/api/dean/reports/probation?${params}`);
      if (!res.ok) throw new Error('Failed to generate report');

      const data: ProbationData = await res.json();
      setProbationData(data);
      setProbationModalOpen(false);
    } catch (err) {
      console.error('Error generating probation report:', err);
      alert('Failed to generate report');
    }
  }, [probationFilters]);

  const exportPerformancePDF = useCallback(() => {
    if (!performanceData) return;

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Faculty Performance Report', 14, 20);

    doc.setFontSize(12);
    doc.text(`Overall Average CGPA: ${performanceData.overall_avg_cgpa.toFixed(2)}`, 14, 35);

    const tableData = performanceData.department_performance.map((dept) => [
      dept.code,
      dept.department,
      dept.total_students.toString(),
      dept.avg_cgpa.toFixed(2),
      dept.approved_courses.toString(),
    ]);

    autoTable(doc, {
      head: [['Dept Code', 'Department', 'Students', 'Avg CGPA', 'Approved Courses']],
      body: tableData,
      startY: 45,
    });

    doc.save('faculty-performance-report.pdf');
  }, [performanceData]);

  const exportPerformanceExcel = useCallback(() => {
    if (!performanceData) return;

    const ws = XLSX.utils.json_to_sheet(performanceData.department_performance);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Performance');
    XLSX.writeFile(wb, 'faculty-performance-report.xlsx');
  }, [performanceData]);

  const exportGraduationPDF = useCallback(() => {
    if (!graduationData) return;

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`Graduation Projection Report - ${graduationData.year}`, 14, 20);

    doc.setFontSize(12);
    doc.text(`Expected Graduates: ${graduationData.expected_graduates}`, 14, 35);
    doc.text(`Already Graduated: ${graduationData.already_graduated}`, 14, 42);
    doc.text(`Eligible Now: ${graduationData.eligible_now}`, 14, 49);
    doc.text(`Pending Verification: ${graduationData.pending_verification}`, 14, 56);

    const tableData = graduationData.by_programme.map((prog) => [
      prog.code,
      prog.programme,
      prog.eligible.toString(),
      prog.graduated.toString(),
      prog.pending.toString(),
      prog.expected_total.toString(),
    ]);

    autoTable(doc, {
      head: [['Code', 'Programme', 'Eligible', 'Graduated', 'Pending', 'Expected Total']],
      body: tableData,
      startY: 65,
    });

    doc.save('graduation-projection-report.pdf');
  }, [graduationData]);

  const exportGraduationExcel = useCallback(() => {
    if (!graduationData) return;

    const ws = XLSX.utils.json_to_sheet(graduationData.by_programme);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Graduation');
    XLSX.writeFile(wb, 'graduation-projection-report.xlsx');
  }, [graduationData]);

  const exportProbationPDF = useCallback(() => {
    if (!probationData) return;

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`Academic Probation Report`, 14, 20);

    doc.setFontSize(12);
    doc.text(`CGPA Below: ${probationData.cgpa_threshold}`, 14, 35);
    doc.text(`Total On Probation: ${probationData.total_on_probation}`, 14, 42);

    const tableData = probationData.students.map((student) => [
      student.full_name,
      student.email,
      student.programme,
      student.department,
      student.cgpa.toFixed(2),
      `${student.courses_approved}/${student.courses_taken}`,
    ]);

    autoTable(doc, {
      head: [['Name', 'Email', 'Programme', 'Department', 'CGPA', 'Progress']],
      body: tableData,
      startY: 50,
    });

    doc.save('probation-report.pdf');
  }, [probationData]);

  const exportProbationExcel = useCallback(() => {
    if (!probationData) return;

    const ws = XLSX.utils.json_to_sheet(probationData.students);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Probation');
    XLSX.writeFile(wb, 'probation-report.xlsx');
  }, [probationData]);

  const handleCreateReport = useCallback(async () => {
    if (!reportTitle.trim()) {
      alert('Please provide a title for the report.');
      return;
    }

    try {
      if (reportType === 'performance') {
        await handlePerformanceReport();
      } else if (reportType === 'graduation') {
        await handleGraduationReport();
      } else if (reportType === 'probation') {
        await handleProbationReport();
      }

      setReportModalOpen(false);
    } catch (err) {
      console.error('Error creating report:', err);
      alert('Unable to create report. Please try again.');
    }
  }, [reportTitle, reportType, handlePerformanceReport, handleGraduationReport, handleProbationReport]);

  return (
    <div suppressHydrationWarning className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div suppressHydrationWarning className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 mb-2">Dean Reports</h1>
              <p className="text-slate-600">Generate faculty reports and keep a structured decision trail for review meetings.</p>
            </div>
            {isHydrated && (
              <button
                type="button"
                onClick={() => setReportModalOpen(true)}
                className="inline-flex items-center rounded-full bg-slate-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-900"
              >
                Create Report
              </button>
            )}
          </div>
        </div>

        {/* Report Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Faculty Performance Card */}
          <div className="bg-white rounded-lg shadow-md border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Faculty Performance</h3>
              <span className="text-2xl font-bold text-blue-600">{performanceData?.overall_avg_cgpa.toFixed(2) || '3.4'}</span>
            </div>
            <p className="text-slate-600 text-sm mb-4">Average CGPA</p>
            <div className="flex gap-2">
              <button
                onClick={() => setPerformanceModalOpen(true)}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-medium text-sm"
              >
                Generate Report
              </button>
              {performanceData && (
                <div className="flex gap-1">
                  <button
                    onClick={exportPerformancePDF}
                    className="px-3 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition text-sm font-medium"
                    title="Export PDF"
                  >
                    PDF
                  </button>
                  <button
                    onClick={exportPerformanceExcel}
                    className="px-3 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition text-sm font-medium"
                    title="Export Excel"
                  >
                    Excel
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Graduation Projection Card */}
          <div className="bg-white rounded-lg shadow-md border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Graduation Projection</h3>
              <span className="text-2xl font-bold text-green-600">{graduationData?.expected_graduates || '500'}</span>
            </div>
            <p className="text-slate-600 text-sm mb-4">Expected Graduates</p>
            <div className="flex gap-2">
              <button
                onClick={() => setGraduationModalOpen(true)}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition font-medium text-sm"
              >
                Generate Report
              </button>
              {graduationData && (
                <div className="flex gap-1">
                  <button
                    onClick={exportGraduationPDF}
                    className="px-3 py-2 border border-green-600 text-green-600 rounded-lg hover:bg-green-50 transition text-sm font-medium"
                    title="Export PDF"
                  >
                    PDF
                  </button>
                  <button
                    onClick={exportGraduationExcel}
                    className="px-3 py-2 border border-green-600 text-green-600 rounded-lg hover:bg-green-50 transition text-sm font-medium"
                    title="Export Excel"
                  >
                    Excel
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Probation Card */}
          <div className="bg-white rounded-lg shadow-md border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Probation Report</h3>
              <span className="text-2xl font-bold text-orange-600">{probationData?.total_on_probation || '120'}</span>
            </div>
            <p className="text-slate-600 text-sm mb-4">At-Risk Students</p>
            <div className="flex gap-2">
              <button
                onClick={() => setProbationModalOpen(true)}
                className="flex-1 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition font-medium text-sm"
              >
                Generate Report
              </button>
              {probationData && (
                <div className="flex gap-1">
                  <button
                    onClick={exportProbationPDF}
                    className="px-3 py-2 border border-orange-600 text-orange-600 rounded-lg hover:bg-orange-50 transition text-sm font-medium"
                    title="Export PDF"
                  >
                    PDF
                  </button>
                  <button
                    onClick={exportProbationExcel}
                    className="px-3 py-2 border border-orange-600 text-orange-600 rounded-lg hover:bg-orange-50 transition text-sm font-medium"
                    title="Export Excel"
                  >
                    Excel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Performance Chart */}
        {performanceData && performanceData.department_performance.length > 0 && (
          <div className="bg-white rounded-lg shadow-md border border-slate-200 p-6 mb-8">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Department Performance</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={performanceData.department_performance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="code" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="avg_cgpa" fill="#3b82f6" name="Average CGPA" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Graduation Chart */}
        {graduationData && graduationData.by_programme.length > 0 && (
          <div className="bg-white rounded-lg shadow-md border border-slate-200 p-6 mb-8">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Graduation Status by Programme</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={graduationData.by_programme}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="code" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="eligible" fill="#10b981" name="Eligible" />
                <Bar dataKey="graduated" fill="#3b82f6" name="Graduated" />
                <Bar dataKey="pending" fill="#f59e0b" name="Pending" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Probation Table */}
        {probationData && probationData.students.length > 0 && (
          <div className="bg-white rounded-lg shadow-md border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">At-Risk Students (CGPA &lt; {probationData.cgpa_threshold})</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-slate-900">Name</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-900">Email</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-900">Programme</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-900">Department</th>
                    <th className="text-center px-4 py-3 font-semibold text-slate-900">CGPA</th>
                    <th className="text-center px-4 py-3 font-semibold text-slate-900">Progress</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {probationData.students.slice(0, 10).map((student) => (
                    <tr key={student.id} className="hover:bg-slate-50 transition">
                      <td className="px-4 py-3 text-slate-900">{student.full_name}</td>
                      <td className="px-4 py-3 text-slate-600">{student.email}</td>
                      <td className="px-4 py-3 text-slate-900">{student.programme}</td>
                      <td className="px-4 py-3 text-slate-900">{student.department}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`font-semibold ${student.cgpa < 1.5 ? 'text-red-600' : student.cgpa < 2.0 ? 'text-orange-600' : 'text-yellow-600'}`}>
                          {student.cgpa.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-slate-600">
                        {student.courses_approved}/{student.courses_taken}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {probationData.students.length > 10 && (
                <p className="text-slate-600 text-sm mt-2">Showing 10 of {probationData.students.length} students</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Performance Report Modal */}
      <Modal open={performanceModalOpen} onClose={() => setPerformanceModalOpen(false)}>
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Faculty Performance Report</h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="performance-year" className="block text-sm font-medium text-slate-900 mb-2">Academic Year</label>
              <input
                id="performance-year"
                type="number"
                value={performanceFilters.academic_year}
                onChange={(e) => setPerformanceFilters({ ...performanceFilters, academic_year: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="performance-semester" className="block text-sm font-medium text-slate-900 mb-2">Semester</label>
              <select
                id="performance-semester"
                value={performanceFilters.semester}
                onChange={(e) => setPerformanceFilters({ ...performanceFilters, semester: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="1">Semester 1</option>
                <option value="2">Semester 2</option>
              </select>
            </div>
            <div>
              <label htmlFor="performance-department" className="block text-sm font-medium text-slate-900 mb-2">Department</label>
              <select
                id="performance-department"
                value={performanceFilters.department}
                onChange={(e) => setPerformanceFilters({ ...performanceFilters, department: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.code}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button
              onClick={() => setPerformanceModalOpen(false)}
              className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-900 hover:bg-slate-50 transition font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handlePerformanceReport}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
            >
              Generate Report
            </button>
          </div>
        </div>
      </Modal>

      {/* Graduation Report Modal */}
      <Modal open={graduationModalOpen} onClose={() => setGraduationModalOpen(false)}>
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Graduation Projection Report</h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="graduation-year" className="block text-sm font-medium text-slate-900 mb-2">Year</label>
              <input
                id="graduation-year"
                type="number"
                value={graduationFilters.year}
                onChange={(e) => setGraduationFilters({ ...graduationFilters, year: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label htmlFor="graduation-programme" className="block text-sm font-medium text-slate-900 mb-2">Programme</label>
              <select
                id="graduation-programme"
                value={graduationFilters.programme}
                onChange={(e) => setGraduationFilters({ ...graduationFilters, programme: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">All Programmes</option>
                {programmes.map((prog) => (
                  <option key={prog.id} value={prog.code}>
                    {prog.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button
              onClick={() => setGraduationModalOpen(false)}
              className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-900 hover:bg-slate-50 transition font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleGraduationReport}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
            >
              Generate Report
            </button>
          </div>
        </div>
      </Modal>

      {/* Probation Report Modal */}
      <Modal open={probationModalOpen} onClose={() => setProbationModalOpen(false)}>
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Academic Probation Report</h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="probation-cgpa" className="block text-sm font-medium text-slate-900 mb-2">CGPA Below</label>
              <input
                id="probation-cgpa"
                type="number"
                step="0.1"
                value={probationFilters.cgpa_below}
                onChange={(e) => setProbationFilters({ ...probationFilters, cgpa_below: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label htmlFor="probation-department" className="block text-sm font-medium text-slate-900 mb-2">Department</label>
              <select
                id="probation-department"
                value={probationFilters.department}
                onChange={(e) => setProbationFilters({ ...probationFilters, department: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.code}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button
              onClick={() => setProbationModalOpen(false)}
              className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-900 hover:bg-slate-50 transition font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleProbationReport}
              className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-medium"
            >
              Generate Report
            </button>
          </div>
        </div>
      </Modal>

      {/* Create Report Modal */}
      <Modal open={reportModalOpen} onClose={() => setReportModalOpen(false)}>
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Create New Report</h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="report-title" className="block text-sm font-medium text-slate-900 mb-2">Report Title</label>
              <input
                id="report-title"
                type="text"
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
                placeholder="Enter report title"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-800"
              />
            </div>
            <div>
              <label htmlFor="report-type" className="block text-sm font-medium text-slate-900 mb-2">Report Type</label>
              <select
                id="report-type"
                value={reportType}
                onChange={(e) => setReportType(e.target.value as 'performance' | 'graduation' | 'probation')}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-800"
              >
                <option value="performance">Faculty Performance</option>
                <option value="graduation">Graduation Projection</option>
                <option value="probation">Probation</option>
              </select>
            </div>

            {reportType === 'performance' && (
              <>
                <div>
                  <label htmlFor="create-performance-year" className="block text-sm font-medium text-slate-900 mb-2">Academic Year</label>
                  <input
                    id="create-performance-year"
                    type="number"
                    value={performanceFilters.academic_year}
                    onChange={(e) => setPerformanceFilters({ ...performanceFilters, academic_year: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="create-performance-semester" className="block text-sm font-medium text-slate-900 mb-2">Semester</label>
                  <select
                    id="create-performance-semester"
                    value={performanceFilters.semester}
                    onChange={(e) => setPerformanceFilters({ ...performanceFilters, semester: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="1">Semester 1</option>
                    <option value="2">Semester 2</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="create-performance-department" className="block text-sm font-medium text-slate-900 mb-2">Department</label>
                  <select
                    id="create-performance-department"
                    value={performanceFilters.department}
                    onChange={(e) => setPerformanceFilters({ ...performanceFilters, department: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Departments</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.code}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {reportType === 'graduation' && (
              <>
                <div>
                  <label htmlFor="create-graduation-year" className="block text-sm font-medium text-slate-900 mb-2">Year</label>
                  <input
                    id="create-graduation-year"
                    type="number"
                    value={graduationFilters.year}
                    onChange={(e) => setGraduationFilters({ ...graduationFilters, year: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label htmlFor="create-graduation-programme" className="block text-sm font-medium text-slate-900 mb-2">Programme</label>
                  <select
                    id="create-graduation-programme"
                    value={graduationFilters.programme}
                    onChange={(e) => setGraduationFilters({ ...graduationFilters, programme: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">All Programmes</option>
                    {programmes.map((prog) => (
                      <option key={prog.id} value={prog.code}>
                        {prog.name}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {reportType === 'probation' && (
              <>
                <div>
                  <label htmlFor="create-probation-cgpa" className="block text-sm font-medium text-slate-900 mb-2">CGPA Below</label>
                  <input
                    id="create-probation-cgpa"
                    type="number"
                    step="0.1"
                    value={probationFilters.cgpa_below}
                    onChange={(e) => setProbationFilters({ ...probationFilters, cgpa_below: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label htmlFor="create-probation-department" className="block text-sm font-medium text-slate-900 mb-2">Department</label>
                  <select
                    id="create-probation-department"
                    value={probationFilters.department}
                    onChange={(e) => setProbationFilters({ ...probationFilters, department: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">All Departments</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.code}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={() => setReportModalOpen(false)}
              className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-900 hover:bg-slate-50 transition font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateReport}
              className="flex-1 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-950 transition font-medium"
            >
              Create Report
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
