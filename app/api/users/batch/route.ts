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
      `SELECT u.id, u.email, u.first_name, u.last_name, u.phone, u.avatar_url, u.status, u.registered_at, u.last_login_at,
              GROUP_CONCAT(r.name, ',') AS roles
       FROM users u
       LEFT JOIN user_roles ur ON ur.user_id = u.id
       LEFT JOIN roles r ON r.id = ur.role_id
       WHERE u.id IN (${placeholders})
       GROUP BY u.id`
    )
    .all(...ids) as Array<Record<string, unknown>>;

  const normalized = rows.map((row) => ({
    ...row,
    roles: typeof row.roles === 'string' && row.roles.length > 0 ? String(row.roles).split(',') : [],
  }));

  return NextResponse.json(normalized);
}
