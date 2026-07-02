import Link from 'next/link';

export default function TopNav() {
  return (
    <header className="border-b border-slate-200 bg-white px-6 py-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-[#2563EB]">Slughub University</p>
          <h1 className="text-xl font-semibold text-slate-900">Admin Control Room</h1>
          <p className="text-xs text-slate-500">Session 2026/2027 - First Semester</p>
        </div>

        <div className="flex min-w-[260px] flex-1 items-center justify-center">
          <div className="relative w-full max-w-xl">
            <input
              type="search"
              placeholder="Search users, courses, logs"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-800 outline-none transition focus:border-[#2563EB] focus:bg-white"
            />
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-500">Instant</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50" type="button">
            Alerts (2)
          </button>
          <button className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50" type="button">
            Notifications
          </button>
          <div className="rounded-full bg-[#EFF6FF] px-3 py-1 text-sm font-medium text-[#2563EB]">System Admin</div>
          <Link href="/logout" className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
            Sign out
          </Link>
        </div>
      </div>
    </header>
  );
}
