export default function SystemSettingsPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">System Settings</h1>
        <p className="mt-2 text-sm text-slate-600">Configure general, authentication, email, and storage settings for the platform.</p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {['General', 'Authentication', 'Email', 'Storage'].map((category) => (
          <div key={category} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h2 className="font-semibold text-slate-900">{category}</h2>
          </div>
        ))}
      </section>
    </div>
  );
}
