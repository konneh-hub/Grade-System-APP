export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Admin Profile</h1>
        <p className="mt-2 text-sm text-slate-600">View and manage profile, password, MFA, and profile photo settings.</p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {['Edit Profile', 'Change Password', 'Enable MFA', 'Upload Profile Picture'].map((item) => (
          <div key={item} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h2 className="font-semibold text-slate-900">{item}</h2>
          </div>
        ))}
      </section>
    </div>
  );
}
