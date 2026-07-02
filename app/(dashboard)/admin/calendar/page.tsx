export default function AcademicCalendarPage() {
  const events = [
    'Registration Opens',
    'Registration Closes',
    'Result Entry Opens',
    'Result Entry Closes',
    'Examination Dates',
    'Graduation Date',
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Academic Calendar</h1>
        <p className="mt-2 text-sm text-slate-600">Track and manage key university milestones and deadlines.</p>
      </section>
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <ul className="grid gap-2 text-sm text-slate-700 md:grid-cols-2">
          {events.map((event) => (
            <li key={event} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">{event}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
