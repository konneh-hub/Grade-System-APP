import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/config/database';

export async function GET() {
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

  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const body = (await req.json()) as Record<string, unknown>;
  const title = String(body.title ?? '').trim();
  const message = String(body.message ?? body.body ?? '').trim();
  const deliveryType = String(body.deliveryType ?? body.channel ?? 'dashboard').toLowerCase();
  const targetAudience = String(body.targetAudience ?? 'all').toLowerCase();

  if (!title || !message) {
    return NextResponse.json({ error: 'title and message are required' }, { status: 400 });
  }

  const db = getDatabase();
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
