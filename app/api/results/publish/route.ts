import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/config/database';
import { requireAuthRole, writeAudit } from '@/app/api/results/_shared';
import { sendTemplatedEmail } from '@/lib/email/send';

export async function POST(req: Request) {
  const guard = requireAuthRole(req, ['exam_officer']);
  if ('error' in guard) return guard.error;

  const body = (await req.json()) as { result_id?: number };
  const resultId = Number(body.result_id ?? 0);
  if (!Number.isFinite(resultId) || resultId <= 0) {
    return NextResponse.json({ error: 'result_id is required' }, { status: 400 });
  }

  const db = getDatabase();
  const existing = db.prepare('SELECT id, status FROM results WHERE id = ?').get(resultId) as { id: number; status: string } | null;
  if (!existing) return NextResponse.json({ error: 'Result not found' }, { status: 404 });
  if (existing.status !== 'approved') return NextResponse.json({ error: 'Only approved results can be published' }, { status: 409 });

  db.prepare('UPDATE results SET status = ? WHERE id = ?').run('published', resultId);
  writeAudit('Result published', resultId, { published_by: guard.auth.user.id, role: guard.auth.roles.join(',') });

  try {
    const row = db
      .prepare(
        `SELECT u.email as email, u.first_name as first_name, c.code as course_code, c.title as course_title, s.name as session_name
         FROM results r
         JOIN students st ON r.student_id = st.id
         JOIN users u ON st.user_id = u.id
         JOIN courses c ON r.course_id = c.id
         LEFT JOIN academic_sessions s ON r.academic_session_id = s.id
         WHERE r.id = ?`
      )
      .get(resultId) as
      | { email: string; first_name: string; course_code: string; course_title: string; session_name: string }
      | null;

    if (row?.email) {
      const appUrl = process.env.APP_URL ?? 'http://localhost:3000';
      sendTemplatedEmail({
        to: row.email,
        type: 'result_publication',
        data: {
          firstName: row.first_name,
          courseCode: row.course_code,
          courseTitle: row.course_title,
          sessionName: row.session_name,
          resultsUrl: `${appUrl}/student/results/${resultId}`,
        },
        subject: `Results published: ${row.course_code}`,
      }).catch((e) => console.error('Result notification failed:', e));
    }
  } catch (e) {
    console.error('Failed to send result notification', e);
  }

  return NextResponse.json({ ok: true, id: resultId, status: 'published' });
}
