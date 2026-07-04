import RegisterForm from '@/components/auth/RegisterForm';
import Link from 'next/link';

export default function RegisterPage() {
  return (
    <div className="grid w-full max-w-7xl gap-10 lg:grid-cols-[1.2fr_1fr]">
      <section className="relative hidden items-center justify-center lg:flex">
        <img src="/slughublogo.png" alt="Slughub" className="h-auto w-full max-w-[600px] animate-float object-contain" />
      </section>

      <section className="w-full animate-fade-in-up">
        <div className="rounded-2xl bg-white p-8 shadow-xl ring-1 ring-slate-200 sm:p-10 relative overflow-hidden">
          <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-[#1E3A8A]/5 blur-3xl" />
          <div className="relative z-10">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#1E3A8A]">Register</p>
            <h1 className="mt-2 text-2xl font-bold text-[#0F172A]">Create your Slughub account</h1>
            <p className="mt-2 text-sm leading-6 text-[#475569]">
              Registration is restricted to provisioned HODs, exam officers, deans, lecturers, and students. Ask your administrator for your token.
            </p>
          </div>
          <div className="relative z-10 mt-7 border-t border-slate-100 pt-7">
            <RegisterForm />
          </div>
          <p className="relative z-10 mt-6 text-center text-sm text-[#475569]">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-[#1E3A8A] transition-all duration-300 hover:text-[#152C6B]">
              Sign in
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
