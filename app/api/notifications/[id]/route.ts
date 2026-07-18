import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/config/database';
import { requireAuth, requireRoles, ensureOwnsUserOrRole } from '@/lib/middleware/authorization';

type ParamsContext = { params: Promise<{ id: string }> };

export async function GET(req: Request, context: ParamsContext) {
  const guard = requireRoles(req, ['admin','system_admin']);
  if ('error' in guard) return guard.error;
  const { id } = await context.params;
  const notificationId = Number(id);
  if (!Number.isFinite(notificationId)) return NextResponse.json({ error: 'Invalid notification id' }, { status: 400 });

  const db = getDatabase();
  const row = db
    .prepare(
      `SELECT n.id, n.recipient_id, n.title, n.body, n.channel, n.is_read, n.created_at,
              u.email AS recipient_email
       FROM notifications n
       LEFT JOIN users u ON u.id = n.recipient_id
       WHERE n.id = ?`
    )
    .get(notificationId);

  if (!row) return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
  return NextResponse.json(row);
}

export async function DELETE(req: Request, context: ParamsContext) {
  const guard = requireRoles(req, ['admin','system_admin']);
  if ('error' in guard) return guard.error;
  const { id } = await context.params;
  const notificationId = Number(id);
  if (!Number.isFinite(notificationId)) return NextResponse.json({ error: 'Invalid notification id' }, { status: 400 });

  const db = getDatabase();
  const result = db.prepare('DELETE FROM notifications WHERE id = ?').run(notificationId) as { changes?: number };
  if (!result.changes) return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
