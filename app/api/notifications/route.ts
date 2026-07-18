import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/config/database';
import { requireAuth, requireRoles, ensureOwnsUserOrRole } from '@/lib/middleware/authorization';

function ensureNotificationScheduleTable() {
  const db = getDatabase();
  db.exec(`CREATE TABLE IF NOT EXISTS notification_schedules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    channel TEXT NOT NULL DEFAULT 'in_app',
    target_audience TEXT NOT NULL DEFAULT 'all',
    scheduled_for TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'scheduled',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);
}

export async function GET(req: Request) {
  const guard = requireRoles(req, ['admin','system_admin']);
  if ('error' in guard) return guard.error;
  ensureNotificationScheduleTable();
  const db = getDatabase();
  const rows = db
    .prepare(
      `SELECT n.id, n.recipient_id, n.title, n.body, n.channel, n.is_read, n.created_at,
              u.email AS recipient_email
       FROM notifications n
       LEFT JOIN users u ON u.id = n.recipient_id
       ORDER BY datetime(n.created_at) DESC`
    )
    .all();
  const scheduled = db.prepare('SELECT id, title, body, channel, target_audience, scheduled_for, status, created_at FROM notification_schedules WHERE status = ? ORDER BY datetime(scheduled_for) ASC').all('scheduled');

  const notifications = Array.isArray(rows) ? rows : rows ? [rows] : [];
  const scheduledList = Array.isArray(scheduled) ? scheduled : scheduled ? [scheduled] : [];

  return NextResponse.json({ notifications, scheduled: scheduledList });
}

export async function POST(req: Request) {
  const guard = requireRoles(req, ['admin','system_admin']);
  if ('error' in guard) return guard.error;
  ensureNotificationScheduleTable();
  const body = (await req.json()) as Record<string, unknown>;
  const title = String(body.title ?? '').trim();
  const message = String(body.message ?? body.body ?? '').trim();
  const deliveryType = String(body.deliveryType ?? body.channel ?? 'dashboard').toLowerCase();
  const targetAudience = String(body.targetAudience ?? 'all').toLowerCase();
  const scheduledFor = body.scheduled_for != null ? String(body.scheduled_for).trim() : '';

  if (!title || !message) {
    return NextResponse.json({ error: 'title and message are required' }, { status: 400 });
  }

  const db = getDatabase();
  if (scheduledFor) {
    const created = db
      .prepare(
        `INSERT INTO notification_schedules (title, body, channel, target_audience, scheduled_for, status, created_at)
         VALUES (?, ?, ?, ?, ?, 'scheduled', CURRENT_TIMESTAMP)`
      )
      .run(title, message, deliveryType === 'dashboard' ? 'in_app' : deliveryType, targetAudience, scheduledFor) as { lastInsertRowid: number };
    return NextResponse.json({ ok: true, scheduled: true, id: Number(created.lastInsertRowid) }, { status: 201 });
  }

  let recipients: Array<{ id: number }> = [];
  if (targetAudience === 'all') {
    recipients = db.prepare('SELECT id FROM users').all() as Array<{ id: number }>;
  } else {
    recipients = db
      .prepare(
        `SELECT DISTINCT u.id
         FROM users u
         JOIN user_roles ur ON ur.user_id = u.id
         JOIN roles r ON r.id = ur.role_id
         WHERE LOWER(r.name) = ?`
      )
      .all(targetAudience) as Array<{ id: number }>;
  }

  for (const recipient of recipients) {
    db.prepare(
      `INSERT INTO notifications (recipient_id, title, body, channel, is_read, created_at)
       VALUES (?, ?, ?, ?, 0, CURRENT_TIMESTAMP)`
    ).run(recipient.id, title, message, deliveryType === 'dashboard' ? 'in_app' : deliveryType);
  }

  return NextResponse.json({ ok: true, sent: recipients.length }, { status: 201 });
}

export async function DELETE(req: Request) {
  const guard = requireRoles(req, ['admin','system_admin']);
  if ('error' in guard) return guard.error;
  ensureNotificationScheduleTable();
  const { searchParams } = new URL(req.url);
  const scheduledId = Number(searchParams.get('scheduled_id') ?? 0);
  if (!Number.isFinite(scheduledId) || scheduledId <= 0) {
    return NextResponse.json({ error: 'scheduled_id is required' }, { status: 400 });
  }

  const db = getDatabase();
  const result = db.prepare('DELETE FROM notification_schedules WHERE id = ? AND status = ?').run(scheduledId, 'scheduled') as { changes?: number };
  if (!result.changes) return NextResponse.json({ error: 'Scheduled notification not found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
