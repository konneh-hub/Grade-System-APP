import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/config/database';
import { requireRoles } from '@/lib/middleware/authorization';

export async function GET(req: Request) {
  const guard = requireRoles(req, ['admin','system_admin']);
  if ('error' in guard) return guard.error;

  const searchParams = new URL(req.url).searchParams;
  const status = String(searchParams.get('status') ?? '').trim();
  const eligibility = String(searchParams.get('eligibility') ?? '').trim();

  const db = getDatabase();
  const conditions: string[] = [];
  const params: Array<string> = [];
  if (status) {
    conditions.push('ga.status = ?');
    params.push(status);
  }
  if (eligibility) {
    conditions.push('ga.eligibility_status = ?');
    params.push(eligibility);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const rows = db
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
              ga.submitted_at,
              ga.reviewed_at
       FROM graduation_applications ga
       LEFT JOIN students s ON s.id = ga.student_id
       LEFT JOIN users u ON u.id = s.user_id
       LEFT JOIN programs p ON p.id = s.program_id
       LEFT JOIN departments d ON d.id = s.department_id
       LEFT JOIN academic_sessions asess ON asess.id = ga.academic_session_id
       ${whereClause}
       ORDER BY datetime(ga.submitted_at) DESC`
    )
    .all(...params) as Array<Record<string, unknown>>;

  return NextResponse.json(rows);
}
