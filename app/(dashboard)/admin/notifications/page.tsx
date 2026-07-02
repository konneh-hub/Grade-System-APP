export default function NotificationsPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Notification Management</h1>
        <p className="mt-2 text-sm text-slate-600">Send and track dashboard, email, and optional SMS notifications.</p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {['All Users', 'Lecturers', 'Students', 'HoDs', 'Deans', 'Exam Officers'].map((group) => (
          <div key={group} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h2 className="font-semibold text-slate-900">Send to {group}</h2>
          </div>
        ))}
      </section>
    </div>
  );
}
