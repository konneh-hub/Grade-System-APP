import RegisterForm from '@/components/auth/RegisterForm';
import Link from 'next/link';

export default function RegisterPage() {
  return (
    <div className="grid w-full max-w-7xl gap-10 lg:grid-cols-[1.2fr_1fr]">
      <section className="relative hidden items-center justify-center lg:flex">
        <img src="/slughublogo.png" alt="Slughub" className="h-auto w-full max-w-[600px] object-contain" />
      </section>

      <section className="w-full">
        <div className="rounded-2xl bg-white p-8 shadow-xl ring-1 ring-slate-200 sm:p-10">
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#1E3A8A]">Register</p>
            <h1 className="text-3xl font-semibold text-[#0F172A]">Create your Slughub account</h1>
            <p className="text-sm leading-6 text-[#475569]">
              Registration is restricted to provisioned HODs, exam officers, deans, lecturers, and students. Ask your administrator for your token.
            </p>
          </div>
          <div className="mt-8">
            <RegisterForm />
          </div>
          <p className="mt-6 text-center text-sm text-[#475569]">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-[#1E3A8A] transition hover:text-[#152C6B]">
              Sign in
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
