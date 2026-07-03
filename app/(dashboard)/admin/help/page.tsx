'use client';

import { useEffect, useState } from 'react';

type HelpPayload = {
  version: string;
  docs: Array<{ title: string; content: string }>;
  faqs: Array<{ question: string; answer: string }>;
  support: { email: string; phone: string };
};

export default function HelpSupportPage() {
  const [data, setData] = useState<HelpPayload | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    void loadHelp();
  }, []);

  async function loadHelp() {
    try {
      const response = await fetch('/api/admin/help', { cache: 'no-store' });
      const payload = (await response.json()) as HelpPayload | { error?: string };
      if (!response.ok) throw new Error((payload as { error?: string }).error || 'Failed to load help resources');
      setData(payload as HelpPayload);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load help resources');
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Help & Support</h1>
        <p className="mt-2 text-sm text-slate-600">Documentation, FAQs, support contacts, and release notes for administrators.</p>
        <p className="mt-2 text-xs text-slate-500">Version: {data?.version || 'unknown'}</p>
      </section>

      {error ? <p className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</p> : null}

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="font-semibold text-slate-900">Documentation</h2>
          <div className="mt-2 space-y-2 text-sm text-slate-700">
            {(data?.docs || []).map((item) => (
              <div key={item.title} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="font-semibold text-slate-900">{item.title}</p>
                <p className="text-xs text-slate-600">{item.content}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="font-semibold text-slate-900">FAQs</h2>
          <div className="mt-2 space-y-2 text-sm text-slate-700">
            {(data?.faqs || []).map((item) => (
              <div key={item.question} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="font-semibold text-slate-900">{item.question}</p>
                <p className="text-xs text-slate-600">{item.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="font-semibold text-slate-900">Contact Support</h2>
        <p className="mt-2 text-sm text-slate-700">Email: {data?.support?.email || '-'}</p>
        <p className="text-sm text-slate-700">Phone: {data?.support?.phone || '-'}</p>
      </section>
    </div>
  );
}
