import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/config/database';
import { requireRoles } from '@/lib/middleware/authorization';

export async function GET(req: Request) {
  const guard = requireRoles(req, ['admin','system_admin']);
  if ('error' in guard) return guard.error;

  const params = new URL(req.url).searchParams;
  const idsParam = String(params.get('ids') ?? '').trim();
  if (!idsParam) {
    return NextResponse.json({ error: 'ids query parameter is required' }, { status: 400 });
  }

  const ids = idsParam.split(',').map((item) => Number(item.trim())).filter(Number.isFinite);
  if (ids.length === 0) {
    return NextResponse.json({ error: 'ids query parameter must contain valid numbers' }, { status: 400 });
  }

  const placeholders = ids.map(() => '?').join(',');
  const db = getDatabase();
  const rows = db
    .prepare(
      `SELECT s.id, s.user_id, s.matric_number, s.program_id, s.department_id, s.current_level, s.entry_session_id, s.graduation_status, s.created_at, s.updated_at,
              u.email AS student_email,
              TRIM(COALESCE(u.first_name, '') || ' ' || COALESCE(u.last_name, '')) AS student_name
       FROM students s
       LEFT JOIN users u ON u.id = s.user_id
       WHERE s.id IN (${placeholders})`
    )
    .all(...ids) as Array<Record<string, unknown>>;

  return NextResponse.json(rows);
}
