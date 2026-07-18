import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/config/database';
import { requireRoles } from '@/lib/middleware/authorization';

type ParamsContext = { params: Promise<{ id: string }> };

export async function GET(req: Request, context: ParamsContext) {
  const guard = requireRoles(req, ['admin','system_admin']);
  if ('error' in guard) return guard.error;

  const { id } = await context.params;
  const courseId = Number(id);
  if (!Number.isFinite(courseId) || courseId <= 0) {
    return NextResponse.json({ error: 'Invalid course id' }, { status: 400 });
  }

  const db = getDatabase();
  const rows = db
    .prepare(
      `SELECT r.id,
              r.student_id,
              s.matric_number,
              TRIM(COALESCE(u.first_name, '') || ' ' || COALESCE(u.last_name, '')) AS student_name,
              r.course_id,
              r.academic_session_id,
              r.ca_score,
              r.exam_score,
              r.total_score,
              r.grade,
              r.grade_point,
              r.status,
              r.submitted_at,
              r.approved_at
       FROM results r
       LEFT JOIN students s ON s.id = r.student_id
       LEFT JOIN users u ON u.id = s.user_id
       WHERE r.course_id = ?
       ORDER BY datetime(r.submitted_at) DESC`
    )
    .all(courseId) as Array<Record<string, unknown>>;

  return NextResponse.json(rows);
}
