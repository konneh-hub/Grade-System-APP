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
    <div className="grid w-full max-w-7xl gap-10 lg:grid-cols-[1.2fr_1fr]">
      <section className="relative hidden items-center justify-center lg:flex">
        <img src="/slughublogo.png" alt="Slughub" className="h-auto w-full max-w-[600px] animate-float object-contain" />
      </section>

      <section className="mx-auto w-full max-w-[420px] animate-fade-in-up">
        <div className="rounded-2xl bg-white p-8 shadow-xl ring-1 ring-slate-200 sm:p-10 relative overflow-hidden">
          <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-[#1E3A8A]/5 blur-3xl" />
          <div className="relative z-10">
            <div className="flex flex-col items-center text-center">
              <div className="animate-float">
                <img src="/slughublogo.png" alt="Slughub" className="h-16 w-16 object-contain" />
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
