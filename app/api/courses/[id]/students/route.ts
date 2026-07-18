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
      `SELECT ce.id,
              ce.student_id,
              s.matric_number,
              TRIM(COALESCE(u.first_name, '') || ' ' || COALESCE(u.last_name, '')) AS student_name,
              s.program_id,
              s.department_id,
              ce.academic_session_id,
              ce.status,
              ce.created_at
       FROM course_enrollments ce
       LEFT JOIN students s ON s.id = ce.student_id
       LEFT JOIN users u ON u.id = s.user_id
       WHERE ce.course_id = ?
       ORDER BY datetime(ce.created_at) DESC`
    )
    .all(courseId) as Array<Record<string, unknown>>;

  return NextResponse.json(rows);
}
