import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/config/database';
import { requireAuth } from '@/lib/middleware/authorization';

type ParamsContext = { params: Promise<{ id: string }> };

export async function GET(req: Request, context: ParamsContext) {
  const auth = requireAuth(req);
  if ('error' in auth) return auth.error;

  const { id } = await context.params;
  const studentId = Number(id);
  if (!Number.isFinite(studentId) || studentId <= 0) {
    return NextResponse.json({ error: 'Invalid student id' }, { status: 400 });
  }

  const db = getDatabase();
  const student = db
    .prepare(
      `SELECT s.id,
              s.user_id,
              s.matric_number,
              s.program_id,
              s.department_id,
              s.current_level,
              s.entry_session_id,
              s.graduation_status,
              s.created_at,
              s.updated_at,
              u.email AS student_email,
              TRIM(COALESCE(u.first_name, '') || ' ' || COALESCE(u.last_name, '')) AS student_name
       FROM students s
       LEFT JOIN users u ON u.id = s.user_id
       WHERE s.id = ?`
    )
    .get(studentId) as Record<string, unknown> | null;

  if (!student) {
    return NextResponse.json({ error: 'Student not found' }, { status: 404 });
  }

  const userId = Number(student.user_id ?? 0);
  const roles = Array.isArray(auth.info.roles) ? auth.info.roles : [];
  const isAdmin = roles.includes('admin') || roles.includes('system_admin');
  if (!isAdmin && auth.info.user.id !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json(student);
}
