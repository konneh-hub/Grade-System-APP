import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/config/database';
import { requireAuthRole, writeAudit } from '@/app/api/results/_shared';
// email disabled - skipping result publication emails

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
      // email disabled: skip sending result notification
    }
  } catch (e) {
    console.error('Failed to send result notification', e);
  }

  return NextResponse.json({ ok: true, id: resultId, status: 'published' });
}
