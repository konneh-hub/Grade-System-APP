import { NextResponse, NextRequest } from 'next/server';
import { getDatabase } from '@/lib/config/database';
import { requireRoles } from '@/lib/middleware/authorization';

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const guard = requireRoles(req, ['admin','system_admin']);
  if ('error' in guard) return guard.error;

  const params = await context.params;
  const courseId = Number(params.id);
  if (!Number.isFinite(courseId) || courseId <= 0) {
    return NextResponse.json({ error: 'Invalid course id' }, { status: 400 });
  }

  const db = getDatabase();
  const rows = db
    .prepare(
      `SELECT ca.id,
              ca.course_id,
              ca.lecturer_id,
              TRIM(COALESCE(u.first_name, '') || ' ' || COALESCE(u.last_name, '')) AS lecturer_name,
              ca.academic_session_id,
              ca.semester,
              ca.status,
              ca.created_at
       FROM course_assignments ca
       LEFT JOIN users u ON u.id = ca.lecturer_id
       WHERE ca.course_id = ?
       ORDER BY datetime(ca.created_at) DESC`
    )
    .all(courseId) as Array<Record<string, unknown>>;

  return NextResponse.json(rows);
}
