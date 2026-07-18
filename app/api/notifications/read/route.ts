import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/config/database';
import { requireRoles } from '@/lib/middleware/authorization';

export async function GET(req: Request) {
  const guard = requireRoles(req, ['admin','system_admin']);
  if ('error' in guard) return guard.error;

  const db = getDatabase();
  const rows = db
    .prepare(
      `SELECT n.id, n.recipient_id, n.title, n.body, n.channel, n.is_read, n.created_at,
              u.email AS recipient_email
       FROM notifications n
       LEFT JOIN users u ON u.id = n.recipient_id
       WHERE n.is_read = 1
       ORDER BY datetime(n.created_at) DESC`
    )
    .all() as Array<Record<string, unknown>>;

  return NextResponse.json(rows);
}
