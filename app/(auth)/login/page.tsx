'use client';

import LoginForm from '@/components/auth/LoginForm';
import AuthModal from '@/components/auth/AuthModal';
import { useRouter } from 'next/navigation';
import { useState, useCallback } from 'react';

export default function LoginPage() {
  const router = useRouter();
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [pendingRoles, setPendingRoles] = useState<string[]>([]);

  const handleSuccess = useCallback((data: { roles?: string[]; user?: { email?: string } }) => {
    setUserEmail(data?.user?.email || '');
    setPendingRoles(data?.roles || []);
    setShowSuccessModal(true);
  }, []);

  function closeSuccessAndRedirect() {
    setShowSuccessModal(false);
    const roles = pendingRoles;
    if (roles.includes('admin')) { router.push('/admin'); return; }
    if (roles.includes('dean')) { router.push('/dashboard/dean'); return; }
    if (roles.includes('hod')) { router.push('/dashboard/hod'); return; }
    if (roles.includes('lecturer')) { router.push('/dashboard/lecturer'); return; }
    if (roles.includes('exam_officer') || roles.includes('exam-officer')) { router.push('/dashboard/exam-officer'); return; }
    router.push('/dashboard/student');
  }

  function handleError(_message: string) {
    setShowErrorModal(true);
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

      <section className="mx-auto w-full max-w-[420px] animate-fade-in-up">
        <div className="rounded-2xl bg-white p-8 shadow-xl ring-1 ring-slate-200 sm:p-10 relative overflow-hidden">
          <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-[#1E3A8A]/5 blur-3xl" />
          <div className="relative z-10">
            <div className="flex flex-col items-center text-center">
              <div className="animate-float">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" className="h-16 w-16 text-[#1E3A8A]">
                  <circle cx="32" cy="32" r="30" stroke="currentColor" strokeWidth="1.5" className="opacity-20" />
                  <path d="M32 12L14 22v12c0 8.84 8.06 16 18 16s18-7.16 18-16V22L32 12Z" fill="currentColor" className="opacity-10" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M32 12L14 22v4l18-10 18 10v-4L32 12Z" fill="currentColor" className="opacity-25" />
                  <path d="M18 28v6c0 6.63 6.27 12 14 12s14-5.37 14-12v-6" stroke="currentColor" strokeWidth="1.5" fill="none" />
                  <path d="M27 31l3 3 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h1 className="mt-5 text-2xl font-bold leading-tight text-[#0F172A]">
                Sierra Leone University<br />
                <span className="text-[#1E3A8A]">Grading Hub</span>
              </h1>
              <p className="mt-2 text-sm leading-5 text-[#64748B] max-w-xs">
                Academic results &amp; student administration portal
              </p>
            </div>
            <div className="mt-7 border-t border-slate-100 pt-7">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#94A3B8]">Sign in</p>
              <LoginForm onSuccess={handleSuccess} onError={handleError} />
            </div>
          </div>
        </div>
      </section>

      <AuthModal
        open={showSuccessModal}
        onClose={closeSuccessAndRedirect}
        type="success"
        email={userEmail}
      />
      <AuthModal
        open={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        type="error"
      />
    </div>
  );
}
