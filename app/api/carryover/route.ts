import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/config/database';
import { requireRoles } from '@/lib/middleware/authorization';

type CountRow = { count: number | string | null };

export async function GET(req: Request) {
  const guard = requireRoles(req, ['admin','system_admin']);
  if ('error' in guard) return guard.error;

  const url = new URL(req.url);
  const status = String(url.searchParams.get('status') ?? '').trim().toLowerCase();

  const db = getDatabase();
  const filters: string[] = [];
  const params: unknown[] = [];

  if (status) {
    filters.push('LOWER(cr.status) = ?');
    params.push(status);
  }

  const whereClause = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';

  const requests = db
    .prepare(
      `SELECT cr.id,
              cr.student_id,
              s.matric_number,
              u.email AS student_email,
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
       ${whereClause}
       ORDER BY datetime(cr.requested_at) DESC`
    )
    .all(...params) as Array<Record<string, unknown>>;

  const summary = {
    total: Number((db.prepare('SELECT COUNT(*) AS count FROM carryover_requests').get() as CountRow | undefined)?.count ?? 0),
    pending: Number((db.prepare("SELECT COUNT(*) AS count FROM carryover_requests WHERE LOWER(status) = 'pending'").get() as CountRow | undefined)?.count ?? 0),
    approved: Number((db.prepare("SELECT COUNT(*) AS count FROM carryover_requests WHERE LOWER(status) = 'approved'").get() as CountRow | undefined)?.count ?? 0),
    rejected: Number((db.prepare("SELECT COUNT(*) AS count FROM carryover_requests WHERE LOWER(status) = 'rejected'").get() as CountRow | undefined)?.count ?? 0),
  };

  return NextResponse.json({ summary, requests });
}
