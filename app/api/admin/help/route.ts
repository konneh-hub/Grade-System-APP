import { NextResponse } from 'next/server';
import packageJson from '@/package.json';
import { requireAuth, requireRoles, ensureOwnsUserOrRole } from '@/lib/middleware/authorization';

export async function GET(req: Request) {
  const guard = requireRoles(req, ['admin','system_admin']);
  if ('error' in guard) return guard.error;
  return NextResponse.json({
    version: packageJson.version,
    docs: [
      { title: 'Administrator Guide', content: 'Manage users, academic structures, reports, and system security.' },
      { title: 'Result Workflow', content: 'Lecturers enter scores, HoD/Dean approve, Exam Officer publishes.' },
    ],
    faqs: [
      { question: 'Who can assign lecturers to courses?', answer: 'Only HoD can assign lecturers to courses.' },
      { question: 'Can administrators publish results?', answer: 'No. Result publication is restricted to Exam Officer role.' },
      { question: 'How can I reactivate a suspended account?', answer: 'Open User Status and set account status to active.' },
    ],
    support: {
      email: 'support@slughub.edu',
      phone: '+231-000-000-000',
    },
    release_notes: [
      { version: packageJson.version, date: '2026-07-03', note: 'Admin modules wiring and API coverage improvements.' },
      { version: '0.0.9', date: '2026-06-18', note: 'Role dashboards and initial reporting modules.' },
    ],
  });
}

export async function POST(req: Request) {
  const guard = requireRoles(req, ['admin','system_admin']);
  if ('error' in guard) return guard.error;
  const body = (await req.json()) as { subject?: string; message?: string; email?: string };
  const subject = String(body.subject ?? '').trim();
  const message = String(body.message ?? '').trim();
  const email = String(body.email ?? '').trim();

  if (!subject || !message) {
    return NextResponse.json({ error: 'subject and message are required' }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    ticket_id: `SUP-${Date.now()}`,
    submitted_by: email || 'anonymous',
  }, { status: 201 });
}
