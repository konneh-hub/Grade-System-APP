export default function SecurityPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Security Center</h1>
        <p className="mt-2 text-sm text-slate-600">Monitor active sessions, failed logins, blocked users, devices, and force logout actions.</p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {['Active Sessions', 'Login History', 'Failed Logins', 'Blocked Users', 'Device Management', 'Force Logout'].map((item) => (
          <div key={item} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h2 className="font-semibold text-slate-900">{item}</h2>
          </div>
        ))}
      </section>
    </div>
  );
}
