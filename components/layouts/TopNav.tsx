import Link from 'next/link';

export default function TopNav() {
  return (
    <header className="border-b border-slate-200 bg-white px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-[#2563EB]">Welcome back</p>
          <h1 className="text-xl font-semibold text-slate-900">Slughub administration</h1>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/logout" className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
            Sign out
          </Link>
        </div>
      </div>
    </header>
  );
}
