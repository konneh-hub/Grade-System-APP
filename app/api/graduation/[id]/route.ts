import { NextResponse, NextRequest } from 'next/server';
import { getDatabase } from '@/lib/config/database';
import { requireRoles } from '@/lib/middleware/authorization';
export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const guard = requireRoles(req, ['admin','system_admin']);
  if ('error' in guard) return guard.error;

  const params = await context.params;
  const graduationId = Number(params.id);
  if (!Number.isFinite(graduationId) || graduationId <= 0) {
    return NextResponse.json({ error: 'Invalid graduation application id' }, { status: 400 });
  }

  const db = getDatabase();
  const row = db
    .prepare(
      `SELECT ga.id,
              ga.student_id,
              s.matric_number,
              TRIM(COALESCE(u.first_name, '') || ' ' || COALESCE(u.last_name, '')) AS student_name,
              p.name AS programme_name,
              d.name AS department_name,
              asess.name AS academic_session_name,
              ga.status,
              ga.eligibility_status,
              ga.remarks,
              ga.submitted_at,
              ga.reviewed_at
       FROM graduation_applications ga
       LEFT JOIN students s ON s.id = ga.student_id
       LEFT JOIN users u ON u.id = s.user_id
       LEFT JOIN programs p ON p.id = s.program_id
       LEFT JOIN departments d ON d.id = s.department_id
       LEFT JOIN academic_sessions asess ON asess.id = ga.academic_session_id
       WHERE ga.id = ?`
    )
    .get(graduationId) as Record<string, unknown> | null;

  if (!row) {
    return NextResponse.json({ error: 'Graduation application not found' }, { status: 404 });
  }

  return NextResponse.json(row);
}
