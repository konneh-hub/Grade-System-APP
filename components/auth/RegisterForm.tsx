"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterForm() {
  const [registrationType, setRegistrationType] = useState<'staff' | 'student'>('staff');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [registrationToken, setRegistrationToken] = useState('');
  const [studentId, setStudentId] = useState('');
  const [fullName, setFullName] = useState('');
  const [faculty, setFaculty] = useState('');
  const [department, setDepartment] = useState('');
  const [academicLevel, setAcademicLevel] = useState('year1');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          registration_token: registrationType === 'staff' ? registrationToken : undefined,
          student_id: registrationType === 'student' ? studentId : undefined,
          full_name: registrationType === 'student' ? fullName : undefined,
          faculty: registrationType === 'student' ? faculty : undefined,
          department: registrationType === 'student' ? department : undefined,
          academic_level: registrationType === 'student' ? academicLevel : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Registration failed');
      const roles: string[] = Array.isArray(data?.roles) ? data.roles : [];
      if (roles.includes('admin')) {
        router.push('/admin');
        return;
      }
      if (roles.includes('dean')) {
        router.push('/dashboard/dean');
        return;
      }
      if (roles.includes('hod')) {
        router.push('/dashboard/hod');
        return;
      }
      if (roles.includes('lecturer')) {
        router.push('/dashboard/lecturer');
        return;
      }
      if (roles.includes('exam_officer') || roles.includes('exam-officer')) {
        router.push('/dashboard/exam-officer');
        return;
      }
      router.push('/dashboard/student');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="space-y-2">
        <label htmlFor="register-type" className="block text-sm font-medium text-[#475569]">
          Registration type
        </label>
        <select
          id="register-type"
          value={registrationType}
          onChange={(e) => setRegistrationType(e.target.value as 'staff' | 'student')}
          className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-[#2563EB] focus:ring-4 focus:ring-[#3B82F6]/20"
        >
          <option value="staff">Staff</option>
          <option value="student">Student</option>
        </select>
      </div>
      <div className="space-y-2">
        <label htmlFor="register-email" className="block text-sm font-medium text-[#475569]">
          Email
        </label>
        <input
          id="register-email"
          title="Email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          required
          className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-[#2563EB] focus:ring-4 focus:ring-[#3B82F6]/20"
        />
      </div>
      {registrationType === 'staff' ? (
        <div className="space-y-2">
          <label htmlFor="register-token" className="block text-sm font-medium text-[#475569]">
            Registration token
          </label>
          <input
            id="register-token"
            title="Registration token"
            placeholder="Enter registration token"
            value={registrationToken}
            onChange={(e) => setRegistrationToken(e.target.value)}
            required
            className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-[#2563EB] focus:ring-4 focus:ring-[#3B82F6]/20"
          />
        </div>
      ) : (
        <>
          <div className="space-y-2">
            <label htmlFor="register-student-id" className="block text-sm font-medium text-[#475569]">
              Student ID
            </label>
            <input
              id="register-student-id"
              title="Student ID"
              placeholder="Enter your student ID"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              required
              className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-[#2563EB] focus:ring-4 focus:ring-[#3B82F6]/20"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="register-full-name" className="block text-sm font-medium text-[#475569]">
              Full name
            </label>
            <input
              id="register-full-name"
              title="Full name"
              placeholder="Enter full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-[#2563EB] focus:ring-4 focus:ring-[#3B82F6]/20"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="register-faculty" className="block text-sm font-medium text-[#475569]">
              Faculty
            </label>
            <input
              id="register-faculty"
              title="Faculty"
              placeholder="Enter faculty"
              value={faculty}
              onChange={(e) => setFaculty(e.target.value)}
              required
              className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-[#2563EB] focus:ring-4 focus:ring-[#3B82F6]/20"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="register-department" className="block text-sm font-medium text-[#475569]">
              Department
            </label>
            <input
              id="register-department"
              title="Department"
              placeholder="Enter department"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              required
              className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-[#2563EB] focus:ring-4 focus:ring-[#3B82F6]/20"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="register-level" className="block text-sm font-medium text-[#475569]">
              Academic level
            </label>
            <select
              id="register-level"
              value={academicLevel}
              onChange={(e) => setAcademicLevel(e.target.value)}
              className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-[#2563EB] focus:ring-4 focus:ring-[#3B82F6]/20"
            >
              <option value="year1">Year 1</option>
              <option value="year2">Year 2</option>
              <option value="year3">Year 3</option>
              <option value="year4">Year 4</option>
              <option value="year5">Year 5</option>
            </select>
          </div>
        </>
      )}
      <div className="space-y-2">
        <label htmlFor="register-password" className="block text-sm font-medium text-[#475569]">
          Password
        </label>
        <input
          id="register-password"
          title="Password"
          placeholder="Create a password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          required
          className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-[#2563EB] focus:ring-4 focus:ring-[#3B82F6]/20"
        />
      </div>
      <p className="text-sm leading-6 text-[#475569]">
        Staff registration requires admin-issued token. Students register using Student ID, email, full name, faculty, department, and academic level.
      </p>
      {error && <div className="text-sm text-red-600">{error}</div>}
      <button
        type="submit"
        disabled={loading}
        className="inline-flex w-full h-12 items-center justify-center rounded-xl bg-[#2563EB] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1d4ed8] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#3B82F6]/40 disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {loading ? 'Creating...' : 'Create account'}
      </button>
    </form>
  );
}
