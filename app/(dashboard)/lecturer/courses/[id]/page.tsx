'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Modal from '@/components/ui/Modal';

type Student = {
  id: number;
  studentId: string;
  fullName: string;
  programme: string;
  level: string;
  ca: number | null;
  exam: number | null;
  total: number | null;
  grade: string;
  status: string;
};

const studentData: Student[] = [
  { id: 1, studentId: 'CS/21/001', fullName: 'Aisha Conteh', programme: 'Computer Science', level: '300', ca: 22, exam: 45, total: 67, grade: 'B', status: 'Complete' },
  { id: 2, studentId: 'CS/21/010', fullName: 'Mohamed Sesay', programme: 'Computer Science', level: '300', ca: 18, exam: 40, total: 58, grade: 'C', status: 'Complete' },
  { id: 3, studentId: 'CS/21/015', fullName: 'Zainab Kamara', programme: 'Computer Science', level: '300', ca: 12, exam: null, total: null, grade: '-', status: 'Missing Score' },
  { id: 4, studentId: 'CS/21/023', fullName: 'Fatmata Jalloh', programme: 'Computer Science', level: '300', ca: 25, exam: 49, total: 74, grade: 'B+', status: 'Complete' },
];

export default function Page({ params }: { params: { id: string } }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentModalOpen, setStudentModalOpen] = useState(false);

  const router = useRouter();

  const filteredStudents = useMemo(() => {
    const lowerQuery = searchQuery.toLowerCase();
    return studentData.filter((student) =>
      student.fullName.toLowerCase().includes(lowerQuery) ||
      student.studentId.toLowerCase().includes(lowerQuery) ||
      student.programme.toLowerCase().includes(lowerQuery)
    );
  }, [searchQuery]);

  const registeredStudents = studentData.length;
  const maleStudents = 18;
  const femaleStudents = 11;
  const missingScoreCount = studentData.filter((student) => student.status === 'Missing Score').length;

  const openStudentModal = (student: Student) => {
    setSelectedStudent(student);
    setStudentModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#2563EB]">Student list</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">Course {params.id} student roster</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Review registered students, filter records, and manage missing or incorrect score entries.
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push(`/lecturer/courses/${params.id}/scores`)}
            className="inline-flex items-center rounded-full bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1D4ED8]"
          >
            Enter Scores
          </button>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Registered Students</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{registeredStudents}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Male Students</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{maleStudents}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Female Students</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{femaleStudents}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Students with Missing Scores</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{missingScoreCount}</p>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Registered students</h2>
            <p className="text-sm text-slate-600">Search by name, registration number, or programme.</p>
          </div>
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search students"
            className="h-11 w-full max-w-sm rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead>
              <tr>
                <th className="px-3 py-3 text-left font-semibold text-slate-700">Student ID</th>
                <th className="px-3 py-3 text-left font-semibold text-slate-700">Student Name</th>
                <th className="px-3 py-3 text-left font-semibold text-slate-700">Programme</th>
                <th className="px-3 py-3 text-left font-semibold text-slate-700">Level</th>
                <th className="px-3 py-3 text-center font-semibold text-slate-700">CA</th>
                <th className="px-3 py-3 text-center font-semibold text-slate-700">Exam</th>
                <th className="px-3 py-3 text-center font-semibold text-slate-700">Total</th>
                <th className="px-3 py-3 text-left font-semibold text-slate-700">Grade</th>
                <th className="px-3 py-3 text-left font-semibold text-slate-700">Status</th>
                <th className="px-3 py-3 text-right font-semibold text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.map((student) => (
                <tr key={student.id} className="hover:bg-slate-50">
                  <td className="px-3 py-3 text-slate-700">{student.studentId}</td>
                  <td className="px-3 py-3 text-slate-700">{student.fullName}</td>
                  <td className="px-3 py-3 text-slate-700">{student.programme}</td>
                  <td className="px-3 py-3 text-slate-700">{student.level}</td>
                  <td className="px-3 py-3 text-center text-slate-700">{student.ca ?? '-'}</td>
                  <td className="px-3 py-3 text-center text-slate-700">{student.exam ?? '-'}</td>
                  <td className="px-3 py-3 text-center text-slate-700">{student.total ?? '-'}</td>
                  <td className="px-3 py-3 text-slate-700">{student.grade}</td>
                  <td className="px-3 py-3 text-slate-700">{student.status}</td>
                  <td className="px-3 py-3 text-right text-slate-700">
                    <div className="flex flex-wrap justify-end gap-2">
                      <button
                        onClick={() => openStudentModal(student)}
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        View
                      </button>
                      <button
                        onClick={() => router.push(`/lecturer/courses/${params.id}/scores`)}
                        className="rounded-lg bg-[#2563EB] px-3 py-2 text-sm font-semibold text-white hover:bg-[#1D4ED8]"
                      >
                        Edit Score
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <Modal open={studentModalOpen} onClose={() => setStudentModalOpen(false)}>
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Student Information</h3>
          <div className="space-y-3 text-sm text-slate-700">
            <div>
              <p className="text-slate-500">Student ID</p>
              <p className="font-semibold">{selectedStudent?.studentId}</p>
            </div>
            <div>
              <p className="text-slate-500">Full Name</p>
              <p className="font-semibold">{selectedStudent?.fullName}</p>
            </div>
            <div>
              <p className="text-slate-500">Programme</p>
              <p className="font-semibold">{selectedStudent?.programme}</p>
            </div>
            <div>
              <p className="text-slate-500">Level</p>
              <p className="font-semibold">{selectedStudent?.level}</p>
            </div>
            <div>
              <p className="text-slate-500">Registered Courses</p>
              <p className="font-semibold">3</p>
            </div>
            <div>
              <p className="text-slate-500">Academic Status</p>
              <p className="font-semibold">Good Standing</p>
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <button
              onClick={() => setStudentModalOpen(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
