import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/config/database';

type ParamsContext = { params: Promise<{ id: string }> };

export async function GET(_req: Request, context: ParamsContext) {
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

export async function DELETE(_req: Request, context: ParamsContext) {
  const { id } = await context.params;
  const notificationId = Number(id);
  if (!Number.isFinite(notificationId)) return NextResponse.json({ error: 'Invalid notification id' }, { status: 400 });

  const db = getDatabase();
  const result = db.prepare('DELETE FROM notifications WHERE id = ?').run(notificationId) as { changes?: number };
  if (!result.changes) return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
