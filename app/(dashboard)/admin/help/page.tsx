'use client';

import { useEffect, useState } from 'react';

type HelpPayload = {
  version: string;
  docs: Array<{ title: string; content: string }>;
  faqs: Array<{ question: string; answer: string }>;
  support: { email: string; phone: string };
  release_notes?: Array<{ version: string; date: string; note: string }>;
};

export default function HelpSupportPage() {
  const [data, setData] = useState<HelpPayload | null>(null);
  const [error, setError] = useState('');
  const [issue, setIssue] = useState({ subject: '', message: '', email: '' });
  const [issueFeedback, setIssueFeedback] = useState('');

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

  async function submitIssue() {
    setIssueFeedback('');
    const response = await fetch('/api/admin/help', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(issue),
    });
    const payload = (await response.json()) as { error?: string; ticket_id?: string };
    if (!response.ok) {
      setIssueFeedback(payload.error || 'Failed to submit issue');
      return;
    }
    setIssueFeedback(`Issue submitted. Ticket: ${payload.ticket_id}`);
    setIssue({ subject: '', message: '', email: '' });
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

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="font-semibold text-slate-900">Release Notes</h2>
        <div className="mt-2 space-y-2 text-sm text-slate-700">
          {(data?.release_notes || []).map((item) => (
            <div key={`${item.version}-${item.date}`} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <p className="font-semibold text-slate-900">{item.version} - {item.date}</p>
              <p className="text-xs text-slate-600">{item.note}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="font-semibold text-slate-900">Report Issue</h2>
        <div className="mt-2 grid gap-2 md:grid-cols-2">
          <input className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Subject" value={issue.subject} onChange={(event) => setIssue((prev) => ({ ...prev, subject: event.target.value }))} />
          <input className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Your email (optional)" value={issue.email} onChange={(event) => setIssue((prev) => ({ ...prev, email: event.target.value }))} />
          <textarea className="md:col-span-2 rounded-lg border border-slate-300 px-3 py-2 text-sm" rows={4} placeholder="Describe the issue" value={issue.message} onChange={(event) => setIssue((prev) => ({ ...prev, message: event.target.value }))} />
          <button type="button" onClick={submitIssue} className="md:col-span-2 rounded-lg bg-[#1A3A6B] px-4 py-2 text-sm font-semibold text-white">Submit Issue</button>
          {issueFeedback ? <p className="md:col-span-2 text-sm text-slate-700">{issueFeedback}</p> : null}
        </div>
      </section>
    </div>
  );
}
