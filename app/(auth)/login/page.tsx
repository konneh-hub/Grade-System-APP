'use client';

import LoginForm from '@/components/auth/LoginForm';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();

  function handleSuccess(data: { roles?: string[] }) {
    const roles = data.roles || [];
    if (roles.includes('admin')) {
      router.push('/dashboard/admin');
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
      <section className="relative hidden overflow-hidden rounded-[2rem] bg-[#2563EB] px-8 py-12 text-white shadow-xl lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-y-0 right-0 w-2/3 bg-gradient-to-b from-[#3B82F6] to-[#2563EB] opacity-20 blur-3xl" />
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
          <div className="h-20 w-20 rounded-full bg-white/10" />
        </div>
      </section>

      <section className="mx-auto w-full max-w-[420px]">
        <div className="rounded-2xl bg-white p-8 shadow-xl ring-1 ring-slate-200 sm:p-10">
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#2563EB]">Welcome back</p>
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
