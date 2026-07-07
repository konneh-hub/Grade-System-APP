"use client";

import { useEffect, useState } from 'react';

type ProfileData = {
  student: {
    matric_number: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    phone: string | null;
    avatar_url: string | null;
    program_name: string | null;
    department_name: string | null;
    faculty_name: string | null;
    current_level: number;
    entry_session_name: string | null;
    current_session_name: string | null;
    academic_status: string;
    degree_classification: string;
  };
};

function valueOrDefault(value: string | number | null | undefined) {
  if (value == null || value === '') return 'N/A';
  return String(value);
}

export default function Page() {
  const [profile, setProfile] = useState<ProfileData['student'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
    let mounted = true;
    async function loadProfile() {
      try {
        const res = await fetch('/api/students/dashboard', { cache: 'no-store' });
        const json = await res.json();
        if (!res.ok || json.error) {
          throw new Error(json.error ?? 'Failed to load profile');
        }
        if (mounted) setProfile(json.student);
      } catch (err) {
        console.error(err);
        if (mounted) setError(err instanceof Error ? err.message : 'Unable to load profile.');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadProfile();
    return () => {
      mounted = false;
    };
  }, []);

  if (!hydrated || loading) {
    return <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">Loading profile…</div>;
  }

  if (error || !profile) {
    return <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm text-sm text-red-600">{error ?? 'Profile data could not be loaded.'}</div>;
  }

  const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(' ') || 'Student';

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#2563EB]">Profile</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">{fullName}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">Read-only academic and account information for your student profile.</p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Personal information</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Full name</p>
                <p className="mt-1 text-sm text-slate-700">{fullName}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Registration number</p>
                <p className="mt-1 text-sm text-slate-700">{valueOrDefault(profile.matric_number)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Email</p>
                <p className="mt-1 text-sm text-slate-700">{valueOrDefault(profile.email)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Phone</p>
                <p className="mt-1 text-sm text-slate-700">{valueOrDefault(profile.phone)}</p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-slate-900">Academic information</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Faculty</p>
                <p className="mt-1 text-sm text-slate-700">{valueOrDefault(profile.faculty_name)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Department</p>
                <p className="mt-1 text-sm text-slate-700">{valueOrDefault(profile.department_name)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Programme</p>
                <p className="mt-1 text-sm text-slate-700">{valueOrDefault(profile.program_name)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Current level</p>
                <p className="mt-1 text-sm text-slate-700">{valueOrDefault(profile.current_level)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Admission session</p>
                <p className="mt-1 text-sm text-slate-700">{valueOrDefault(profile.entry_session_name)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Current session</p>
                <p className="mt-1 text-sm text-slate-700">{valueOrDefault(profile.current_session_name)}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Academic standing</p>
            <p className="mt-2 text-xl font-semibold text-slate-900">{valueOrDefault(profile.academic_status)}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Degree classification</p>
            <p className="mt-2 text-xl font-semibold text-slate-900">{valueOrDefault(profile.degree_classification)}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Profile access</p>
            <p className="mt-2 text-xl font-semibold text-slate-900">Read-only</p>
          </div>
        </div>
      </section>
    </div>
  );
}
