'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import Modal from '@/components/ui/Modal';

type Course = {
  id: number;
  code: string;
  title: string;
  programme: string;
  level: string;
  students: number;
  status: string;
  assignedDate: string;
  creditUnits: number;
  semester: string;
  session: string;
};

const coursesData: Course[] = [
  {
    id: 1,
    code: 'CSC 302',
    title: 'Data Structures and Algorithms',
    programme: 'Computer Science',
    level: '300',
    students: 42,
    status: 'Pending Scores',
    assignedDate: '2026-01-20',
    creditUnits: 3,
    semester: '2',
    session: '2025/2026',
  },
  {
    id: 2,
    code: 'CSC 218',
    title: 'Database Management Systems',
    programme: 'Computer Science',
    level: '200',
    students: 38,
    status: 'Completed',
    assignedDate: '2026-01-19',
    creditUnits: 3,
    semester: '2',
    session: '2025/2026',
  },
  {
    id: 3,
    code: 'STA 301',
    title: 'Applied Statistics',
    programme: 'Statistics',
    level: '300',
    students: 29,
    status: 'In Progress',
    assignedDate: '2026-01-22',
    creditUnits: 3,
    semester: '2',
    session: '2025/2026',
  },
];

export default function Page() {
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [downloadFormat, setDownloadFormat] = useState<'pdf' | 'excel'>('pdf');

  const totalCourses = coursesData.length;
  const completedCourses = coursesData.filter((course) => course.status === 'Completed').length;
  const totalStudents = coursesData.reduce((sum, course) => sum + course.students, 0);
  const currentSemesterCourses = coursesData.filter((course) => course.semester === '2').length;

  const openDetailModal = (course: Course) => {
    setSelectedCourse(course);
    setDetailModalOpen(true);
  };

  const openDownloadModal = (course: Course) => {
    setSelectedCourse(course);
    setDownloadModalOpen(true);
    setDownloadFormat('pdf');
  };

  const handleDownload = () => {
    alert(`Downloading ${selectedCourse?.code} registration list as ${downloadFormat.toUpperCase()}`);
    setDownloadModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#2563EB]">Assigned courses</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">Your course assignments</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Review all assigned courses, class sizes, and submission status for the current semester.
            </p>
          </div>
          <Link href="/lecturer/courses" className="inline-flex items-center rounded-full bg-slate-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-900">
            Refresh list
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Total Courses</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{totalCourses}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Current Semester Courses</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{currentSemesterCourses}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Total Students</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{totalStudents}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Completed Courses</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{completedCourses}</p>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Assigned Courses</h2>
            <p className="text-sm text-slate-600">View course details and actions for each assignment.</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead>
              <tr>
                <th className="px-3 py-3 text-left font-semibold text-slate-700">Course Code</th>
                <th className="px-3 py-3 text-left font-semibold text-slate-700">Course Title</th>
                <th className="px-3 py-3 text-left font-semibold text-slate-700">Programme</th>
                <th className="px-3 py-3 text-left font-semibold text-slate-700">Level</th>
                <th className="px-3 py-3 text-center font-semibold text-slate-700">Students</th>
                <th className="px-3 py-3 text-left font-semibold text-slate-700">Status</th>
                <th className="px-3 py-3 text-right font-semibold text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {coursesData.map((course) => (
                <tr key={course.id} className="hover:bg-slate-50">
                  <td className="px-3 py-3 text-slate-700">{course.code}</td>
                  <td className="px-3 py-3 text-slate-700">{course.title}</td>
                  <td className="px-3 py-3 text-slate-700">{course.programme}</td>
                  <td className="px-3 py-3 text-slate-700">{course.level}</td>
                  <td className="px-3 py-3 text-center text-slate-700">{course.students}</td>
                  <td className="px-3 py-3 text-slate-700">{course.status}</td>
                  <td className="px-3 py-3 text-right text-slate-700">
                    <div className="flex flex-wrap justify-end gap-2">
                      <button
                        onClick={() => openDetailModal(course)}
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        View Students
                      </button>
                      <Link href={`/lecturer/courses/${course.id}/scores`} className="rounded-lg bg-[#2563EB] px-3 py-2 text-sm font-semibold text-white hover:bg-[#1D4ED8]">
                        Enter Scores
                      </Link>
                      <button
                        onClick={() => openDownloadModal(course)}
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        Download
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <Modal open={detailModalOpen} onClose={() => setDetailModalOpen(false)}>
        <div className="bg-white rounded-lg p-6 w-full max-w-xl">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Course Details</h3>
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-slate-600">Course Code</dt>
              <dd className="mt-1 text-sm text-slate-900">{selectedCourse?.code}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-slate-600">Course Title</dt>
              <dd className="mt-1 text-sm text-slate-900">{selectedCourse?.title}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-slate-600">Credit Units</dt>
              <dd className="mt-1 text-sm text-slate-900">{selectedCourse?.creditUnits}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-slate-600">Programme</dt>
              <dd className="mt-1 text-sm text-slate-900">{selectedCourse?.programme}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-slate-600">Semester</dt>
              <dd className="mt-1 text-sm text-slate-900">{selectedCourse?.semester}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-slate-600">Session</dt>
              <dd className="mt-1 text-sm text-slate-900">{selectedCourse?.session}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-slate-600">Assigned Date</dt>
              <dd className="mt-1 text-sm text-slate-900">{selectedCourse?.assignedDate}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-slate-600">Number of Students</dt>
              <dd className="mt-1 text-sm text-slate-900">{selectedCourse?.students}</dd>
            </div>
          </dl>
          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={() => setDetailModalOpen(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={downloadModalOpen} onClose={() => setDownloadModalOpen(false)}>
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Download Registration List</h3>
          <div className="space-y-4">
            <p className="text-sm text-slate-600">Choose the download format for the selected course list.</p>
            <label className="block text-sm font-medium text-slate-900">Format</label>
            <select
              value={downloadFormat}
              onChange={(event) => setDownloadFormat(event.target.value as 'pdf' | 'excel')}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-800"
            >
              <option value="pdf">PDF</option>
              <option value="excel">Excel</option>
            </select>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={() => setDownloadModalOpen(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={handleDownload}
              className="rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1D4ED8]"
            >
              Download
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
