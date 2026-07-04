'use client';

import LoginForm from '@/components/auth/LoginForm';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();

  function handleSuccess(data: { roles?: string[] }) {
    const roles = data.roles || [];
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
  }

  return (
    <div className="grid w-full max-w-6xl gap-10 lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative hidden overflow-hidden rounded-[2rem] bg-[#1E3A8A] px-8 py-12 text-white shadow-xl lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-y-0 right-0 w-2/3 bg-gradient-to-b from-[#1D4ED8] to-[#1E3A8A] opacity-20 blur-3xl" />
        <div className="relative z-10">
          <p className="text-sm uppercase tracking-[0.3em] text-sky-200">Secure access</p>
          <h2 className="mt-6 text-4xl font-semibold leading-tight text-white">A calm, confident login experience.</h2>
          <p className="mt-5 max-w-md text-base text-slate-200">
            Sign in to manage results, assignments, and student workflows with a polished authentication layout built for clarity and focus.
          </p>
        </div>
        <div className="relative z-10 mt-8 flex items-end justify-between gap-4">
          <div className="rounded-3xl bg-white/10 p-4 text-sm text-slate-100 shadow-lg">
            Fast, secure, and easy to use.
          </div>
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/10">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-10 w-10 text-white/80">
              <path d="M5.625 3.75a2.625 2.625 0 0 0-2.625 2.625v.75h16.5v-.75a2.625 2.625 0 0 0-2.625-2.625h-11.25Z" />
              <path fillRule="evenodd" d="M3 9.75v7.5a2.625 2.625 0 0 0 2.625 2.625h11.25A2.625 2.625 0 0 0 19.5 17.25v-7.5H3Zm4.594 1.28a.75.75 0 0 1 1.062 0l1.594 1.594 3.438-3.44a.75.75 0 0 1 1.062 1.062l-3.969 3.97a.75.75 0 0 1-1.062 0L7.594 12.25a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[420px]">
        <div className="rounded-2xl bg-white p-8 shadow-xl ring-1 ring-slate-200 sm:p-10">
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#1E3A8A]">Welcome back</p>
            <h1 className="text-3xl font-semibold text-[#0F172A]">Sign in to your account</h1>
            <p className="text-sm leading-6 text-[#475569]">
              Enter your email and password to continue to the Slughub portal.
            </p>
          </div>
          <div className="mt-8">
            <LoginForm onSuccess={handleSuccess} />
          </div>
        </div>
      </section>
    </div>
  );
}
