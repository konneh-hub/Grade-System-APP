import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/config/database';
import { requireRoles } from '@/lib/middleware/authorization';

type ParamsContext = { params: Promise<{ id: string }> };

export async function GET(req: Request, context: ParamsContext) {
  const guard = requireRoles(req, ['admin','system_admin']);
  if ('error' in guard) return guard.error;

  const { id } = await context.params;
  const requestId = Number(id);
  if (!Number.isFinite(requestId) || requestId <= 0) {
    return NextResponse.json({ error: 'Invalid carryover request id' }, { status: 400 });
  }

  const db = getDatabase();
  const request = db
    .prepare(
      `SELECT cr.id,
              cr.student_id,
              s.matric_number,
              TRIM(COALESCE(u.first_name, '') || ' ' || COALESCE(u.last_name, '')) AS student_name,
              cr.course_id,
              c.code AS course_code,
              c.title AS course_title,
              cr.academic_session_id,
              asess.name AS academic_session_name,
              cr.reason,
              cr.status,
              cr.requested_at,
              cr.reviewed_at
       FROM carryover_requests cr
       LEFT JOIN students s ON s.id = cr.student_id
       LEFT JOIN users u ON u.id = s.user_id
       LEFT JOIN courses c ON c.id = cr.course_id
       LEFT JOIN academic_sessions asess ON asess.id = cr.academic_session_id
       WHERE cr.id = ?`
    )
    .get(requestId) as Record<string, unknown> | null;

  if (!request) {
    return NextResponse.json({ error: 'Carryover request not found' }, { status: 404 });
  }

  return NextResponse.json(request);
}
